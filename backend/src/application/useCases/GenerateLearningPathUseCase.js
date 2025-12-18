import { Job } from '../../domain/entities/Job.js';
import { LearningPath } from '../../domain/entities/LearningPath.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateAverageDifficulty, validatePrerequisiteOrder, getDifficultyScoreWithFallback } from '../../infrastructure/knowledge/skillPrerequisites.js';

/**
 * GenerateLearningPathUseCase
 * Orchestrates the three-prompt flow for learning path generation
 */
export class GenerateLearningPathUseCase {
  constructor({ 
    geminiClient, 
    skillsEngineClient, 
    coordinatorClient,
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
    this.coordinatorClient = coordinatorClient || null;
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

  _convertSkillsToArray(skillsRawData) {
    if (!skillsRawData) return [];
    if (Array.isArray(skillsRawData)) return skillsRawData.filter(Boolean);
    if (typeof skillsRawData !== 'object') return [];
    const out = [];
    for (const value of Object.values(skillsRawData)) {
      if (Array.isArray(value)) out.push(...value);
      else if (typeof value === 'string') out.push(value);
    }
    return Array.from(new Set(out.filter(Boolean)));
  }

  _buildPrompt3LearningPath(pathData, onlyModule = null) {
    // enforce Prompt 3 structure/order
    const lp = {};
    lp.path_title = pathData?.path_title || 'Learning Path';
    lp.learner_id = pathData?.learner_id;
    if (pathData?.total_estimated_duration_hours !== undefined) {
      lp.total_estimated_duration_hours = pathData.total_estimated_duration_hours;
    } else {
      lp.total_estimated_duration_hours = 0;
    }
    const modules = Array.isArray(pathData?.learning_modules) ? pathData.learning_modules : [];
    lp.learning_modules = onlyModule ? [onlyModule] : modules;
    return lp;
  }

  async _pushApprovedLearningPathToCourseBuilder(skillsGap, pathData) {
    if (!this.coordinatorClient || !this.coordinatorClient.isConfigured()) {
      console.warn('⚠️  CoordinatorClient not configured - skipping push_learning_path');
      return;
    }

    const modules = Array.isArray(pathData?.learning_modules) ? pathData.learning_modules : [];
    if (modules.length === 0) {
      console.warn('⚠️  No learning_modules found - skipping push_learning_path');
      return;
    }

    const skillsRawArray = this._convertSkillsToArray(skillsGap.skillsRawData || skillsGap.skills_raw_data);
    const preferredLanguage = skillsGap.preferred_language || skillsGap.preferredLanguage || null;
    const userName = skillsGap.userName || skillsGap.user_name || null;
    const companyName = skillsGap.companyName || skillsGap.company_name || null;
    const examStatus = skillsGap.examStatus || skillsGap.exam_status || null;

    // Single request containing the full learning path (all modules)
    const requestBody = {
      requester_service: 'learnerAI',
      payload: {
        action: 'push_learning_path',
        description: 'Send an approved learning path immediately to Course Builder (auto: after generation; manual: after decision maker approval).',
        user_id: skillsGap.userId,
        user_name: userName,
        preferred_language: preferredLanguage,
        company_id: skillsGap.companyId,
        company_name: companyName,
        competency_target_name: skillsGap.competencyTargetName,
        exam_status: examStatus,
        skills_raw_data: skillsRawArray,
        learning_path: this._buildPrompt3LearningPath(pathData, null)
      }
    };

    try {
      await this.coordinatorClient.postFillContentMetrics(requestBody);
      console.log('✅ push_learning_path sent to Coordinator (full learning path)');
    } catch (e) {
      console.error(`❌ push_learning_path failed (full learning path): ${e.message}`);
    }
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
            let prompt1Output;
            if (typeof prompt1Result === 'string') {
              try {
                prompt1Output = JSON.parse(prompt1Result);
              } catch (parseError) {
                // If JSON parsing fails, save as string with metadata
                console.warn(`⚠️ Prompt 1 result is not valid JSON, saving as string: ${parseError.message}`);
                prompt1Output = {
                  _raw_output: prompt1Result,
                  _parse_error: parseError.message,
                  _format: 'string'
                };
              }
            } else {
              prompt1Output = prompt1Result;
            }
            
            await this.skillsExpansionRepository.updateSkillsExpansion(expansionId, {
              prompt_1_output: prompt1Output
            });
            console.log(`✅ Saved Prompt 1 output to skills_expansions: ${expansionId}`);
            console.log(`   Output type: ${typeof prompt1Output}, keys: ${prompt1Output && typeof prompt1Output === 'object' ? Object.keys(prompt1Output).join(', ') : 'N/A'}`);
          } catch (error) {
            console.error(`❌ Failed to save Prompt 1 output: ${error.message}`);
            console.error(`   Error details:`, error);
            console.error(`   Prompt 1 result type: ${typeof prompt1Result}, length: ${typeof prompt1Result === 'string' ? prompt1Result.length : 'N/A'}`);
            // Don't throw - continue with the process even if save fails
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
      
      // Execute Prompt 2 with error handling
      try {
        prompt2Result = await this.geminiClient.executePrompt(fullPrompt2, '', {
          timeout: 60000, // 60 seconds for competency identification
          maxRetries: 3
        });
      } catch (prompt2Error) {
        // Save error information to database before re-throwing
        if (this.skillsExpansionRepository && expansionId) {
          try {
            await this.skillsExpansionRepository.updateSkillsExpansion(expansionId, {
              prompt_2_output: {
                _error: true,
                _error_message: prompt2Error.message,
                _error_type: 'execution_failed',
                _failed_at: new Date().toISOString()
              }
            });
            console.error(`❌ Saved Prompt 2 error to skills_expansions: ${expansionId}`);
            console.error(`   Error: ${prompt2Error.message}`);
          } catch (saveError) {
            console.error(`❌ Failed to save Prompt 2 error: ${saveError.message}`);
          }
        }
        // Re-throw to fail the job
        throw prompt2Error;
      }

        // Save Prompt 2 output to skills_expansions table
        if (this.skillsExpansionRepository && expansionId) {
          try {
            // Parse prompt2Result if it's a string
            let prompt2Output;
            if (typeof prompt2Result === 'string') {
              try {
                prompt2Output = JSON.parse(prompt2Result);
              } catch (parseError) {
                // If JSON parsing fails, save as string with metadata
                console.warn(`⚠️ Prompt 2 result is not valid JSON, saving as string: ${parseError.message}`);
                prompt2Output = {
                  _raw_output: prompt2Result,
                  _parse_error: parseError.message,
                  _format: 'string'
                };
              }
            } else {
              prompt2Output = prompt2Result;
            }
            
            await this.skillsExpansionRepository.updateSkillsExpansion(expansionId, {
              prompt_2_output: prompt2Output
            });
            console.log(`✅ Saved Prompt 2 output to skills_expansions: ${expansionId}`);
            console.log(`   Output type: ${typeof prompt2Output}, keys: ${prompt2Output && typeof prompt2Output === 'object' ? Object.keys(prompt2Output).join(', ') : 'N/A'}`);
          } catch (error) {
            console.error(`❌ Failed to save Prompt 2 output: ${error.message}`);
            console.error(`   Error details:`, error);
            console.error(`   Prompt 2 result type: ${typeof prompt2Result}, length: ${typeof prompt2Result === 'string' ? prompt2Result.length : 'N/A'}`);
            // Don't throw - continue with the process even if save fails
          }
        } else {
          console.warn(`⚠️ Cannot save Prompt 2 output: skillsExpansionRepository=${!!this.skillsExpansionRepository}, expansionId=${expansionId}`);
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

      // Normalize skill breakdown: Extract only skill names, ignore skill_id if present
      // Skills Engine may send skills as objects with skill_id and skill_name
      if (skillBreakdown) {
        skillBreakdown = this._normalizeSkillBreakdown(skillBreakdown);
        console.log(`✅ Normalized skill breakdown: extracted skill names (removed skill_id if present)`);
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
            // NEW FORMAT: breakdown is an array of skill names (strings)
            // OLD FORMAT (backward compatibility): breakdown is an object with microSkills/nanoSkills
            let skillsToFilter = [];
            
            if (Array.isArray(breakdown)) {
              // New format: direct array of skill names
              skillsToFilter = breakdown;
            } else if (breakdown && typeof breakdown === 'object') {
              // Old format: extract from microSkills/nanoSkills (backward compatibility)
              // Note: Breakdown should already be normalized, but keep this for edge cases
              const microSkills = breakdown.microSkills || [];
              const nanoSkills = breakdown.nanoSkills || [];
              const skillsArray = breakdown.skills || [];
              
              // Combine all skills from old format
              // Extract skill_name (ignore skill_id) for consistency
              skillsToFilter = [
                ...microSkills,
                ...nanoSkills,
                ...skillsArray
              ].map(skill => typeof skill === 'string' ? skill : (skill.skill_name || skill.name || skill.id || String(skill)));
            }
            
            // Filter skills to only include those in remaining gap
            const filteredSkills = skillsToFilter.filter(skillName => {
              return remainingSkillNames.some(remaining => 
                remaining.toLowerCase().includes(skillName.toLowerCase()) ||
                skillName.toLowerCase().includes(remaining.toLowerCase())
              );
            });
            
            // Only keep competency if it has skills after filtering
            if (filteredSkills.length > 0) {
              // Store in new format (array of skill names)
              filteredSkillBreakdown[competencyName] = filteredSkills;
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
      
      // Extract skills explicitly to make it clearer for the AI
      const initialSkills = this._extractSkillsFromInitialGap(initialGapForPrompt3);
      const expandedSkills = this._extractSkillsFromExpandedBreakdown(expandedBreakdownForPrompt3);
      
      // Add explicit skill lists to make it crystal clear for the AI
      const initialGapWithSkills = {
        ...initialGapForPrompt3,
        EXTRACTED_SKILLS: initialSkills, // Explicit list of skills to use
        INSTRUCTION: `You MUST use ONLY these ${initialSkills.length} skills from Initial Skills Gap: ${initialSkills.join(', ')}`
      };
      
      const expandedBreakdownWithSkills = {
        ...expandedBreakdownForPrompt3,
        EXTRACTED_SKILLS: expandedSkills, // Explicit list of skills to use
        INSTRUCTION: `You MUST use ONLY these ${expandedSkills.length} skills from Expanded Breakdown: ${expandedSkills.join(', ')}`
      };
      
      let fullPrompt3 = prompt3
        .replace('{initialGap}', JSON.stringify(initialGapWithSkills, null, 2))
        .replace('{expandedBreakdown}', JSON.stringify(expandedBreakdownWithSkills, null, 2));
      
      // Path creation with validation retry logic
      let prompt3Result;
      let pathData;
      let validationAttempts = 0;
      const maxValidationAttempts = 3;
      
      do {
        // Path creation needs more time - use 90 seconds timeout (default is 30s)
        prompt3Result = await this.geminiClient.executePrompt(fullPrompt3, '', {
          timeout: 90000, // 90 seconds for complex path generation
          maxRetries: 3
        });

        // Extract learning path structure from Prompt 3 result
        pathData = this._extractPathData(prompt3Result, skillsGap.userId, competencyTargetName);
        
        // Validate learning path for pedagogical correctness
        const validation = this._validateLearningPath(pathData);
        
        if (validation.valid) {
          console.log('✅ Learning path validation passed');
          break; // Valid path, continue
        }
        
        validationAttempts++;
        console.warn(`⚠️ Learning path validation failed (attempt ${validationAttempts}/${maxValidationAttempts}):`, validation.errors);
        
        if (validationAttempts >= maxValidationAttempts) {
          // Log warning but continue - don't fail the entire job
          console.error(`❌ Learning path validation failed after ${maxValidationAttempts} attempts. Continuing with generated path.`);
          console.error('Validation errors:', validation.errors);
          // Continue with the path even if validation failed (less strict approach)
          // Alternatively, throw error to fail the job:
          // throw new Error(`Learning path validation failed after ${maxValidationAttempts} attempts: ${validation.errors.join('; ')}`);
          break;
        }
        
        // Retry with updated prompt that includes validation feedback
        fullPrompt3 = this._addValidationFeedbackToPrompt(fullPrompt3, validation.errors);
        console.log(`🔄 Retrying path generation with validation feedback (attempt ${validationAttempts + 1})...`);
        
      } while (validationAttempts < maxValidationAttempts);

      // Create learning path entity
      // pathData should always have learning_modules now (converted from old format if needed)
      const learningPath = new LearningPath({
        id: uuidv4(),
        userId: skillsGap.userId,
        companyId: skillsGap.companyId,
        competencyTargetName: competencyTargetName,
        gapId: gapId || null, // Link to original skills gap
        pathSteps: pathData.learning_modules || [], // Always use learning_modules (converted from old format if needed)
        pathTitle: pathData.path_title,
        totalDurationHours: pathData.total_estimated_duration_hours,
        pathMetadata: pathData, // Contains full new structure with learning_modules
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

      // Proactively push approved learning paths to Course Builder via Coordinator
      // - auto-approval: immediately after generation
      // - update-after-failure: also auto-approved in our logic
      if (learningPath.status === 'approved') {
        await this._pushApprovedLearningPathToCourseBuilder(skillsGap, pathData);
      }

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
    // NOTE: We do NOT automatically distribute to Course Builder.
    // Course Builder will request data when needed via the request endpoint.
    if (isUpdateAfterFailure) {
      console.log(`🔄 Learning path ${learningPath.id} is an update after exam failure - skipping approval workflow`);
      console.log(`📋 Course Builder can request this learning path data on-demand when needed`);
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
        // NOTE: We do NOT automatically distribute to Course Builder.
        // Course Builder will request data when needed via the request endpoint.
        console.log(`✅ Auto approval for company ${skillsGap.companyId} - learning path marked as approved`);
        console.log(`📋 Course Builder can request this learning path data on-demand when needed`);
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
    
    // Fallback to request data (should not happen if skillsRawData is properly set)
    // If skillsRawData is missing, return empty structure
    return JSON.stringify({
      skills_raw_data: {},
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
   * Extract skills from initial gap structure
   * @private
   */
  _extractSkillsFromInitialGap(initialGap) {
    const skills = [];
    
    // Helper function to extract skills from a competency map structure
    const extractFromCompetencyMap = (competencyMap) => {
      if (!competencyMap || typeof competencyMap !== 'object') return;
      
      // Check if it's a competency map (object with competency names as keys, arrays as values)
      const isCompetencyMap = Object.values(competencyMap).every(value => 
        Array.isArray(value) || typeof value === 'string'
      );
      
      if (isCompetencyMap) {
        Object.values(competencyMap).forEach(skillArray => {
          if (Array.isArray(skillArray)) {
            skills.push(...skillArray);
          } else if (typeof skillArray === 'string') {
            skills.push(skillArray);
          }
        });
      }
    };
    
    // Try to extract from skills_raw_data directly (if it's a competency map)
    if (initialGap.skills_raw_data) {
      extractFromCompetencyMap(initialGap.skills_raw_data);
    }
    
    // Try to extract from skills_raw_data.gap (if gap is a competency map)
    if (initialGap.skills_raw_data?.gap) {
      extractFromCompetencyMap(initialGap.skills_raw_data.gap);
    }
    
    // Try to extract from skills_raw_data.gap.missing_skills_map
    if (initialGap.skills_raw_data?.gap?.missing_skills_map) {
      const missingSkillsMap = initialGap.skills_raw_data.gap.missing_skills_map;
      extractFromCompetencyMap(missingSkillsMap);
    }
    
    // Try to extract from gap directly (if gap is a competency map)
    if (initialGap.gap) {
      extractFromCompetencyMap(initialGap.gap);
    }
    
    // Try to extract from gap.missing_skills_map
    if (initialGap.gap?.missing_skills_map) {
      const missingSkillsMap = initialGap.gap.missing_skills_map;
      extractFromCompetencyMap(missingSkillsMap);
    }
    
    // Legacy fallback: Try to extract from old skill array formats (deprecated - should not be used)
    // This is kept only for backward compatibility with very old data structures
    if (Array.isArray(initialGap.microSkills)) {
      console.warn('⚠️ Using legacy skill array format - consider updating to competency map format');
      skills.push(...initialGap.microSkills);
    }
    if (Array.isArray(initialGap.nanoSkills)) {
      console.warn('⚠️ Using legacy skill array format - consider updating to competency map format');
      skills.push(...initialGap.nanoSkills);
    }
    
    // Remove duplicates and return
    return [...new Set(skills)];
  }

  /**
   * Extract skills from expanded breakdown structure
   * Handles new format: { "Competency_Name": ["Skill Name 1", "Skill Name 2", ...] }
   * Also supports old format for backward compatibility
   * @private
   */
  _extractSkillsFromExpandedBreakdown(expandedBreakdown) {
    const skills = [];
    
    // Try to extract from skillBreakdown
    if (expandedBreakdown.skillBreakdown && typeof expandedBreakdown.skillBreakdown === 'object') {
      Object.values(expandedBreakdown.skillBreakdown).forEach(competencyData => {
        // NEW FORMAT: Check for array first (array of skill names)
        if (Array.isArray(competencyData)) {
          competencyData.forEach(skillName => {
            if (typeof skillName === 'string') {
              skills.push(skillName);
            }
          });
        } else if (competencyData && typeof competencyData === 'object') {
          // OLD FORMAT: Backward compatibility - extract from microSkills/nanoSkills
          // Extract from microSkills (legacy)
          if (Array.isArray(competencyData.microSkills)) {
            competencyData.microSkills.forEach(skill => {
              if (typeof skill === 'string') {
                skills.push(skill);
              } else if (skill?.name) {
                skills.push(skill.name);
              }
            });
          }
          // Extract from nanoSkills (legacy)
          if (Array.isArray(competencyData.nanoSkills)) {
            competencyData.nanoSkills.forEach(skill => {
              if (typeof skill === 'string') {
                skills.push(skill);
              } else if (skill?.name) {
                skills.push(skill.name);
              }
            });
          }
          // Extract from skills array (alternative legacy format)
          if (Array.isArray(competencyData.skills)) {
            competencyData.skills.forEach(skill => {
              if (typeof skill === 'string') {
                skills.push(skill);
              } else if (skill?.name) {
                skills.push(skill.name);
              }
            });
          }
        }
      });
    }
    
    // Remove duplicates and return
    return [...new Set(skills)];
  }

  /**
   * Format input for Prompt 3 (Path Creation)
   * NOTE: This method is deprecated and not used anymore.
   * The new format uses initialGapForPrompt3 and expandedBreakdownForPrompt3 directly.
   * Kept for reference only.
   */
  _formatPathCreationInput(skillsGap, skillBreakdown) {
    // This method is no longer used - the new format constructs the input directly
    // in processJob() using initialGapForPrompt3 and expandedBreakdownForPrompt3
    console.warn('⚠️ _formatPathCreationInput is deprecated and should not be called');
    return JSON.stringify({
      initialGap: {
        skills_raw_data: skillsGap.skills_raw_data || {}
      },
      expandedBreakdown: skillBreakdown
    }, null, 2);
  }

  /**
   * Extract learning path data from Prompt 3 result (module-based format)
   * 
   * Expected format from Prompt 3:
   * - path_title, learner_id, total_estimated_duration_hours (snake_case)
   * - learning_modules array with:
   *   - module_order, module_title, estimated_duration_hours
   *   - skills_in_module (array of skill strings)
   *   - steps array with: step, title, description, estimatedTime, skills_covered
   * 
   * Note: Steps use simplified format (no step_type, content_type, resources, objectives required)
   * but these fields may be present in older formats for backward compatibility.
   * 
   * @param {string|object} prompt3Result - The result from Prompt 3
   * @param {string} userId - The user ID
   * @param {string} competencyTargetName - The target competency name (used as fallback for path_title)
   */
  _extractPathData(prompt3Result, userId, competencyTargetName = null) {
    // Handle different response formats
    let parsed;
    if (typeof prompt3Result === 'string') {
      try {
        parsed = JSON.parse(prompt3Result);
      } catch {
        // Fallback: If JSON parsing fails, try to extract and convert to new format
        console.warn('⚠️ Failed to parse Prompt 3 result as JSON, attempting text extraction');
        const extractedSteps = this._extractPathSteps(prompt3Result);
        
        // Convert old format to new learning_modules structure
        if (extractedSteps && extractedSteps.length > 0) {
          return {
            path_title: competencyTargetName || 'Learning Path',
            learner_id: userId,
            total_estimated_duration_hours: null,
            learning_modules: [{
              module_order: 1,
              module_title: 'Learning Path',
              estimated_duration_hours: null,
              skills_in_module: [],
              steps: extractedSteps.map((step, index) => ({
                step: step.step || step.order || index + 1,
                title: step.title || step.name || `Step ${index + 1}`,
                description: step.description || '',
                estimatedTime: step.estimatedTime || step.duration || null,
                skills_covered: step.skills_covered || step.skills || []
              }))
            }]
          };
        }
        
        // If extraction also fails, return minimal structure
        return {
          path_title: competencyTargetName || 'Learning Path',
          learner_id: userId,
          total_estimated_duration_hours: null,
          learning_modules: []
        };
      }
    } else {
      parsed = prompt3Result;
    }

    // Check for new format with learning_modules
    if (parsed.learning_modules && Array.isArray(parsed.learning_modules)) {
      // The prompt generates snake_case format (path_title, total_estimated_duration_hours)
      // We preserve both formats for compatibility and convert to camelCase for storage
      // Use competencyTargetName as fallback if path_title is missing or is a generic default
      const defaultTitles = ['Learning Path', 'Personalized Learning Path', 'Target Goal'];
      const extractedPathTitle = parsed.path_title || parsed.pathTitle;
      const pathTitle = (extractedPathTitle && !defaultTitles.includes(extractedPathTitle))
        ? extractedPathTitle
        : (competencyTargetName || 'Learning Path');
      const totalDuration = parsed.total_estimated_duration_hours || parsed.totalDurationHours || null;
      
      // Process modules: convert old format to new format if needed
      const processedModules = parsed.learning_modules.map(module => {
        // Convert old format (focus_micro_skills) to new format (skills_in_module)
        const skillsInModule = module.skills_in_module || module.focus_micro_skills || [];
        if (module.focus_micro_skills && !module.skills_in_module) {
          console.warn('⚠️ Converting legacy focus_micro_skills to skills_in_module format');
        }
        
        // Convert old format (suggested_content_sequence) to new format (steps array)
        const hasSteps = module.steps && Array.isArray(module.steps) && module.steps.length > 0;
        const hasSuggestedSequence = module.suggested_content_sequence && Array.isArray(module.suggested_content_sequence);
        
        // If we have old format (suggested_content_sequence) but no steps, convert it
        if (hasSuggestedSequence && !hasSteps) {
          console.warn('⚠️ Converting legacy suggested_content_sequence to steps format');
          // Convert string sequence to structured steps
          const convertedSteps = module.suggested_content_sequence.map((content, index) => {
            // Parse string format like "Lesson: Title (Skill: Name)" or just "Title"
            // Legacy format may have "(Nano: Skill)" or "(Micro: Skill)" patterns
            let title = content;
            let skills = [];
            
            if (typeof content === 'string') {
              // Try to extract title and skills from string format
              const titleMatch = content.match(/^(?:Lesson:\s*)?([^(]+)/);
              if (titleMatch) {
                title = titleMatch[1].trim();
              }
              
              // Extract skills from patterns like "(Skill: Name)" or legacy "(Nano: Skill)" / "(Micro: Skill)"
              // Match any pattern in parentheses that looks like a skill reference
              const skillMatches = content.matchAll(/\([^:]+:\s*([^)]+)\)/g);
              for (const match of skillMatches) {
                skills.push(match[1].trim());
              }
            }
            
            return {
              step: index + 1,
              title: title,
              description: '',
              estimatedTime: null,
              skills_covered: skills.length > 0 ? skills : []
            };
          });
          
          // Use converted steps
          module.steps = convertedSteps;
          // Update hasSteps flag so converted steps are included
          hasSteps = true;
        }
        
        // Build module structure matching Prompt 3 EXACTLY - enforce field order from prompt!
        // Prompt 3 specifies: module_order → module_title → estimated_duration_hours → skills_in_module → steps
        // We MUST create the object in this exact order to match the prompt specification
        const moduleData = {};
        
        // Field 1: module_order (MUST be first)
        moduleData.module_order = module.module_order;
        
        // Field 2: module_title (MUST be second)
        moduleData.module_title = module.module_title;
        
        // Field 3: estimated_duration_hours (MUST be third)
        moduleData.estimated_duration_hours = module.estimated_duration_hours;
        
        // Field 4: skills_in_module (MUST be fourth) - only add if not empty
        if (skillsInModule.length > 0) {
          moduleData.skills_in_module = skillsInModule;
        }
        
        // Field 5: steps (MUST be last) - only add if present (includes converted steps)
        const finalHasSteps = hasSteps || (module.steps && Array.isArray(module.steps) && module.steps.length > 0);
        if (finalHasSteps) {
          moduleData.steps = module.steps.map(step => {
            // Clean step to match Prompt 3 structure exactly
            // Step field order: step → title → description → estimatedTime → skills_covered
            return {
              step: step.step,
              title: step.title,
              description: step.description,
              estimatedTime: step.estimatedTime,
              skills_covered: step.skills_covered || []
            };
          });
        }
        
        return moduleData;
      });
      
      // Return structure matching Prompt 3 EXACTLY - enforce field order from prompt!
      // Prompt 3 specifies: path_title → learner_id → total_estimated_duration_hours → learning_modules
      const pathData = {};
      
      // Field 1: path_title (MUST be first)
      pathData.path_title = pathTitle;
      
      // Field 2: learner_id (MUST be second)
      pathData.learner_id = parsed.learner_id || userId;
      
      // Field 3: total_estimated_duration_hours (MUST be third)
      pathData.total_estimated_duration_hours = totalDuration;
      
      // Field 4: learning_modules (MUST be last)
      pathData.learning_modules = processedModules;
      
      return pathData;
    }

    // Fallback: Convert old format (pathSteps or steps) to new format (learning_modules)
    console.warn('⚠️ No learning_modules found, converting old format to new structure');
    const oldSteps = this._extractPathSteps(parsed);
    
    // Convert old steps format to new learning_modules structure
    if (oldSteps && oldSteps.length > 0) {
      return {
        path_title: parsed.pathTitle || parsed.path_title || competencyTargetName || 'Learning Path',
        learner_id: parsed.learner_id || userId,
        total_estimated_duration_hours: parsed.totalDurationHours || parsed.total_estimated_duration_hours || null,
        learning_modules: [{
          module_order: 1,
          module_title: parsed.pathTitle || parsed.path_title || 'Learning Path',
          estimated_duration_hours: parsed.totalDurationHours || parsed.total_estimated_duration_hours || null,
          skills_in_module: this._extractAllSkillsFromOldSteps(oldSteps),
          steps: oldSteps.map((step, index) => ({
            step: step.step || step.order || index + 1,
            title: step.title || step.name || `Step ${index + 1}`,
            description: step.description || '',
            estimatedTime: step.estimatedTime || step.duration || null,
            skills_covered: step.skills_covered || step.skills || []
          }))
        }]
      };
    }
    
    // If no steps found, return minimal structure
    return {
      path_title: parsed.pathTitle || parsed.path_title || competencyTargetName || 'Learning Path',
      learner_id: parsed.learner_id || userId,
      total_estimated_duration_hours: parsed.totalDurationHours || parsed.total_estimated_duration_hours || null,
      learning_modules: []
    };
  }
  
  /**
   * Extract all skills from old steps format (helper for conversion)
   * @private
   */
  _extractAllSkillsFromOldSteps(steps) {
    const skills = new Set();
    steps.forEach(step => {
      if (step.skills_covered && Array.isArray(step.skills_covered)) {
        step.skills_covered.forEach(skill => skills.add(skill));
      }
      if (step.skills && Array.isArray(step.skills)) {
        step.skills.forEach(skill => skills.add(skill));
      }
    });
    return Array.from(skills);
  }

  /**
   * Validate learning path for pedagogical correctness
   * @param {Object} pathData - Extracted path data from Prompt 3
   * @returns {Object} - { valid: boolean, errors: string[] }
   */
  _validateLearningPath(pathData) {
    const errors = [];
    
    if (!pathData.learning_modules || !Array.isArray(pathData.learning_modules)) {
      return { valid: false, errors: ['Missing or invalid learning_modules'] };
    }
    
    const modules = pathData.learning_modules;
    
    // Check 1: Module order is sequential
    for (let i = 0; i < modules.length; i++) {
      if (modules[i].module_order !== i + 1) {
        errors.push(`Module ${i + 1} has incorrect module_order: ${modules[i].module_order}`);
      }
    }
    
    // Check 2: Module difficulty progression
    // Use knowledge base with fallback to pattern matching
    try {
      for (let i = 1; i < modules.length; i++) {
        const prevModule = modules[i - 1];
        const currModule = modules[i];
        
        const prevSkills = this._extractAllSkillsFromModule(prevModule);
        const currSkills = this._extractAllSkillsFromModule(currModule);
        
        // Calculate difficulty using knowledge base + pattern matching fallback
        const prevDifficulty = prevSkills.length > 0 
          ? prevSkills.reduce((sum, skill) => sum + getDifficultyScoreWithFallback(skill), 0) / prevSkills.length
          : 0;
        const currDifficulty = currSkills.length > 0
          ? currSkills.reduce((sum, skill) => sum + getDifficultyScoreWithFallback(skill), 0) / currSkills.length
          : 0;
        
        if (currDifficulty > 0 && prevDifficulty > 0 && currDifficulty < prevDifficulty) {
          errors.push(`Module ${currModule.module_order} has lower average difficulty (${currDifficulty.toFixed(2)}) than Module ${prevModule.module_order} (${prevDifficulty.toFixed(2)})`);
        }
      }
    } catch (e) {
      // Fallback to heuristic if knowledge base not available
      console.warn('⚠️ Difficulty calculation failed, using heuristic fallback:', e.message);
      for (let i = 1; i < modules.length; i++) {
        const prevModule = modules[i - 1];
        const currModule = modules[i];
        
        const prevSkills = this._extractAllSkillsFromModule(prevModule);
        const currSkills = this._extractAllSkillsFromModule(currModule);
        
        // Basic heuristic: if current module has foundational skills and previous has advanced, that's wrong
        if (this._hasFoundationalSkillsAfterAdvanced(currSkills, prevSkills)) {
          errors.push(`Module ${currModule.module_order} may have foundational skills that belong in earlier modules`);
        }
      }
    }
    
    // Check 2.5: Prerequisite validation across entire path
    // NOTE: This only validates skills that exist in knowledge base (exact match)
    // Unknown skills are skipped (no error)
    try {
      const skillOrder = this._extractSkillOrderFromPath(pathData);
      const prerequisiteErrors = validatePrerequisiteOrder(skillOrder);
      if (prerequisiteErrors.length > 0) {
        errors.push(...prerequisiteErrors);
        console.warn(`⚠️ Found ${prerequisiteErrors.length} prerequisite violations (only for skills in knowledge base)`);
      }
    } catch (e) {
      // Knowledge base not available, skip prerequisite validation
      console.warn('⚠️ Prerequisite validation failed:', e.message);
    }
    
    // Check 3: Step order within modules
    modules.forEach(module => {
      if (!module.steps || !Array.isArray(module.steps)) return;
      
      // Check step numbering is sequential
      for (let i = 0; i < module.steps.length; i++) {
        if (module.steps[i].step !== i + 1) {
          errors.push(`Module ${module.module_order}, Step ${i + 1} has incorrect step number: ${module.steps[i].step}`);
        }
      }
      
      // Check skills_in_module order matches step order
      if (module.skills_in_module && module.steps.length > 0) {
        const stepSkillOrder = this._extractSkillOrderFromSteps(module.steps);
        if (!this._arraysMatchOrder(module.skills_in_module, stepSkillOrder)) {
          errors.push(`Module ${module.module_order}: skills_in_module order does not match step introduction order`);
        }
        
        // Check that all skills in skills_in_module appear in steps
        const skillsInSteps = new Set();
        module.steps.forEach(step => {
          if (step.skills_covered) {
            step.skills_covered.forEach(skill => skillsInSteps.add(skill));
          }
        });
        
        module.skills_in_module.forEach(skill => {
          if (!skillsInSteps.has(skill)) {
            errors.push(`Module ${module.module_order}: Skill "${skill}" is in skills_in_module but not covered in any step`);
          }
        });
        
        // Check that all skills in steps appear in skills_in_module
        skillsInSteps.forEach(skill => {
          if (!module.skills_in_module.includes(skill)) {
            errors.push(`Module ${module.module_order}: Skill "${skill}" is covered in steps but not listed in skills_in_module`);
          }
        });
      }
    });
    
    // Check 4: All skills appear exactly once
    const allSkills = this._extractAllSkillsFromPath(pathData);
    const skillCounts = {};
    allSkills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    
    Object.entries(skillCounts).forEach(([skill, count]) => {
      if (count > 1) {
        errors.push(`Skill "${skill}" appears ${count} times (should appear exactly once)`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract all skills from a module (from steps and skills_in_module)
   * @private
   */
  _extractAllSkillsFromModule(module) {
    const skills = new Set();
    
    if (module.skills_in_module) {
      module.skills_in_module.forEach(skill => skills.add(skill));
    }
    
    if (module.steps) {
      module.steps.forEach(step => {
        if (step.skills_covered) {
          step.skills_covered.forEach(skill => skills.add(skill));
        }
      });
    }
    
    return Array.from(skills);
  }

  /**
   * Extract skill order from steps (order of first appearance)
   * @private
   */
  _extractSkillOrderFromSteps(steps) {
    const order = [];
    const seen = new Set();
    
    steps.forEach(step => {
      if (step.skills_covered) {
        step.skills_covered.forEach(skill => {
          if (!seen.has(skill)) {
            order.push(skill);
            seen.add(skill);
          }
        });
      }
    });
    
    return order;
  }

  /**
   * Check if arrays match order (allowing for subset)
   * @private
   */
  _arraysMatchOrder(arr1, arr2) {
    // Check if arr1 is a subsequence of arr2 or vice versa
    let i = 0, j = 0;
    while (i < arr1.length && j < arr2.length) {
      if (arr1[i] === arr2[j]) {
        i++;
      }
      j++;
    }
    return i === arr1.length;
  }

  /**
   * Extract all skills from entire path
   * @private
   */
  _extractAllSkillsFromPath(pathData) {
    const skills = [];
    if (pathData.learning_modules) {
      pathData.learning_modules.forEach(module => {
        skills.push(...this._extractAllSkillsFromModule(module));
      });
    }
    return skills;
  }

  /**
   * Extract skill order from entire path (order of first appearance)
   * @private
   */
  _extractSkillOrderFromPath(pathData) {
    const order = [];
    const seen = new Set();
    
    if (pathData.learning_modules) {
      pathData.learning_modules.forEach(module => {
        if (module.steps) {
          module.steps.forEach(step => {
            if (step.skills_covered) {
              step.skills_covered.forEach(skill => {
                if (!seen.has(skill)) {
                  order.push(skill);
                  seen.add(skill);
                }
              });
            }
          });
        }
      });
    }
    
    return order;
  }

  /**
   * Heuristic: Check if foundational skills appear after advanced skills
   * Uses pattern-based difficulty inference (works for any domain)
   * @private
   */
  _hasFoundationalSkillsAfterAdvanced(laterSkills, earlierSkills) {
      // Use pattern-based difficulty inference from knowledge base
    try {
      // Calculate average difficulty for each set
      const laterAvgDifficulty = laterSkills.length > 0
        ? laterSkills.reduce((sum, skill) => sum + getDifficultyScoreWithFallback(skill), 0) / laterSkills.length
        : 0;
      const earlierAvgDifficulty = earlierSkills.length > 0
        ? earlierSkills.reduce((sum, skill) => sum + getDifficultyScoreWithFallback(skill), 0) / earlierSkills.length
        : 0;
      
      // If later module has lower difficulty than earlier, that's wrong
      return laterAvgDifficulty > 0 && earlierAvgDifficulty > 0 && laterAvgDifficulty < earlierAvgDifficulty;
    } catch (e) {
      // Fallback to basic keyword matching if knowledge base not available
      const foundationalKeywords = ['basic', 'introduction', 'intro', 'fundamentals', 'getting started', 'first steps', 'syntax', 'variables', 'data types'];
      const advancedKeywords = ['advanced', 'expert', 'master', 'optimization', 'performance', 'memory management', 'concurrency', 'design patterns', 'architecture', 'enterprise', 'scalability'];
      
      const laterHasFoundational = laterSkills.some(skill => 
        foundationalKeywords.some(keyword => skill.toLowerCase().includes(keyword))
      );
      const earlierHasAdvanced = earlierSkills.some(skill =>
        advancedKeywords.some(keyword => skill.toLowerCase().includes(keyword))
      );
      
      return laterHasFoundational && earlierHasAdvanced;
    }
  }

  /**
   * Add validation feedback to prompt for retry
   * @private
   */
  _addValidationFeedbackToPrompt(originalPrompt, validationErrors) {
    const feedback = `\n\n⚠️ VALIDATION FAILED - Previous attempt had these errors:\n${validationErrors.map(e => `- ${e}`).join('\n')}\n\nPlease regenerate the learning path ensuring these issues are fixed.`;
    return originalPrompt + feedback;
  }

  /**
   * Extract path steps from Prompt 3 result (old format fallback)
   * Used only for converting old format to new format
   * @private
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
   * Parse steps from text (fallback for very old format)
   * Converts text lines to step objects compatible with new format
   * @private
   */
  _parseStepsFromText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      step: index + 1,
      title: line.trim(),
      description: '',
      estimatedTime: null,
      skills_covered: []
    }));
  }

  /**
   * Extract skill names from gap data structure
   * Handles different gap formats: direct competency map, missing_skills_map, identifiedGaps (legacy), etc.
   * @private
   */
  _extractSkillNamesFromGap(gapData) {
    const skillNames = [];
    if (!gapData || typeof gapData !== 'object') return skillNames;

    // NEW FORMAT: Handle direct competency map (e.g., {"Competency_X": [skills]})
    // Check if gapData is directly a competency map (object with competency names as keys, arrays as values)
    const isDirectCompetencyMap = !gapData.missing_skills_map && 
                                  !gapData.identifiedGaps && 
                                  !Array.isArray(gapData) &&
                                  Object.values(gapData).every(value => Array.isArray(value) || typeof value === 'string');
    
    if (isDirectCompetencyMap) {
      for (const [competencyName, skills] of Object.entries(gapData)) {
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

    // Handle missing_skills_map format (nested format from Skills Engine)
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

    // LEGACY FORMAT: Handle identifiedGaps format (old structured format - deprecated)
    if (gapData.identifiedGaps && Array.isArray(gapData.identifiedGaps)) {
      console.warn('⚠️ Using legacy identifiedGaps format with skill arrays - consider updating to competency map format');
      gapData.identifiedGaps.forEach(gap => {
        // Handle legacy skill arrays (deprecated - kept for backward compatibility)
        const legacySkillArrays = gap.microSkills || gap.nanoSkills || [];
        legacySkillArrays.forEach(skill => {
          if (typeof skill === 'string') {
            skillNames.push(skill);
          } else if (skill && (skill.name || skill.id || skill.skill_id)) {
            skillNames.push(skill.name || skill.id || skill.skill_id);
          }
        });
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

  /**
   * Normalize skill breakdown from Skills Engine
   * Extracts only skill names from objects, ignoring skill_id if present
   * Skills Engine may send skills as objects: {skill_id: "...", skill_name: "..."}
   * This method ensures we only keep skill names (strings)
   * @param {Object} breakdown - Skill breakdown from Skills Engine
   * @returns {Object} Normalized breakdown with only skill names (strings)
   * @private
   */
  _normalizeSkillBreakdown(breakdown) {
    if (!breakdown || typeof breakdown !== 'object') {
      return breakdown;
    }

    // Helper function to extract skill names from array (removes skill_id, keeps only skill_name)
    const extractSkillNames = (skillsArray) => {
      if (!Array.isArray(skillsArray)) {
        return skillsArray;
      }
      return skillsArray.map(skill => {
        // If it's already a string, return as-is
        if (typeof skill === 'string') {
          return skill;
        }
        // If it's an object, extract skill_name (ignore skill_id)
        if (typeof skill === 'object' && skill !== null) {
          return skill.skill_name || skill.name || skill.skillName || String(skill);
        }
        // Fallback
        return String(skill);
      }).filter(name => name && name.trim() !== ''); // Remove empty strings
    };

    const normalized = {};

    // Process each competency in the breakdown
    for (const [competencyName, skills] of Object.entries(breakdown)) {
      if (Array.isArray(skills)) {
        // New format: direct array of skill names (or objects with skill_id/skill_name)
        normalized[competencyName] = extractSkillNames(skills);
      } else if (skills && typeof skills === 'object') {
        // Old format: object with microSkills/nanoSkills (backward compatibility)
        const microSkills = skills.microSkills || [];
        const nanoSkills = skills.nanoSkills || [];
        const skillsArray = skills.skills || [];
        
        // Combine all skills and extract names
        const allSkills = [
          ...microSkills,
          ...nanoSkills,
          ...skillsArray
        ];
        normalized[competencyName] = extractSkillNames(allSkills);
      } else {
        // Unknown format, keep as-is
        normalized[competencyName] = skills;
      }
    }

    return normalized;
  }
}

