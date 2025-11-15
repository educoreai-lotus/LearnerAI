import { Job } from '../../domain/entities/Job.js';
import { LearningPath } from '../../domain/entities/LearningPath.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * GenerateLearningPathUseCase
 * Orchestrates the three-prompt flow for learning path generation
 */
export class GenerateLearningPathUseCase {
  constructor({ 
    geminiClient, 
    skillsEngineClient, 
    repository, 
    jobRepository, 
    promptLoader, 
    cacheRepository,
    checkApprovalPolicyUseCase,
    requestPathApprovalUseCase,
    distributePathUseCase,
    skillsGapRepository // Add skills gap repository to fetch updated data
  }) {
    this.geminiClient = geminiClient;
    this.skillsEngineClient = skillsEngineClient;
    this.repository = repository;
    this.jobRepository = jobRepository;
    this.promptLoader = promptLoader;
    this.cacheRepository = cacheRepository;
    this.checkApprovalPolicyUseCase = checkApprovalPolicyUseCase;
    this.requestPathApprovalUseCase = requestPathApprovalUseCase;
    this.distributePathUseCase = distributePathUseCase;
    this.skillsGapRepository = skillsGapRepository;
  }

  /**
   * Execute - Creates a job and returns job ID
   * This is the synchronous entry point
   */
  async execute(skillsGap) {
    // Validate skills gap
    if (!skillsGap.userId || !skillsGap.companyId || !skillsGap.competencyTargetName) {
      throw new Error('Skills gap must have userId, companyId, and competencyTargetName');
    }

    const competencyTargetName = skillsGap.competencyTargetName;

    // Create job
    const job = new Job({
      id: uuidv4(),
      userId: skillsGap.userId,
      companyId: skillsGap.companyId,
      competencyTargetName: competencyTargetName,
      type: 'path-generation',
      status: 'pending'
    });

    const createdJob = await this.jobRepository.createJob(job);

    // Start background processing (fire and forget)
    this.processJob(createdJob, skillsGap).catch(error => {
      console.error('Background job processing failed:', error);
      this.jobRepository.updateJob(createdJob.id, {
        status: 'failed',
        error: error.message
      });
    });

    return {
      jobId: createdJob.id,
      status: createdJob.status
    };
  }

