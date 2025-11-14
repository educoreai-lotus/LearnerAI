/**
 * Mock Data for Testing
 * Provides sample data matching the database schema
 */

export const mockCompanies = [
  {
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    decision_maker_policy: 'auto',
    decision_maker: null
  },
  {
    company_id: 'e4f5a6b7-8901-2345-6789-012345678901',
    company_name: 'InnovateLabs',
    decision_maker_policy: 'auto',
    decision_maker: null
  }
];

export const mockLearners = [
  {
    user_id: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Alice Johnson',
    decision_maker_policy: 'auto',
    decision_maker_id: null
  },
  {
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Wajdan Al-Mansouri',
    decision_maker_policy: 'manual',
    decision_maker_id: 'd3e4f5a6-7890-1234-5678-901234567890'
  },
  {
    user_id: 'c3d4e5f6-a7b8-9012-3456-789012345678',
    company_id: 'e4f5a6b7-8901-2345-6789-012345678901',
    company_name: 'InnovateLabs',
    user_name: 'Bob Smith',
    decision_maker_policy: 'auto',
    decision_maker_id: null
  }
];

/**
 * Mock Skills Gaps
 * 
 * NOTE: These all have `exam_status: 'fail'` for testing failed exam scenarios.
 * When `exam_status: 'pass'`, a course completion event would trigger recommendation generation.
 */
