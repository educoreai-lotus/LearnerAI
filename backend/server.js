import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Infrastructure
import { GeminiApiClient } from './src/infrastructure/clients/GeminiApiClient.js';
import { SkillsEngineClient } from './src/infrastructure/clients/SkillsEngineClient.js';
import { HttpClient } from './src/infrastructure/clients/HttpClient.js';
import { CourseBuilderClient } from './src/infrastructure/clients/CourseBuilderClient.js';
import { AnalyticsClient } from './src/infrastructure/clients/AnalyticsClient.js';
import { ReportsClient } from './src/infrastructure/clients/ReportsClient.js';
import { RAGMicroserviceClient } from './src/infrastructure/clients/RAGMicroserviceClient.js';
import { SupabaseRepository } from './src/infrastructure/repositories/SupabaseRepository.js';
import { JobRepository } from './src/infrastructure/repositories/JobRepository.js';
// CourseSuggestionsRepository removed - was part of old schema
import { LearnerRepository } from './src/infrastructure/repositories/LearnerRepository.js';
import { CourseRepository } from './src/infrastructure/repositories/CourseRepository.js';
import { SkillsGapRepository } from './src/infrastructure/repositories/SkillsGapRepository.js';
import { SkillsExpansionRepository } from './src/infrastructure/repositories/SkillsExpansionRepository.js';
import { RecommendationRepository } from './src/infrastructure/repositories/RecommendationRepository.js';
import { PromptLoader } from './src/infrastructure/prompts/PromptLoader.js';
import { NotificationService } from './src/infrastructure/services/NotificationService.js';

// Use Cases
import { CheckApprovalPolicyUseCase } from './src/application/useCases/CheckApprovalPolicyUseCase.js';
import { RequestPathApprovalUseCase } from './src/application/useCases/RequestPathApprovalUseCase.js';
import { DistributePathUseCase } from './src/application/useCases/DistributePathUseCase.js';
import { DetectCompletionUseCase } from './src/application/useCases/DetectCompletionUseCase.js';
import { GenerateCourseSuggestionsUseCase } from './src/application/useCases/GenerateCourseSuggestionsUseCase.js';

// API Routes
import { createLearningPathsRouter } from './src/api/routes/learningPaths.js';
import { createJobsRouter } from './src/api/routes/jobs.js';
import { createCompaniesRouter } from './src/api/routes/companies.js';
import { createApprovalsRouter } from './src/api/routes/approvals.js';
import { createCompletionsRouter } from './src/api/routes/completions.js';
import { createSuggestionsRouter } from './src/api/routes/suggestions.js';
import { createAssetsRouter } from './src/api/routes/assets.js';
import { createLearnersRouter } from './src/api/routes/learners.js';
import { createCoursesRouter } from './src/api/routes/courses.js';
import { createSkillsGapsRouter } from './src/api/routes/skillsGaps.js';
import { createSkillsExpansionsRouter } from './src/api/routes/skillsExpansions.js';
import { createRecommendationsRouter } from './src/api/routes/recommendations.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize dependencies
let dependencies;
try {
  // Initialize clients
  const geminiClient = new GeminiApiClient(process.env.GEMINI_API_KEY);
  const httpClient = new HttpClient();
  const skillsEngineClient = new SkillsEngineClient({
    baseUrl: process.env.SKILLS_ENGINE_URL || 'http://localhost:5001',
    serviceToken: process.env.LEARNER_AI_SERVICE_TOKEN,
    httpClient
  });

  // Initialize repositories
  const repository = new SupabaseRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  const jobRepository = new JobRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  // CourseSuggestionsRepository removed - was part of old schema
  const suggestionsRepository = null;
  const learnerRepository = new LearnerRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  const courseRepository = new CourseRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  const skillsGapRepository = new SkillsGapRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  const skillsExpansionRepository = new SkillsExpansionRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  const recommendationRepository = new RecommendationRepository(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  // Initialize microservice clients
  const courseBuilderClient = new CourseBuilderClient({
    baseUrl: process.env.COURSE_BUILDER_URL,
    serviceToken: process.env.COURSE_BUILDER_TOKEN,
    httpClient
  });
  const analyticsClient = new AnalyticsClient({
    baseUrl: process.env.ANALYTICS_URL,
    serviceToken: process.env.ANALYTICS_TOKEN,
    httpClient
  });
  const reportsClient = new ReportsClient({
    baseUrl: process.env.REPORTS_URL,
    serviceToken: process.env.REPORTS_TOKEN,
    httpClient
  });
  const ragClient = new RAGMicroserviceClient({
    baseUrl: process.env.RAG_MICROSERVICE_URL || 'http://localhost:5004',
    serviceToken: process.env.RAG_MICROSERVICE_TOKEN,
    httpClient
  });

  // Initialize services
  const notificationService = new NotificationService();

  // Initialize prompt loader
  const promptLoader = new PromptLoader();

  // Initialize Feature 2 use cases (disabled - repositories deleted with old schema)
  // const checkApprovalPolicyUseCase = new CheckApprovalPolicyUseCase({ companyRepository });
  // const requestPathApprovalUseCase = new RequestPathApprovalUseCase({
  //   approvalRepository,
  //   notificationService
  // });
  const checkApprovalPolicyUseCase = null;
  const requestPathApprovalUseCase = null;
  const distributePathUseCase = new DistributePathUseCase({
    courseBuilderClient,
    analyticsClient,
    reportsClient,
    repository
  });

  // Initialize Feature 3 use cases
  const generateCourseSuggestionsUseCase = new GenerateCourseSuggestionsUseCase({
    geminiClient,
    ragClient,
    promptLoader,
    suggestionsRepository,
    learningPathRepository: repository,
    jobRepository
  });
  const detectCompletionUseCase = new DetectCompletionUseCase({
    generateCourseSuggestionsUseCase,
    jobRepository
  });

  // Assemble dependencies
  dependencies = {
    geminiClient,
    skillsEngineClient,
    repository,
    jobRepository,
    suggestionsRepository,
    learnerRepository,
    courseRepository,
    skillsGapRepository,
    skillsExpansionRepository,
    recommendationRepository,
    courseBuilderClient,
    analyticsClient,
    reportsClient,
    ragClient,
    notificationService,
    promptLoader,
    detectCompletionUseCase,
    generateCourseSuggestionsUseCase,
    checkApprovalPolicyUseCase,
    requestPathApprovalUseCase,
    distributePathUseCase
  };

  console.log('✅ Dependencies initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize dependencies:', error.message);
  console.warn('⚠️  Some features may not work without proper configuration');
  // Create minimal dependencies for health checks
  dependencies = {
    geminiClient: null,
    skillsEngineClient: null,
    repository: null,
    jobRepository: null,
    promptLoader: null
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'LearnerAI Backend is running',
    timestamp: new Date().toISOString(),
    dependencies: {
      gemini: !!dependencies.geminiClient,
      supabase: !!dependencies.repository,
      prompts: !!dependencies.promptLoader
    }
  });
});