  /**
   * ProcessJob - Executes the three-prompt flow asynchronously
   */
  async processJob(job, skillsGap) {
    try {
      // Update job to processing
      await this.jobRepository.updateJob(job.id, {
        status: 'processing',
        currentStage: 'skill-expansion',
        progress: 10
      });

      // Fetch the latest skills_raw_data from database (after Skills Engine update)
      let skillsRawData = null;
      if (this.skillsGapRepository) {
        try {
          // Get the most recent skills gap for this user and competency
          const gaps = await this.skillsGapRepository.getSkillsGapsByUser(skillsGap.userId);
          const competencyTargetName = skillsGap.competencyTargetName;
          const relevantGap = gaps.find(g => g.competency_target_name === competencyTargetName) || gaps[0];
          
          if (relevantGap && relevantGap.skills_raw_data) {
            skillsRawData = relevantGap.skills_raw_data;
            console.log(`✅ Using updated skills_raw_data from database for user ${skillsGap.userId}`);
          }
        } catch (error) {
          console.warn(`⚠️  Could not fetch skills_raw_data from database: ${error.message}`);
          // Fallback to request data
        }
      }

      // Prompt 1: Skill Expansion
      // Use updated skills_raw_data from database if available, otherwise use request data
      const prompt1 = await this.promptLoader.loadPrompt('prompt1-skill-expansion');
      const prompt1Input = this._formatSkillsGapForPrompt(skillsGap, skillsRawData);
      const fullPrompt1 = prompt1.replace('{input}', prompt1Input);
      const prompt1Result = await this.geminiClient.executePrompt(fullPrompt1, '', {
        timeout: 60000, // 60 seconds for skill expansion
        maxRetries: 3
      });

      await this.jobRepository.updateJob(job.id, {
        currentStage: 'competency-identification',
        progress: 30
      });

      // Extract competencies from Prompt 1 result (new format includes structured competencies)
      const prompt1Competencies = this._extractCompetenciesFromPrompt1(prompt1Result);

      // Prompt 2: Prepare standardized queries for Skills Engine
      const prompt2 = await this.promptLoader.loadPrompt('prompt2-competency-identification');
      // Format Prompt 1 result for Prompt 2 input
      const prompt2Input = prompt1Competencies.length > 0 
        ? JSON.stringify({ expanded_competencies_list: prompt1Competencies.map(c => ({
            competency_name: c.name,
            competency_type: c.type || 'Out-of-the-Box',
            target_level: c.targetLevel || 'Intermediate',
            justification: c.description
          })) }, null, 2)
        : this._formatPrompt1Result(prompt1Result);
      const fullPrompt2 = prompt2.replace('{input}', prompt2Input);
      const prompt2Result = await this.geminiClient.executePrompt(fullPrompt2, '', {
        timeout: 60000, // 60 seconds for competency identification
        maxRetries: 3
      });

      // Extract competencies prepared for Skills Engine
      const competencies = this._extractCompetenciesFromPrompt2(prompt2Result);

      await this.jobRepository.updateJob(job.id, {
        currentStage: 'skill-breakdown',
        progress: 50
      });

      // Request skill breakdown from Skills Engine
      const skillBreakdown = await this.skillsEngineClient.requestSkillBreakdown(competencies);

      // Cache the skill breakdown in Supabase (upsert operation)
      if (this.cacheRepository && skillBreakdown) {
        try {
          await this.cacheRepository.upsertSkillBreakdown(skillsGap.userId, skillBreakdown);
          console.log(`✅ Cached skills for learner ${skillsGap.userId}`);
        } catch (error) {
          console.warn(`⚠️ Failed to cache skills: ${error.message}`);
          // Don't fail the entire process if caching fails
        }
      }

      await this.jobRepository.updateJob(job.id, {
        currentStage: 'path-creation',
        progress: 70
      });

      // Prompt 3: Path Creation
      // Use longer timeout for path creation as it generates complex structured output
      const prompt3 = await this.promptLoader.loadPrompt('prompt3-path-creation');
      const prompt3Input = this._formatPathCreationInput(skillsGap, skillBreakdown);
      const fullPrompt3 = prompt3
        .replace('{initialGap}', JSON.stringify(skillsGap.toJSON(), null, 2))
        .replace('{expandedBreakdown}', JSON.stringify(skillBreakdown, null, 2));
      // Path creation needs more time - use 90 seconds timeout (default is 30s)
      const prompt3Result = await this.geminiClient.executePrompt(fullPrompt3, '', {
        timeout: 90000, // 90 seconds for complex path generation
        maxRetries: 3
      });

      // Extract learning path structure from Prompt 3 result
      const pathData = this._extractPathData(prompt3Result, skillsGap.userId);

      // Create learning path entity
      const learningPath = new LearningPath({
        id: uuidv4(),
        userId: skillsGap.userId,
        companyId: skillsGap.companyId,
        competencyTargetName: competencyTargetName,
        pathSteps: pathData.learning_modules || pathData.pathSteps || [],
        pathTitle: pathData.path_title,
        totalDurationHours: pathData.total_estimated_duration_hours,
        pathMetadata: pathData,
        status: 'completed'
      });

      // Save learning path
      const savedPath = await this.repository.saveLearningPath(learningPath);

      // Check approval policy and handle distribution
      await this._handlePathDistribution(savedPath, skillsGap);

      // Mark job as completed
      await this.jobRepository.updateJob(job.id, {
        status: 'completed',
        progress: 100,
        currentStage: 'completed',
        result: { learningPathId: savedPath.id }
      });

      return savedPath;
    } catch (error) {
      console.error('Error processing learning path job:', error);
      await this.jobRepository.updateJob(job.id, {
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle path distribution based on approval policy
   * @private
   */
  async _handlePathDistribution(learningPath, skillsGap) {
    if (!this.checkApprovalPolicyUseCase) {
      console.warn('⚠️  Approval workflow not configured, skipping distribution');
      return;
    }

    try {
      // Check company's approval policy
      const { requiresApproval, company } = await this.checkApprovalPolicyUseCase.execute(skillsGap.companyId);

      if (requiresApproval && company) {
        // Manual approval required - create approval request
        if (this.requestPathApprovalUseCase && company.decisionMaker) {
          await this.requestPathApprovalUseCase.execute({
            learningPathId: learningPath.id,
            companyId: skillsGap.companyId,
            decisionMaker: company.decisionMaker,
            learningPath: learningPath.toJSON()
          });
          console.log(`📋 Approval request created for path ${learningPath.id} (manual approval required)`);
        } else {
          console.warn(`⚠️  Manual approval required but decision maker not configured for company ${skillsGap.companyId}`);
        }
      } else {
        // Auto approval - distribute directly
        if (this.distributePathUseCase) {
          await this.distributePathUseCase.execute(learningPath.id);
          console.log(`✅ Learning path ${learningPath.id} distributed (auto approval)`);
        } else {
          console.warn('⚠️  DistributePathUseCase not configured, skipping distribution');
        }
      }
    } catch (error) {
      console.error('Error handling path distribution:', error.message);
      // Don't fail the entire process if distribution fails
    }
  }

  /**
   * Format skills gap for Prompt 1
   * Uses updated skills_raw_data from database if available, otherwise falls back to request data
   */
  _formatSkillsGapForPrompt(skillsGap, skillsRawData = null) {
    const competencyTargetName = skillsGap.competencyTargetName;
    
    // If we have updated skills_raw_data from database, use that
    if (skillsRawData) {
      return JSON.stringify({
        skills_raw_data: skillsRawData,
        context: {
          userId: skillsGap.userId,
          competencyTargetName: competencyTargetName
        }
      }, null, 2);
    }
    
    // Fallback to request data (for backward compatibility)
    return JSON.stringify({
      microSkills: skillsGap.microSkills || [],
      nanoSkills: skillsGap.nanoSkills || [],
      context: {
        userId: skillsGap.userId,
        competencyTargetName: competencyTargetName
      }
    }, null, 2);
  }

  /**
   * Format Prompt 1 result for Prompt 2
   */
  _formatPrompt1Result(prompt1Result) {
    // Handle both string and object responses
    if (typeof prompt1Result === 'string') {
      return prompt1Result;
    }
    return JSON.stringify(prompt1Result, null, 2);
  }

  /**
   * Extract competencies from Prompt 1 result (new structured format)
   */
  _extractCompetenciesFromPrompt1(prompt1Result) {
    // Handle different response formats
    let parsed;
    if (typeof prompt1Result === 'string') {
      try {
        parsed = JSON.parse(prompt1Result);
      } catch {
        return [];
      }
    } else {
      parsed = prompt1Result;
    }

    // Check for new format with expanded_competencies_list
    if (parsed.expanded_competencies_list && Array.isArray(parsed.expanded_competencies_list)) {
      return parsed.expanded_competencies_list.map(comp => ({
        name: comp.competency_name,
        description: comp.justification || comp.competency_name,
        type: comp.competency_type,
        targetLevel: comp.target_level
      }));
    }

    // Fallback to old format
    if (parsed.expandedSkills && Array.isArray(parsed.expandedSkills)) {
      return parsed.expandedSkills.map(skill => ({
        name: typeof skill === 'string' ? skill : skill.name || skill,
        description: skill.description || '',
        type: 'Out-of-the-Box'
      }));
    }

    return [];
  }

  /**
   * Extract competencies from Prompt 2 result (new format with Skills Engine queries)
   */
  _extractCompetenciesFromPrompt2(prompt2Result) {
    // Handle different response formats
    let parsed;
    if (typeof prompt2Result === 'string') {
      try {
        parsed = JSON.parse(prompt2Result);
      } catch {
        // Fallback to old format extraction
        return this._extractCompetencies(prompt2Result);
      }
    } else {
      parsed = prompt2Result;
    }

    // Check for new format with competencies_for_skills_engine_processing
    if (parsed.competencies_for_skills_engine_processing && Array.isArray(parsed.competencies_for_skills_engine_processing)) {
      return parsed.competencies_for_skills_engine_processing.map(comp => ({
        name: comp.competency_name,
        targetLevel: comp.target_level,
        sourceType: comp.source_type,
        queryTemplate: parsed.standard_skills_engine_query_template,
        exampleQuery: comp.example_query_to_send
      }));
    }

    // Fallback to old format
    return this._extractCompetencies(prompt2Result);
  }

  /**
   * Extract competencies from Prompt 2 result (old format fallback)
   */
  _extractCompetencies(prompt2Result) {
    // Handle different response formats
    if (typeof prompt2Result === 'string') {
      try {
        const parsed = JSON.parse(prompt2Result);
        return parsed.competencies || parsed;
      } catch {
        // If not JSON, try to extract from text
        return this._parseCompetenciesFromText(prompt2Result);
      }
    }

    if (Array.isArray(prompt2Result)) {
      return prompt2Result;
    }

    if (prompt2Result.competencies) {
      return prompt2Result.competencies;
    }

    return [];
  }

  /**
   * Parse competencies from text (fallback)
   */
  _parseCompetenciesFromText(text) {
    // Simple extraction - can be improved
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: `comp-${index + 1}`,
      name: line.trim(),
      description: ''
    }));
  }

  /**
   * Format input for Prompt 3 (Path Creation)
   */
  _formatPathCreationInput(skillsGap, skillBreakdown) {
    return JSON.stringify({
      initialGap: {
        microSkills: skillsGap.microSkills,
        nanoSkills: skillsGap.nanoSkills
      },
      expandedBreakdown: skillBreakdown
    }, null, 2);
  }

  /**
   * Extract learning path data from Prompt 3 result (new module-based format)
   */
  _extractPathData(prompt3Result, userId) {
    // Handle different response formats
    let parsed;
    if (typeof prompt3Result === 'string') {
      try {
        parsed = JSON.parse(prompt3Result);
      } catch {
        // Fallback to old format extraction
        return {
          pathSteps: this._extractPathSteps(prompt3Result),
          path_title: 'Learning Path',
          total_estimated_duration_hours: null
        };
      }
    } else {
      parsed = prompt3Result;
    }

    // Check for new format with learning_modules
    if (parsed.learning_modules && Array.isArray(parsed.learning_modules)) {
      return {
        path_title: parsed.path_title || 'Personalized Learning Path',
        learner_id: parsed.learner_id || userId,
        total_estimated_duration_hours: parsed.total_estimated_duration_hours || null,
        learning_modules: parsed.learning_modules
      };
    }

    // Fallback to old format with pathSteps
    return {
      pathSteps: this._extractPathSteps(parsed),
      path_title: parsed.path_title || 'Learning Path',
      total_estimated_duration_hours: parsed.total_estimated_duration_hours || null
    };
  }

  /**
   * Extract path steps from Prompt 3 result (old format fallback)
   */
  _extractPathSteps(prompt3Result) {
    // Handle different response formats
    if (typeof prompt3Result === 'string') {
      try {
        const parsed = JSON.parse(prompt3Result);
        return parsed.pathSteps || parsed.steps || parsed;
      } catch {
        return this._parseStepsFromText(prompt3Result);
      }
    }

    if (Array.isArray(prompt3Result)) {
      return prompt3Result;
    }

    if (prompt3Result.pathSteps) {
      return prompt3Result.pathSteps;
    }

    if (prompt3Result.steps) {
      return prompt3Result.steps;
    }

    return [];
  }

  /**
   * Parse steps from text (fallback)
   */
  _parseStepsFromText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: `step-${index + 1}`,
      title: line.trim(),
      order: index + 1,
      description: ''
    }));
  }
}