export const mockSkillsGaps = [
  {
    gap_id: 'd7e8f9a0-b1c2-3456-7890-123456789012',
    user_id: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Alice Johnson',
    skills_raw_data: {
      "Competency_JavaScript_ES6_Syntax": [
        "MGS_Arrow_Functions",
        "MGS_Destructuring",
        "MGS_Template_Literals",
        "MGS_Spread_Operator"
      ],
      "Competency_Async_Await_Patterns": [
        "MGS_Promise_Handling",
        "MGS_Error_Handling_Async",
        "MGS_Parallel_Sequential_Execution"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'JavaScript ES6+ Syntax'
  },
  {
    gap_id: 'e8f9a0b1-c2d3-4567-8901-234567890123',
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Wajdan Al-Mansouri',
    skills_raw_data: {
      "Competency_React_Hooks": [
        "MGS_useState_Hook",
        "MGS_useEffect_Hook",
        "MGS_Custom_Hooks"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'React Hooks'
  }
];

export const mockCourses = [
  {
    competency_target_name: 'JavaScript ES6+ Syntax',
    user_id: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    learning_path: {
      pathSteps: [
        {
          stepId: 'step-001',
          title: 'Introduction to ES6+ Syntax',
          description: 'Learn modern JavaScript syntax',
          duration: 2,
          order: 1,
          skills: ['micro-001', 'micro-002']
        },
        {
          stepId: 'step-002',
          title: 'Advanced ES6 Features',
          description: 'Master advanced features',
          duration: 3,
          order: 2,
          skills: ['micro-003', 'micro-004']
        },
        {
          stepId: 'step-003',
          title: 'Async Programming',
          description: 'Understanding async/await',
          duration: 4,
          order: 3,
          skills: ['micro-005', 'micro-006', 'micro-007']
        }
      ],
      pathTitle: 'JavaScript Modern Development Path',
      totalDurationHours: 9,
      learningModules: [
        { moduleId: 'module-001', name: 'ES6 Fundamentals', duration: 5 },
        { moduleId: 'module-002', name: 'Async Patterns', duration: 4 }
      ],
      metadata: {
        generatedAt: '2025-11-04T10:00:00Z',
        version: '1.0',
        competencies: ['JavaScript ES6+ Syntax', 'Async/Await Patterns']
      },
      companyId: 'c1d2e3f4-5678-9012-3456-789012345678',
      competencyTargetName: 'JavaScript ES6+ Syntax',
      status: 'pending'
    },
    approved: false
  },
  {
    competency_target_name: 'React Hooks',
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    learning_path: {
      pathSteps: [
        {
          stepId: 'step-004',
          title: 'React Hooks Basics',
          description: 'Introduction to React Hooks',
          duration: 3,
          order: 1,
          skills: ['micro-008']
        },
        {
          stepId: 'step-005',
          title: 'Advanced Hooks',
          description: 'useEffect and custom hooks',
          duration: 4,
          order: 2,
          skills: ['micro-009', 'micro-010']
        }
      ],
      pathTitle: 'React Hooks Mastery',
      totalDurationHours: 7,
      learningModules: [
        { moduleId: 'module-003', name: 'Hooks Fundamentals', duration: 3 },
        { moduleId: 'module-004', name: 'Advanced Patterns', duration: 4 }
      ],
      metadata: {
        generatedAt: '2025-11-05T14:30:00Z',
        version: '1.0',
        competencies: ['React Hooks']
      },
      companyId: 'c1d2e3f4-5678-9012-3456-789012345678',
      competencyTargetName: 'React Hooks',
      status: 'pending'
    },
    approved: false
  }
];

export const mockSkillsExpansions = [
  {
    expansion_id: 'f1a2b3c4-d5e6-7890-1234-567890abcdef',
    prompt_1_output: {
      expandedCompetencies: [
        {
          name: 'TypeScript Fundamentals',
          description: 'Static typing for JavaScript',
          relevance: 'high'
        },
        {
          name: 'Testing with Jest',
          description: 'Unit and integration testing',
          relevance: 'medium'
        }
      ],
      generatedAt: '2025-11-04T10:15:00Z'
    },
    prompt_2_output: {
      identifiedCompetencies: [
        {
          competencyName: 'TypeScript Fundamentals',
          microSkills: ['Type definitions', 'Interfaces', 'Generics'],
          nanoSkills: ['Type annotations', 'Type inference']
        },
        {
          competencyName: 'Testing with Jest',
          microSkills: ['Test structure', 'Mocking', 'Assertions'],
          nanoSkills: ['describe blocks', 'it/test blocks']
        }
      ],
      generatedAt: '2025-11-04T10:20:00Z'
    }
  }
];

/**
 * Mock Recommendations
 * 
 * NOTE: In production, recommendations are ONLY generated when:
 * - A course completion event is received with `passed: true`
 * - The DetectCompletionUseCase validates `passed === true` before generating suggestions
 * 
 * This mock data is for testing purposes only and doesn't follow the business logic.
 * The corresponding skills gap has `exam_status: 'fail'`, but recommendations should
 * only exist for passed courses. In real usage, this recommendation would not exist.
 * 
 * To test the actual flow: POST to /api/v1/completions with `passed: true`
 */
export const mockRecommendations = [
  {
    recommendation_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    user_id: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    base_course_name: 'JavaScript ES6+ Syntax',
    suggested_courses: [
      {
        competencyTargetName: 'Advanced JavaScript Patterns',
        title: 'Advanced JavaScript Patterns',
        description: 'Design patterns and best practices',
        estimatedDuration: 12,
        difficulty: 'intermediate',
        relevanceScore: 0.85
      },
      {
        competencyTargetName: 'Node.js Backend Development',
        title: 'Node.js Backend Development',
        description: 'Server-side JavaScript development',
        estimatedDuration: 15,
        difficulty: 'intermediate',
        relevanceScore: 0.78
      }
    ],
    sent_to_rag: false
  }
];

export const mockJobs = [
  {
    id: 'b1c2d3e4-f5a6-7890-1234-567890abcdef',
    user_id: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    competency_target_name: 'JavaScript ES6+ Syntax',
    type: 'path-generation',
    status: 'completed',
    progress: 100,
    current_stage: 'completed',
    result: {
      learningPathId: 'JavaScript ES6+ Syntax',
      generatedAt: '2025-11-04T10:00:00Z',
      stepsCount: 3,
      totalDuration: 9
    },
    error: null
  },
  {
    id: 'c2d3e4f5-a6b7-8901-2345-678901bcdef0',
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    competency_target_name: null,
    type: 'path-generation',
    status: 'processing',
    progress: 60,
    current_stage: 'prompt-3-execution',
    result: null,
    error: null
  }
];

/**
 * Get all mock data organized by table
 */
export const getAllMockData = () => ({
  companies: mockCompanies,
  learners: mockLearners,
  skillsGaps: mockSkillsGaps,
  courses: mockCourses,
  skillsExpansions: mockSkillsExpansions,
  recommendations: mockRecommendations,
  jobs: mockJobs
});