// API version info
app.get('/api', (req, res) => {
  res.json({ 
    message: 'LearnerAI REST API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      learningPaths: '/api/v1/learning-paths',
      jobs: '/api/v1/jobs',
      companies: '/api/v1/companies',
      approvals: '/api/v1/approvals',
      completions: '/api/v1/completions',
      suggestions: '/api/v1/suggestions',
      learners: '/api/v1/learners',
      courses: '/api/v1/courses',
      skillsGaps: '/api/v1/skills-gaps',
      skillsExpansions: '/api/v1/skills-expansions',
      recommendations: '/api/v1/recommendations'
    }
  });
});

// API Routes
if (dependencies.repository && dependencies.jobRepository) {
  app.use('/api/v1/learning-paths', createLearningPathsRouter(dependencies));
  app.use('/api/v1/jobs', createJobsRouter(dependencies));
  app.use('/api/v1/companies', createCompaniesRouter(dependencies));
  app.use('/api/v1/approvals', createApprovalsRouter(dependencies));
  app.use('/api/v1/completions', createCompletionsRouter(dependencies));
  app.use('/api/v1/suggestions', createSuggestionsRouter(dependencies));
  app.use('/api/assets', createAssetsRouter());
  
  // New schema endpoints
  app.use('/api/v1/learners', createLearnersRouter(dependencies));
  app.use('/api/v1/courses', createCoursesRouter(dependencies));
  app.use('/api/v1/skills-gaps', createSkillsGapsRouter(dependencies));
  app.use('/api/v1/skills-expansions', createSkillsExpansionsRouter(dependencies));
  app.use('/api/v1/recommendations', createRecommendationsRouter(dependencies));
  
  console.log('✅ API routes registered');
} else {
  console.warn('⚠️  API routes not registered - missing dependencies');
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to LearnerAI REST API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      learningPaths: '/api/v1/learning-paths',
      jobs: '/api/v1/jobs',
      companies: '/api/v1/companies',
      approvals: '/api/v1/approvals',
      completions: '/api/v1/completions',
      suggestions: '/api/v1/suggestions',
      learners: '/api/v1/learners',
      courses: '/api/v1/courses',
      skillsGaps: '/api/v1/skills-gaps',
      skillsExpansions: '/api/v1/skills-expansions',
      recommendations: '/api/v1/recommendations'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.path} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LearnerAI Backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
});

export default app;

