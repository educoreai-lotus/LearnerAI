import { Job } from '../../domain/entities/Job.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * GenerateCourseSuggestionsUseCase
 * Generates course suggestions using Prompt 4 and RAG microservice
 */
export class GenerateCourseSuggestionsUseCase {
  constructor({
    geminiClient,
    ragClient,
    promptLoader,
    suggestionsRepository,
    recommendationRepository,
    learningPathRepository,
    jobRepository
  }) {
    this.geminiClient = geminiClient;
    this.ragClient = ragClient;
    this.promptLoader = promptLoader;
    this.suggestionsRepository = suggestionsRepository; // May be null if old schema removed
    this.recommendationRepository = recommendationRepository || null;
    this.learningPathRepository = learningPathRepository;
    this.jobRepository = jobRepository;
  }

  /**
   * Execute - Creates a job and returns job ID
   * This is the synchronous entry point
   */
  async execute(completionData) {
    const { userId, competencyTargetName, completionDate, completionDetails = {} } = completionData;

    // Validate required fields
    if (!userId || !competencyTargetName) {
      throw new Error('userId and competencyTargetName are required');
    }

    // Create job
    const job = new Job({
      id: uuidv4(),
      userId: userId,
      companyId: completionDetails.companyId || null,
      competencyTargetName,
      type: 'course-suggestion',
      status: 'pending'
    });

    const createdJob = await this.jobRepository.createJob(job);

    // Start background processing (fire and forget)
    this.processJob(createdJob, completionData).catch(error => {
      console.error('Background suggestion generation failed:', error);
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
   * ProcessJob - Executes suggestion generation asynchronously
   */
  async processJob(job, completionData) {
    try {
      const { userId, competencyTargetName, completionDate, completionDetails = {} } = completionData;

      // Update job to processing
      await this.jobRepository.updateJob(job.id, {
        status: 'processing',
        currentStage: 'suggestion-generation',
        progress: 20
      });

      // Get learning path history for context
      let learningPathHistory = null;
      if (this.learningPathRepository && this.learningPathRepository.getLearningPathsByUser) {
        try {
          const paths = await this.learningPathRepository.getLearningPathsByUser(userId);
          learningPathHistory = paths.map(path => ({
            competencyTargetName: path.competencyTargetName,
            pathTitle: path.pathTitle,
            status: path.status,
            generatedAt: path.generatedAt
          }));
        } catch (error) {
          console.warn('Could not fetch learning path history:', error.message);
        }
      }

      // Prepare completion details
      const completedCourseDetails = {
        competencyTargetName,
        completionDate: completionDate,
        ...completionDetails
      };

      // Load and format Prompt 4
      const prompt4 = await this.promptLoader.loadPrompt('prompt4-course-suggestions');
      const fullPrompt4 = prompt4
        .replace('{userId}', userId)
        .replace('{completedCourseId}', competencyTargetName)
        .replace('{completionDate}', completionDate)
        .replace('{completedCourseDetails}', JSON.stringify(completedCourseDetails, null, 2))
        .replace('{learningPathHistory}', learningPathHistory 
          ? JSON.stringify(learningPathHistory, null, 2)
          : 'No previous learning paths found');

      // Execute Prompt 4 with longer timeout for complex suggestions
      await this.jobRepository.updateJob(job.id, {
        currentStage: 'ai-suggestion-generation',
        progress: 40
      });

      const prompt4Result = await this.geminiClient.executePrompt(fullPrompt4, '', {
        timeout: 90000, // 90 seconds for suggestion generation
        maxRetries: 3
      });

      // Parse suggestions from Prompt 4 result
      const suggestions = this._parseSuggestions(prompt4Result, userId, competencyTargetName);

      // Send to RAG microservice for enhancement
      await this.jobRepository.updateJob(job.id, {
        currentStage: 'rag-processing',
        progress: 70
      });

      let enhancedSuggestions = suggestions;
      if (this.ragClient) {
        try {
          const ragResult = await this.ragClient.processCourseSuggestions(suggestions, {
            userId,
            competencyTargetName,
            completionDate
          });
          enhancedSuggestions = ragResult.enhancedSuggestions || suggestions;
        } catch (error) {
          console.warn('RAG processing failed, using original suggestions:', error.message);
          // Continue with original suggestions if RAG fails
        }
      }

      // Save suggestions to database (if repository available)
      await this.jobRepository.updateJob(job.id, {
        currentStage: 'saving',
        progress: 90
      });

      let savedSuggestion = null;
      if (this.recommendationRepository && typeof this.recommendationRepository.createRecommendation === 'function') {
        // Persist to the current schema (recommendations table)
        const created = await this.recommendationRepository.createRecommendation({
          user_id: userId,
          base_course_name: competencyTargetName,
          suggested_courses: {
            originalSuggestions: suggestions,
            enhancedSuggestions: enhancedSuggestions,
            ragProcessed: this.ragClient !== null
          },
          sent_to_rag: this.ragClient !== null
        });

        savedSuggestion = {
          id: created.recommendation_id,
          userId,
          competencyTargetName,
          suggestionData: created.suggested_courses
        };
      } else if (this.suggestionsRepository) {
        savedSuggestion = await this.suggestionsRepository.saveSuggestion({
          userId,
          competencyTargetName,
          suggestionData: {
            originalSuggestions: suggestions,
            enhancedSuggestions: enhancedSuggestions,
            ragProcessed: this.ragClient !== null
          },
          status: 'pending'
        });
      } else {
        console.warn('⚠️  No suggestions repository available - suggestions not saved to database');
        // Create a mock suggestion object for job result
        savedSuggestion = {
          id: `temp_${Date.now()}`,
          userId,
          competencyTargetName,
          suggestionData: {
            originalSuggestions: suggestions,
            enhancedSuggestions: enhancedSuggestions,
            ragProcessed: this.ragClient !== null
          }
        };
      }

      // Mark job as completed
      await this.jobRepository.updateJob(job.id, {
        status: 'completed',
        progress: 100,
        currentStage: 'completed',
        result: { suggestionId: savedSuggestion.id }
      });

      return savedSuggestion;
    } catch (error) {
      console.error('Error processing course suggestion job:', error);
      await this.jobRepository.updateJob(job.id, {
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Parse suggestions from Prompt 4 result
   * @private
   */
  _parseSuggestions(promptResult, userId, competencyTargetName) {
    // Handle both JSON string and object responses
    let suggestions;
    if (typeof promptResult === 'string') {
      try {
        suggestions = JSON.parse(promptResult);
      } catch (e) {
        // Try to extract JSON from text
        const jsonMatch = promptResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse suggestions from prompt result');
        }
      }
    } else {
      suggestions = promptResult;
    }

    // Validate structure
    if (!suggestions.suggested_courses || !Array.isArray(suggestions.suggested_courses)) {
      throw new Error('Invalid suggestions format: missing suggested_courses array');
    }

    return {
      request_id: suggestions.request_id || `SUGGESTION_${Date.now()}`,
      learner_id: suggestions.learner_id || userId,
      competency_target_name: competencyTargetName,
      completed_course_id: competencyTargetName, // Legacy support for RAG microservice
      analysis_summary: suggestions.analysis_summary || '',
      suggested_courses: suggestions.suggested_courses,
      career_path_recommendations: suggestions.career_path_recommendations || {},
      personalization_notes: suggestions.personalization_notes || ''
    };
  }
}

