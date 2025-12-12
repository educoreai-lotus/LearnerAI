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
    skillsGapRepository, // Add skills gap repository to fetch updated data
    skillsExpansionRepository // Add skills expansion repository to save prompt outputs
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
    this.skillsExpansionRepository = skillsExpansionRepository;
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
      // Extract competency target name from skills gap
      const competencyTargetName = skillsGap.competencyTargetName;
      
      // Update job to processing
      await this.jobRepository.updateJob(job.id, {
        status: 'processing',
        currentStage: 'skill-expansion',
        progress: 10
      });

      // Check if this is an update scenario (learning path exists + expansions exist)
      const existingCourse = await this.repository.getLearningPathById(competencyTargetName);
      let isUpdateMode = false;
      let existingExpansion = null;
      let existingPrompt1Output = null;
      let existingPrompt2Output = null;

      // Fetch the latest skills_raw_data from database (after Skills Engine update)
      let skillsRawData = null;
      let gapId = null;
      let examStatus = null;
      if (this.skillsGapRepository) {
        try {
          // Get the most recent skills gap for this user and competency
          const gaps = await this.skillsGapRepository.getSkillsGapsByUser(skillsGap.userId);
          const relevantGap = gaps.find(g => g.competency_target_name === competencyTargetName) || gaps[0];
          
          if (relevantGap) {
            if (relevantGap.skills_raw_data) {
            skillsRawData = relevantGap.skills_raw_data;
            console.log(`✅ Using updated skills_raw_data from database for user ${skillsGap.userId}`);
            }
            // Get gap_id for linking to skills_expansions
            gapId = relevantGap.gap_id;
            examStatus = relevantGap.exam_status; // Get exam_status to check if this is after failure
            console.log(`✅ Found gap_id: ${gapId} for linking to skills_expansions, exam_status: ${examStatus}`);
          }
        } catch (error) {
          console.warn(`⚠️  Could not fetch skills_raw_data from database: ${error.message}`);
          // Fallback to request data
        }
      }

      // Check if we can use update mode (skip Prompts 1 & 2)
      if (existingCourse && gapId && this.skillsExpansionRepository) {
        try {
          // Try to find existing expansion for this gap
          existingExpansion = await this.skillsExpansionRepository.getLatestSkillsExpansionByUserAndGap(
            skillsGap.userId,
            gapId
          );
          
          if (existingExpansion && existingExpansion.prompt_1_output && existingExpansion.prompt_2_output) {
            isUpdateMode = true;
            existingPrompt1Output = existingExpansion.prompt_1_output;
            existingPrompt2Output = existingExpansion.prompt_2_output;
            console.log(`🔄 UPDATE MODE: Learning path exists and expansions found - skipping Prompts 1 & 2`);
            console.log(`   Using existing expansion_id: ${existingExpansion.expansion_id}`);
            console.log(`   Will only update learning path (Prompt 3) with filtered skills`);
          } else {
            console.log(`ℹ️  Learning path exists but no complete expansions found - running full generation`);
          }
        } catch (error) {
          console.warn(`⚠️  Could not check for existing expansions: ${error.message}`);
          // Continue with full generation
        }
      }

      // Determine expansion ID (use existing or create new)
      let expansionId = existingExpansion?.expansion_id || uuidv4();
      let prompt1Result = null;
      let prompt2Result = null;
      let competencies = [];

      if (isUpdateMode) {
        // UPDATE MODE: Use existing expansions, filter competencies to match remaining skills
        console.log(`⚡ UPDATE MODE: Using existing expansions, filtering to match remaining skills`);
        console.log(`   This preserves existing competencies (no new ones added)`);
        console.log(`   Will filter competencies to only those relevant to remaining skills`);
        
        // Use existing Prompt 1 & 2 outputs (don't regenerate - preserves competencies)
        prompt1Result = existingPrompt1Output;
        prompt2Result = existingPrompt2Output;
        
        // Extract competencies from existing Prompt 2 output
        const allCompetencies = this._extractCompetenciesFromPrompt2(prompt2Result);
        console.log(`📋 Found ${allCompetencies.length} competencies in existing expansion`);
        
        // Filter competencies: We'll filter after getting skill breakdown
        // For now, use all competencies - filtering will happen after Skills Engine breakdown
        // (We need skill breakdown to know which competencies map to remaining skills)
        competencies = allCompetencies;
        
        console.log(`✅ Using existing competencies (will filter after skill breakdown): ${competencies.length} competencies`);
        
        await this.jobRepository.updateJob(job.id, {
          currentStage: 'skill-breakdown',
          progress: 50 // Skip directly to skill breakdown
        });
      } else {
        // FULL GENERATION MODE: Run all prompts
        console.log(`✨ FULL GENERATION MODE: Running all 3 prompts`);
        
        // Create skills expansion record to store prompt outputs
        let skillsExpansion = null;
        if (this.skillsExpansionRepository && !existingExpansion) {
          try {
            // gap_id is optional - if not found, we'll create expansion without it
            if (!gapId) {
              console.warn(`⚠️ No gap_id found for user ${skillsGap.userId}, creating skills expansion without gap_id link`);
            }
            
            skillsExpansion = await this.skillsExpansionRepository.createSkillsExpansion({
              expansion_id: expansionId,
              gap_id: gapId || null, // Nullable - allows expansion without gap link
              user_id: skillsGap.userId,
              prompt_1_output: null,
              prompt_2_output: null
            });
            console.log(`✅ Created skills expansion record: ${expansionId} for gap_id: ${gapId || 'none'}, user_id: ${skillsGap.userId}`);
          } catch (error) {
            console.warn(`⚠️ Failed to create skills expansion: ${error.message}`);
            // Continue without saving to skills_expansions if it fails
        }
      }

      // Prompt 1: Skill Expansion (only if not in update mode)
      if (!isUpdateMode) {
        // Use updated skills_raw_data from database if available, otherwise use request data
        const prompt1 = await this.promptLoader.loadPrompt('prompt1-skill-expansion');
        const prompt1Input = this._formatSkillsGapForPrompt(skillsGap, skillsRawData);
        const fullPrompt1 = prompt1.replace('{input}', prompt1Input);
        prompt1Result = await this.geminiClient.executePrompt(fullPrompt1, '', {
          timeout: 60000, // 60 seconds for skill expansion
          maxRetries: 3
        });

        // Save Prompt 1 output to skills_expansions table
        if (this.skillsExpansionRepository && expansionId) {
          try {
            // Parse prompt1Result if it's a string
            const prompt1Output = typeof prompt1Result === 'string' 
              ? JSON.parse(prompt1Result) 
              : prompt1Result;
            
            await this.skillsExpansionRepository.updateSkillsExpansion(expansionId, {
              prompt_1_output: prompt1Output
            });
            console.log(`✅ Saved Prompt 1 output to skills_expansions: ${expansionId}`);
          } catch (error) {
            console.warn(`⚠️ Failed to save Prompt 1 output: ${error.message}`);
            console.error(`   Error details:`, error);
          }
        } else {
          console.warn(`⚠️ Cannot save Prompt 1 output: skillsExpansionRepository=${!!this.skillsExpansionRepository}, expansionId=${expansionId}`);
        }
      } else {
        // In update mode, ensure existing Prompt 1 output is saved if not already
        if (this.skillsExpansionRepository && expansionId && prompt1Result) {
          try {
            const prompt1Output = typeof prompt1Result === 'string' 
              ? JSON.parse(prompt1Result) 
              : prompt1Result;
            
            await this.skillsExpansionRepository.updateSkillsExpansion(expansionId, {
              prompt_1_output: prompt1Output
            });
            console.log(`✅ Saved existing Prompt 1 output to skills_expansions: ${expansionId}`);
          } catch (error) {
            console.warn(`⚠️ Failed to save existing Prompt 1 output: ${error.message}`);
          }
        }
      }

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
              ...(c.description ? { justification: c.description } : {})
          })) }, null, 2)
        : this._formatPrompt1Result(prompt1Result);
      const fullPrompt2 = prompt2.replace('{input}', prompt2Input);
        prompt2Result = await this.geminiClient.executePrompt(fullPrompt2, '', {
        timeout: 60000, // 60 seconds for competency identification
        maxRetries: 3
      });

        // Save Prompt 2 output to skills_expansions table
        if (this.skillsExpansionRepository && expansionId) {
          try {
            // Parse prompt2Result if it's a string
            const prompt2Output = typeof prompt2Result === 'string' 
              ? JSON.parse(prompt2Result) 
              : prompt2Result;
            
            await this.skillsExpansionRepository.updateSkillsExpansion(expansionId, {
              prompt_2_output: prompt2Output
            });
            console.log(`✅ Saved Prompt 2 output to skills_expansions: ${expansionId}`);
          } catch (error) {
            console.warn(`⚠️ Failed to save Prompt 2 output: ${error.message}`);
          }
        }

      // Extract competencies prepared for Skills Engine
        competencies = this._extractCompetenciesFromPrompt2(prompt2Result);
      }

      // Update job progress (already done in update mode, but ensure it's set for full generation)
      if (!isUpdateMode) {
      await this.jobRepository.updateJob(job.id, {
        currentStage: 'skill-breakdown',
        progress: 50
      });
      }

      // Request skill breakdown from Skills Engine (with rollback to mock data if fails)
      // Explicitly request lowest level skills (expansions competencies) for each competency
      let skillBreakdown;
      try {
        skillBreakdown = await this.skillsEngineClient.requestSkillBreakdown(competencies, {
          maxRetries: 3,
          retryDelay: 1000,
          useMockData: false, // Will automatically use mock data if all retries fail
          includeExpansions: true // Explicitly request lowest level skills (expansions competencies)
        });
        console.log(`✅ Skills Engine breakdown received for ${competencies.length} competencies (lowest level skills/expansions)`);
      } catch (error) {
        console.error(`❌ Skills Engine request failed: ${error.message}`);
        // SkillsEngineClient already falls back to mock data, but log the error
        // Continue with mock data breakdown
        skillBreakdown = await this.skillsEngineClient.requestSkillBreakdown(competencies, {
          useMockData: true, // Force mock data
          includeExpansions: true // Still request expansions even in mock mode
        });
        console.warn(`⚠️ Using mock skill breakdown due to Skills Engine failure`);
      }

      // In update mode: Filter skill breakdown and competencies to only include remaining skills
      if (isUpdateMode && skillBreakdown && skillsRawData) {
        console.log(`🔍 UPDATE MODE: Filtering skill breakdown to match remaining skills only`);
        
        // Extract remaining skill names from updated gap
        const remainingSkillNames = this._extractSkillNamesFromGap(skillsRawData);
        console.log(`   Remaining skills in gap: ${remainingSkillNames.length} skills`);
        
        // Filter skill breakdown: Keep only competencies that have skills in the remaining gap
        const filteredSkillBreakdown = {};
        const filteredCompetencies = [];
        const allCompetenciesCount = competencies.length;
        
        for (const competency of competencies) {
          const competencyName = competency.name || competency.competency_name || String(competency);
          const breakdown = skillBreakdown[competencyName];
          
          if (breakdown) {
            // Filter micro and nano skills to only include those in remaining gap
            const filteredMicro = (breakdown.microSkills || []).filter(skill => {
              const skillName = typeof skill === 'string' ? skill : (skill.name || skill.id || String(skill));
              return remainingSkillNames.some(remaining => 
                remaining.toLowerCase().includes(skillName.toLowerCase()) ||
                skillName.toLowerCase().includes(remaining.toLowerCase())
              );
            });
            
            const filteredNano = (breakdown.nanoSkills || []).filter(skill => {
              const skillName = typeof skill === 'string' ? skill : (skill.name || skill.id || String(skill));
              return remainingSkillNames.some(remaining => 
                remaining.toLowerCase().includes(skillName.toLowerCase()) ||
                skillName.toLowerCase().includes(remaining.toLowerCase())
              );
            });
            
            // Only keep competency if it has skills after filtering
            if (filteredMicro.length > 0 || filteredNano.length > 0) {
              filteredSkillBreakdown[competencyName] = {
                microSkills: filteredMicro,
                nanoSkills: filteredNano
              };
              filteredCompetencies.push(competency);
            } else {
              console.log(`   ⚠️  Removed competency "${competencyName}" - no remaining skills match`);
            }
          }
        }
        
        // Update skill breakdown and competencies with filtered versions
        skillBreakdown = filteredSkillBreakdown;
        competencies = filteredCompetencies;
        console.log(`✅ Filtered to ${competencies.length} competencies with remaining skills`);
        console.log(`   Removed ${allCompetenciesCount - competencies.length} competencies (no remaining skills)`);
      }

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
      // Read Prompt 2 output from skills_expansions table
      let prompt2OutputFromDB = prompt2Result;
      if (this.skillsExpansionRepository && expansionId) {
        try {
          const savedExpansion = await this.skillsExpansionRepository.getSkillsExpansionById(expansionId);
          if (savedExpansion && savedExpansion.prompt_2_output) {
            prompt2OutputFromDB = savedExpansion.prompt_2_output;
            console.log(`✅ Using Prompt 2 output from skills_expansions table`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to read Prompt 2 output from DB, using in-memory result: ${error.message}`);
        }
      }

      // In update mode: Filter Prompt 2 output to only include competencies with remaining skills
      if (isUpdateMode && prompt2OutputFromDB && competencies.length > 0) {
        console.log(`🔍 UPDATE MODE: Filtering Prompt 2 output to match filtered competencies`);
        const filteredPrompt2Output = this._filterPrompt2OutputByCompetencies(prompt2OutputFromDB, competencies);
        prompt2OutputFromDB = filteredPrompt2Output;
        console.log(`✅ Filtered Prompt 2 output to ${competencies.length} competencies`);
      }

      // Use longer timeout for path creation as it generates complex structured output
      const prompt3 = await this.promptLoader.loadPrompt('prompt3-path-creation');
      
      // Format Prompt 3 input: Use prompt_2_output from database (competencies) + skillBreakdown from Skills Engine
      // The expandedBreakdown should combine prompt_2_output (competencies) with skillBreakdown (lowest level skills)
      const expandedBreakdownForPrompt3 = {
        competencies: prompt2OutputFromDB, // From prompt_2_output (filtered in update mode)
        skillBreakdown: skillBreakdown // From Skills Engine (filtered in update mode) - List of skills at lowest level (expansions)
      };
      
      // Format initial gap for Prompt 3: Use skills_raw_data (lowest level skills) from database
      // This ensures we use the actual list of skills at the lowest level that Skills Engine sent
      const initialGapForPrompt3 = skillsRawData 
        ? {
            userId: skillsGap.userId,
            companyId: skillsGap.companyId,
            competencyTargetName: skillsGap.competencyTargetName,
            skills_raw_data: skillsRawData  // Use lowest level skills from database (list of skills at lowest level in Skills Engine hierarchy)
          }
        : skillsGap.toJSON(); // Fallback if skillsRawData not available (backward compatibility)
      
      const fullPrompt3 = prompt3
        .replace('{initialGap}', JSON.stringify(initialGapForPrompt3, null, 2))
        .replace('{expandedBreakdown}', JSON.stringify(expandedBreakdownForPrompt3, null, 2));
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
        gapId: gapId || null, // Link to original skills gap
        pathSteps: pathData.learning_modules || pathData.pathSteps || [],
        pathTitle: pathData.path_title,
        totalDurationHours: pathData.total_estimated_duration_hours,
        pathMetadata: pathData,
        status: 'completed'
      });

      // Check if this is an update after exam failure (course already exists + exam_status is 'fail')
      // Note: existingCourse was already checked above for update mode detection
      const isUpdateAfterFailure = existingCourse && examStatus === 'fail';

      // Check approval policy to determine if course should be approved immediately
      let shouldApprove = false;
      if (!isUpdateAfterFailure && this.checkApprovalPolicyUseCase) {
        try {
          const { requiresApproval } = await this.checkApprovalPolicyUseCase.execute(skillsGap.companyId);
          // If approval is NOT required (auto approval), set approved to true
          // If approval IS required (manual approval), set approved to false
          shouldApprove = !requiresApproval;
        } catch (error) {
          console.warn(`⚠️  Could not check approval policy, defaulting to false: ${error.message}`);
          shouldApprove = false; // Default to false (requires approval) if check fails
        }
      } else if (isUpdateAfterFailure) {
        // Updates after exam failure are auto-approved (skip approval workflow)
        shouldApprove = true;
      }

      // Set approved status based on approval policy
      learningPath.status = shouldApprove ? 'approved' : 'pending';

      // Save learning path (updates if exists, creates if new)
      const savedPath = await this.repository.saveLearningPath(learningPath);

      // Check approval policy and handle distribution
      // Skip approval if this is an update after exam failure
      await this._handlePathDistribution(savedPath, skillsGap, isUpdateAfterFailure);

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
   * @param {LearningPath} learningPath - The learning path to distribute
   * @param {Object} skillsGap - The skills gap data
   * @param {boolean} isUpdateAfterFailure - If true, this is an update after exam failure (skip approval)
   * @private
   */
  async _handlePathDistribution(learningPath, skillsGap, isUpdateAfterFailure = false) {
    // Special case: Skip approval workflow for updates after exam failure
    // NOTE: We do NOT automatically distribute to Course Builder anymore.
    // Course Builder will request data when needed via the request endpoint.
    if (isUpdateAfterFailure) {
      console.log(`🔄 Learning path ${learningPath.id} is an update after exam failure - skipping approval workflow`);
      console.log(`📋 Course Builder can now request this learning path data when needed`);
      return;
    }

    if (!this.checkApprovalPolicyUseCase) {
      console.warn('⚠️  Approval workflow not configured, skipping distribution');
      return;
    }

    try {
      // Check company's approval policy
      const { requiresApproval, company } = await this.checkApprovalPolicyUseCase.execute(skillsGap.companyId);
      
      console.log(`🔍 Approval policy check for company ${skillsGap.companyId}: requiresApproval=${requiresApproval}, company=${company ? 'found' : 'not found'}`);

      if (requiresApproval && company) {
        // Manual approval required - create approval request
        console.log(`📋 Manual approval required for company ${skillsGap.companyId}`);
        console.log(`   - requestPathApprovalUseCase: ${this.requestPathApprovalUseCase ? 'initialized' : 'NOT initialized'}`);
        console.log(`   - company.decisionMaker: ${company.decisionMaker ? 'configured' : 'NOT configured'}`);
        
        if (this.requestPathApprovalUseCase && company.decisionMaker) {
          // Use competencyTargetName as learningPathId (it's the primary key in courses table)
          const learningPathId = learningPath.competencyTargetName || learningPath.id;
          console.log(`   - Creating approval request for learning path: ${learningPathId}`);
          console.log(`   - Decision maker: ${company.decisionMaker.employee_id} (${company.decisionMaker.name || company.decisionMaker.email || 'no name/email'})`);
          
          try {
            const approval = await this.requestPathApprovalUseCase.execute({
              learningPathId: learningPathId,
            companyId: skillsGap.companyId,
            decisionMaker: company.decisionMaker,
            learningPath: learningPath.toJSON()
          });
            console.log(`✅ Approval request created successfully: ${approval.id} for path ${learningPathId} (manual approval required)`);
          } catch (approvalError) {
            console.error(`❌ Failed to create approval request: ${approvalError.message}`);
            console.error(`   Stack: ${approvalError.stack}`);
            // Don't fail the entire process, but log the error
        }
      } else {
          console.warn(`⚠️  Manual approval required but cannot create approval request for company ${skillsGap.companyId}`);
          if (!this.requestPathApprovalUseCase) {
            console.warn(`   ❌ RequestPathApprovalUseCase is NOT initialized - check server.js dependencies`);
          }
          if (!company.decisionMaker) {
            console.warn(`   ❌ Company ${skillsGap.companyId} has manual approval but no decisionMaker configured`);
            console.warn(`   ❌ Company decision_maker field: ${JSON.stringify(company.decisionMaker)}`);
          }
        }
      } else {
        // Auto approval - mark as approved but do NOT distribute
        // NOTE: We do NOT automatically distribute to Course Builder anymore.
        // Course Builder will request data when needed via the request endpoint.
        console.log(`✅ Auto approval for company ${skillsGap.companyId} - learning path marked as approved`);
        console.log(`📋 Course Builder can now request this learning path data when needed`);
      }
    } catch (error) {
      console.error(`❌ Error handling path distribution: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
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
        description: comp.justification || comp.competency_name || ''
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
      // The prompt generates snake_case format (path_title, total_estimated_duration_hours)
      // We preserve both formats for compatibility and convert to camelCase for storage
      const pathTitle = parsed.path_title || parsed.pathTitle || 'Personalized Learning Path';
      const totalDuration = parsed.total_estimated_duration_hours || parsed.totalDurationHours || null;
      
      // Process modules: handle both new format (with steps) and old format (with suggested_content_sequence)
      const processedModules = parsed.learning_modules.map(module => {
        // Support both new format (skills_in_module) and old format (focus_micro_skills)
        const skillsInModule = module.skills_in_module || module.focus_micro_skills || [];
        
        // Support both new format (steps array) and old format (suggested_content_sequence)
        const hasSteps = module.steps && Array.isArray(module.steps) && module.steps.length > 0;
        const hasSuggestedSequence = module.suggested_content_sequence && Array.isArray(module.suggested_content_sequence);
        
        // If new format has steps, use them; otherwise keep suggested_content_sequence for backward compatibility
        const moduleData = {
          module_order: module.module_order,
          module_title: module.module_title,
          estimated_duration_hours: module.estimated_duration_hours,
          skills_in_module: skillsInModule,
          // Keep both for backward compatibility
          focus_micro_skills: skillsInModule, // Alias for backward compatibility
          learning_goals: module.learning_goals || []
        };
        
        // Add steps if present (new format)
        if (hasSteps) {
          moduleData.steps = module.steps;
        }
        
        // Add suggested_content_sequence if present (old format) or if no steps
        if (hasSuggestedSequence || !hasSteps) {
          moduleData.suggested_content_sequence = module.suggested_content_sequence || [];
        }
        
        return moduleData;
      });
      
      return {
        // Keep snake_case for internal processing (used by LearningPath entity)
        path_title: pathTitle,
        learner_id: parsed.learner_id || userId,
        total_estimated_duration_hours: totalDuration,
        learning_modules: processedModules,
        // Add camelCase versions for storage (used by repository)
        pathTitle: pathTitle,
        pathGoal: parsed.pathGoal || parsed.path_goal,
        pathDescription: parsed.pathDescription || parsed.path_description,
        totalDurationHours: totalDuration,
        difficulty: parsed.difficulty,
        audience: parsed.audience,
        estimatedCompletion: parsed.estimatedCompletion || parsed.estimated_completion,
        metadata: parsed.metadata
      };
    }

    // Fallback to old format with pathSteps
    return {
      pathSteps: this._extractPathSteps(parsed),
      path_title: parsed.pathTitle || parsed.path_title || 'Learning Path',
      total_estimated_duration_hours: parsed.totalDurationHours || parsed.total_estimated_duration_hours || null
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

  /**
   * Extract skill names from gap data structure
   * Handles different gap formats: missing_skills_map, identifiedGaps, etc.
   * @private
   */
  _extractSkillNamesFromGap(gapData) {
    const skillNames = [];
    if (!gapData || typeof gapData !== 'object') return skillNames;

    // Handle missing_skills_map format (from Skills Engine)
    if (gapData.missing_skills_map) {
      for (const [competencyName, skills] of Object.entries(gapData.missing_skills_map)) {
        if (Array.isArray(skills)) {
          skills.forEach(skill => {
            if (typeof skill === 'string') {
              skillNames.push(skill);
            } else if (skill && (skill.name || skill.id)) {
              skillNames.push(skill.name || skill.id);
            }
          });
        }
      }
    }

    // Handle identifiedGaps format (structured format)
    if (gapData.identifiedGaps && Array.isArray(gapData.identifiedGaps)) {
      gapData.identifiedGaps.forEach(gap => {
        if (gap.microSkills && Array.isArray(gap.microSkills)) {
          gap.microSkills.forEach(skill => {
            if (typeof skill === 'string') {
              skillNames.push(skill);
            } else if (skill && (skill.name || skill.id || skill.skill_id)) {
              skillNames.push(skill.name || skill.id || skill.skill_id);
            }
          });
        }
        if (gap.nanoSkills && Array.isArray(gap.nanoSkills)) {
          gap.nanoSkills.forEach(skill => {
            if (typeof skill === 'string') {
              skillNames.push(skill);
            } else if (skill && (skill.name || skill.id || skill.skill_id)) {
              skillNames.push(skill.name || skill.id || skill.skill_id);
            }
          });
        }
      });
    }

    // Handle flat array format
    if (Array.isArray(gapData)) {
      gapData.forEach(skill => {
        if (typeof skill === 'string') {
          skillNames.push(skill);
        } else if (skill && (skill.name || skill.id)) {
          skillNames.push(skill.name || skill.id);
        }
      });
    }

    // Remove duplicates and return (keep original case for matching)
    return [...new Set(skillNames)];
  }

  /**
   * Filter Prompt 2 output to only include competencies that are in the filtered list
   * @private
   */
  _filterPrompt2OutputByCompetencies(prompt2Output, filteredCompetencies) {
    if (!prompt2Output || !filteredCompetencies || filteredCompetencies.length === 0) {
      return prompt2Output;
    }

    // Extract competency names from filtered list
    const filteredCompetencyNames = filteredCompetencies.map(comp => {
      const name = comp.name || comp.competency_name || String(comp);
      return name.toLowerCase();
    });

    // Parse Prompt 2 output
    let parsed;
    if (typeof prompt2Output === 'string') {
      try {
        parsed = JSON.parse(prompt2Output);
      } catch {
        return prompt2Output; // Can't parse, return as-is
      }
    } else {
      parsed = prompt2Output;
    }

    // Filter competencies_for_skills_engine_processing array
    if (parsed.competencies_for_skills_engine_processing && Array.isArray(parsed.competencies_for_skills_engine_processing)) {
      const filtered = parsed.competencies_for_skills_engine_processing.filter(comp => {
        const compName = (comp.competency_name || comp.name || String(comp)).toLowerCase();
        return filteredCompetencyNames.includes(compName);
      });

      return {
        ...parsed,
        competencies_for_skills_engine_processing: filtered
      };
    }

    // If format is different, return as-is (can't filter)
    return prompt2Output;
  }
}

