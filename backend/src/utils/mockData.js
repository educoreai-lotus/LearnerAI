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
    user_name: 'Sara Neer',
    decision_maker_policy: 'manual',
    decision_maker_id: 'd3e4f5a6-7890-1234-5678-901234567890'
  },
  {
    user_id: 'd4e5f6a7-b8c9-0123-4567-890123456789',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Sarah Chen',
    decision_maker_policy: 'auto',
    decision_maker_id: null
  },
  {
    user_id: 'e5f6a7b8-c9d0-1234-5678-901234567890',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Michael Rodriguez',
    decision_maker_policy: 'auto',
    decision_maker_id: null
  },
  {
    user_id: 'f6a7b8c9-d0e1-2345-6789-012345678901',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Emily Watson',
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
    user_name: 'Sara Neer',
    skills_raw_data: {
      "Competency_React_Hooks": [
        "MGS_useState_Hook",
        "MGS_useEffect_Hook",
        "MGS_Custom_Hooks"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'React Hooks'
  },
  {
    gap_id: 'f9a0b1c2-d3e4-5678-9012-345678901234',
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Sara Neer',
    skills_raw_data: {
      "Competency_TypeScript": [
        "MGS_Type_Annotations",
        "MGS_Interfaces",
        "MGS_Generics",
        "MGS_Type_Guards"
      ],
      "Competency_TypeScript_Advanced": [
        "MGS_Utility_Types",
        "MGS_Decorators"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'TypeScript Fundamentals'
  },
  {
    gap_id: 'a0b1c2d3-e4f5-6789-0123-456789012345',
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Sara Neer',
    skills_raw_data: {
      "Competency_Node_js": [
        "MGS_Express_Framework",
        "MGS_REST_API_Design",
        "MGS_Middleware_Concepts",
        "MGS_Error_Handling"
      ],
      "Competency_Database_Integration": [
        "MGS_ORM_Usage",
        "MGS_Query_Optimization"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'Node.js Backend Development'
  },
  {
    gap_id: 'a9b0c1d2-e3f4-5678-9012-345678901234',
    user_id: 'd4e5f6a7-b8c9-0123-4567-890123456789',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Sarah Chen',
    skills_raw_data: {
      "Competency_Python_Basics": [
        "MGS_Variables_Types",
        "MGS_Control_Flow",
        "MGS_Functions"
      ],
      "Competency_Data_Structures": [
        "MGS_Lists_Tuples",
        "MGS_Dictionaries"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'Python Basics'
  },
  {
    gap_id: 'b0c1d2e3-f4a5-6789-0123-456789012345',
    user_id: 'e5f6a7b8-c9d0-1234-5678-901234567890',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Michael Rodriguez',
    skills_raw_data: {
      "Competency_Node_js": [
        "MGS_Express_Framework",
        "MGS_REST_API_Design",
        "MGS_Middleware_Concepts"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'Node.js Backend'
  },
  {
    gap_id: 'c1d2e3f4-a5b6-7890-1234-567890123456',
    user_id: 'f6a7b8c9-d0e1-2345-6789-012345678901',
    company_id: 'c1d2e3f4-5678-9012-3456-789012345678',
    company_name: 'TechCorp Inc.',
    user_name: 'Emily Watson',
    skills_raw_data: {
      "Competency_TypeScript": [
        "MGS_Type_Annotations",
        "MGS_Interfaces",
        "MGS_Generics"
      ]
    },
    exam_status: 'fail',
    competency_target_name: 'TypeScript Fundamentals'
  }
];

export const mockCourses = [
  {
    competency_target_name: 'JavaScript ES6+ Syntax',
    user_id: 'a1b2c3d4-e5f6-4789-a012-345678901234',
    learning_path: {
      steps: [
        {
          step: 1,
          title: 'Introduction to ES6+ Syntax',
          duration: '1 week',
          resources: [
            'MDN: ES6 Features Overview',
            'JavaScript.info: Modern JavaScript Tutorial',
            'Video: ES6 Features Explained by freeCodeCamp',
            'Interactive: ES6 Syntax Practice on CodePen'
          ],
          objectives: [
            'Understand the evolution from ES5 to ES6+',
            'Learn let, const, and block scoping',
            'Master template literals and string interpolation',
            'Understand arrow functions and their use cases'
          ],
          estimatedTime: '6 hours',
          stepId: 'step-001',
          description: 'Learn modern JavaScript syntax and ES6+ features',
          skills: ['micro-001', 'micro-002']
        },
        {
          step: 2,
          title: 'Advanced ES6 Features',
          duration: '1.5 weeks',
          resources: [
            'MDN: Destructuring Assignment',
            'MDN: Spread Syntax',
            'MDN: Rest Parameters',
            'Video: Advanced ES6 Patterns',
            'Article: ES6 Destructuring Deep Dive'
          ],
          objectives: [
            'Master destructuring for arrays and objects',
            'Use spread and rest operators effectively',
            'Understand default parameters',
            'Apply ES6 features in real-world scenarios'
          ],
          estimatedTime: '8 hours',
          stepId: 'step-002',
          description: 'Master advanced ES6 features and patterns',
          skills: ['micro-003', 'micro-004']
        },
        {
          step: 3,
          title: 'Async Programming with Promises and Async/Await',
          duration: '2 weeks',
          resources: [
            'MDN: Promises',
            'MDN: async function',
            'JavaScript.info: Promises, async/await',
            'Video: Async JavaScript Explained',
            'Practice: Building Promise-based APIs'
          ],
          objectives: [
            'Understand callback functions and callback hell',
            'Create and handle promises',
            'Master async/await syntax',
            'Handle errors in asynchronous code',
            'Chain promises and async operations effectively'
          ],
          estimatedTime: '12 hours',
          stepId: 'step-003',
          description: 'Understanding async/await and promise-based programming',
          skills: ['micro-005', 'micro-006', 'micro-007']
        }
      ],
      estimatedCompletion: '4-5 weeks',
      totalSteps: 3,
      createdAt: '2025-11-04T10:00:00Z',
      updatedAt: '2025-11-04T10:00:00Z',
      // Backward compatibility fields
      pathTitle: 'JavaScript Modern Development Path',
      totalDurationHours: 26,
      pathSteps: [
        {
          stepId: 'step-001',
          title: 'Introduction to ES6+ Syntax',
          description: 'Learn modern JavaScript syntax and ES6+ features',
          duration: 6,
          order: 1,
          skills: ['micro-001', 'micro-002']
        },
        {
          stepId: 'step-002',
          title: 'Advanced ES6 Features',
          description: 'Master advanced ES6 features and patterns',
          duration: 8,
          order: 2,
          skills: ['micro-003', 'micro-004']
        },
        {
          stepId: 'step-003',
          title: 'Async Programming with Promises and Async/Await',
          description: 'Understanding async/await and promise-based programming',
          duration: 12,
          order: 3,
          skills: ['micro-005', 'micro-006', 'micro-007']
        }
      ],
      learningModules: [
        { moduleId: 'module-001', name: 'ES6 Fundamentals', duration: 6, module_title: 'ES6 Fundamentals' },
        { moduleId: 'module-002', name: 'Advanced ES6', duration: 8, module_title: 'Advanced ES6' },
        { moduleId: 'module-003', name: 'Async Patterns', duration: 12, module_title: 'Async Patterns' }
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
      steps: [
        {
          step: 1,
          title: 'React Hooks Basics',
          duration: '1 week',
          resources: [
            'React Docs: Introducing Hooks',
            'React Docs: useState Hook',
            'Video: React Hooks Tutorial by Traversy Media',
            'Interactive: React Hooks Practice on CodeSandbox',
            'Article: Understanding React Hooks'
          ],
          objectives: [
            'Understand why React Hooks were introduced',
            'Master useState hook for state management',
            'Learn useEffect hook for side effects',
            'Understand the Rules of Hooks',
            'Build functional components with hooks'
          ],
          estimatedTime: '6 hours',
          stepId: 'step-004',
          description: 'Introduction to React Hooks and fundamental hooks',
          skills: ['micro-008']
        },
        {
          step: 2,
          title: 'Advanced Hooks and Custom Hooks',
          duration: '1.5 weeks',
          resources: [
            'React Docs: useCallback and useMemo',
            'React Docs: useContext Hook',
            'React Docs: Building Your Own Hooks',
            'Video: Advanced React Hooks Patterns',
            'Article: Custom Hooks Best Practices'
          ],
          objectives: [
            'Master useCallback and useMemo for performance',
            'Use useContext for global state management',
            'Create custom hooks for reusable logic',
            'Understand hook dependencies and optimization',
            'Apply hooks in complex real-world scenarios'
          ],
          estimatedTime: '8 hours',
          stepId: 'step-005',
          description: 'useEffect, custom hooks, and advanced patterns',
          skills: ['micro-009', 'micro-010']
        }
      ],
      estimatedCompletion: '2-3 weeks',
      totalSteps: 2,
      createdAt: '2025-11-05T14:30:00Z',
      updatedAt: '2025-11-05T14:30:00Z',
      // Backward compatibility fields
      pathTitle: 'React Hooks Mastery',
      totalDurationHours: 14,
      pathSteps: [
        {
          stepId: 'step-004',
          title: 'React Hooks Basics',
          description: 'Introduction to React Hooks and fundamental hooks',
          duration: 6,
          order: 1,
          skills: ['micro-008']
        },
        {
          stepId: 'step-005',
          title: 'Advanced Hooks and Custom Hooks',
          description: 'useEffect, custom hooks, and advanced patterns',
          duration: 8,
          order: 2,
          skills: ['micro-009', 'micro-010']
        }
      ],
      learningModules: [
        { moduleId: 'module-003', name: 'Hooks Fundamentals', duration: 6, module_title: 'Hooks Fundamentals' },
        { moduleId: 'module-004', name: 'Advanced Patterns', duration: 8, module_title: 'Advanced Patterns' }
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
  },
  {
    competency_target_name: 'TypeScript Fundamentals',
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    learning_path: {
      steps: [
        {
          step: 1,
          title: 'TypeScript Basics: Type Annotations and Interfaces',
          duration: '1 week',
          resources: [
            'TypeScript Handbook: Basic Types',
            'TypeScript Handbook: Interfaces',
            'Video: TypeScript Basics Tutorial',
            'Interactive: TypeScript Playground',
            'Article: TypeScript for JavaScript Developers'
          ],
          objectives: [
            'Understand TypeScript and its benefits',
            'Master basic type annotations',
            'Create and use interfaces',
            'Understand type inference',
            'Set up TypeScript in a project'
          ],
          estimatedTime: '6 hours',
          stepId: 'step-012',
          description: 'Type annotations and interfaces',
          skills: ['micro-018', 'micro-019']
        },
        {
          step: 2,
          title: 'Advanced TypeScript: Generics and Utility Types',
          duration: '1.5 weeks',
          resources: [
            'TypeScript Handbook: Generics',
            'TypeScript Handbook: Utility Types',
            'Video: Advanced TypeScript Patterns',
            'Article: TypeScript Generics Explained',
            'Practice: Building Generic Components'
          ],
          objectives: [
            'Master generic types and constraints',
            'Use utility types effectively',
            'Understand conditional types',
            'Apply mapped types in real scenarios',
            'Build type-safe reusable code'
          ],
          estimatedTime: '8 hours',
          stepId: 'step-013',
          description: 'Generics and utility types',
          skills: ['micro-020', 'micro-021']
        },
        {
          step: 3,
          title: 'TypeScript with React',
          duration: '1 week',
          resources: [
            'React TypeScript Cheatsheet',
            'TypeScript React Documentation',
            'Video: TypeScript + React Tutorial',
            'Article: Typing React Components',
            'Practice: Building Typed React Apps'
          ],
          objectives: [
            'Type React components and props',
            'Use TypeScript with React Hooks',
            'Type event handlers and forms',
            'Create typed custom hooks',
            'Handle complex React patterns with TypeScript'
          ],
          estimatedTime: '6 hours',
          stepId: 'step-014',
          description: 'Using TypeScript in React projects',
          skills: ['micro-022']
        }
      ],
      estimatedCompletion: '3-4 weeks',
      totalSteps: 3,
      createdAt: '2025-11-06T10:00:00Z',
      updatedAt: '2025-11-06T10:00:00Z',
      // Backward compatibility fields
      pathTitle: 'TypeScript Fundamentals',
      totalDurationHours: 20,
      pathSteps: [
        {
          stepId: 'step-012',
          title: 'TypeScript Basics: Type Annotations and Interfaces',
          description: 'Type annotations and interfaces',
          duration: 6,
          order: 1,
          skills: ['micro-018', 'micro-019']
        },
        {
          stepId: 'step-013',
          title: 'Advanced TypeScript: Generics and Utility Types',
          description: 'Generics and utility types',
          duration: 8,
          order: 2,
          skills: ['micro-020', 'micro-021']
        },
        {
          stepId: 'step-014',
          title: 'TypeScript with React',
          description: 'Using TypeScript in React projects',
          duration: 6,
          order: 3,
          skills: ['micro-022']
        }
      ],
      learningModules: [
        { moduleId: 'module-011', name: 'TypeScript Basics', duration: 6, module_title: 'TypeScript Basics' },
        { moduleId: 'module-012', name: 'Advanced Types', duration: 8, module_title: 'Advanced Types' },
        { moduleId: 'module-013', name: 'React Integration', duration: 6, module_title: 'React Integration' }
      ],
      metadata: {
        generatedAt: '2025-11-06T10:00:00Z',
        version: '1.0',
        competencies: ['TypeScript', 'TypeScript Advanced']
      },
      companyId: 'c1d2e3f4-5678-9012-3456-789012345678',
      competencyTargetName: 'TypeScript Fundamentals',
      status: 'pending'
    },
    approved: false
  },
  {
    competency_target_name: 'Node.js Backend Development',
    user_id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
    learning_path: {
      steps: [
        {
          step: 1,
          title: 'Express Framework: Building REST APIs',
          duration: '1.5 weeks',
          resources: [
            'Express.js Official Documentation',
            'MDN: REST API Design',
            'Video: Express.js Crash Course',
            'Article: Building RESTful APIs with Express',
            'Practice: Create Your First Express API'
          ],
          objectives: [
            'Set up an Express.js server',
            'Create RESTful API endpoints',
            'Handle HTTP methods (GET, POST, PUT, DELETE)',
            'Implement route parameters and query strings',
            'Structure Express applications properly'
          ],
          estimatedTime: '10 hours',
          stepId: 'step-015',
          description: 'Building REST APIs with Express',
          skills: ['micro-015', 'micro-016']
        },
        {
          step: 2,
          title: 'Middleware & Best Practices',
          duration: '1.5 weeks',
          resources: [
            'Express.js: Using Middleware',
            'Article: Express Middleware Explained',
            'Video: Advanced Express Patterns',
            'Best Practices: Express.js Security',
            'Practice: Building Custom Middleware'
          ],
          objectives: [
            'Understand middleware concepts and execution order',
            'Use built-in Express middleware',
            'Create custom middleware functions',
            'Implement error handling middleware',
            'Apply security best practices'
          ],
          estimatedTime: '8 hours',
          stepId: 'step-016',
          description: 'Advanced Express patterns and middleware',
          skills: ['micro-017', 'micro-023']
        },
        {
          step: 3,
          title: 'Database Integration with ORMs',
          duration: '2 weeks',
          resources: [
            'Sequelize ORM Documentation',
            'Mongoose Documentation (MongoDB)',
            'Video: Database Integration Tutorial',
            'Article: ORM vs Raw SQL',
            'Practice: Building Database-Driven APIs'
          ],
          objectives: [
            'Connect to databases (PostgreSQL, MongoDB)',
            'Use ORMs for database operations',
            'Implement CRUD operations',
            'Handle database relationships',
            'Optimize database queries'
          ],
          estimatedTime: '10 hours',
          stepId: 'step-017',
          description: 'Connecting to databases and ORM usage',
          skills: ['micro-024', 'micro-025']
        }
      ],
      estimatedCompletion: '5-6 weeks',
      totalSteps: 3,
      createdAt: '2025-11-06T14:00:00Z',
      updatedAt: '2025-11-06T14:00:00Z',
      // Backward compatibility fields
      pathTitle: 'Node.js Backend Development',
      totalDurationHours: 28,
      pathSteps: [
        {
          stepId: 'step-015',
          title: 'Express Framework: Building REST APIs',
          description: 'Building REST APIs with Express',
          duration: 10,
          order: 1,
          skills: ['micro-015', 'micro-016']
        },
        {
          stepId: 'step-016',
          title: 'Middleware & Best Practices',
          description: 'Advanced Express patterns and middleware',
          duration: 8,
          order: 2,
          skills: ['micro-017', 'micro-023']
        },
        {
          stepId: 'step-017',
          title: 'Database Integration with ORMs',
          description: 'Connecting to databases and ORM usage',
          duration: 10,
          order: 3,
          skills: ['micro-024', 'micro-025']
        }
      ],
      learningModules: [
        { moduleId: 'module-014', name: 'Express Framework', duration: 10, module_title: 'Express Framework' },
        { moduleId: 'module-015', name: 'Advanced Patterns', duration: 8, module_title: 'Advanced Patterns' },
        { moduleId: 'module-016', name: 'Database Integration', duration: 10, module_title: 'Database Integration' }
      ],
      metadata: {
        generatedAt: '2025-11-06T14:00:00Z',
        version: '1.0',
        competencies: ['Node.js', 'Database Integration']
      },
      companyId: 'c1d2e3f4-5678-9012-3456-789012345678',
      competencyTargetName: 'Node.js Backend Development',
      status: 'pending'
    },
    approved: false
  },
  {
    competency_target_name: 'Python Basics',
    user_id: 'd4e5f6a7-b8c9-0123-4567-890123456789',
    learning_path: {
      steps: [
        {
          step: 1,
          title: 'Python Fundamentals',
          duration: '1.5 weeks',
          resources: [
            'Python.org Official Tutorial',
            'Real Python: Python Basics',
            'Video: Python for Beginners by freeCodeCamp',
            'Interactive: Python Practice on Repl.it',
            'Article: Python Syntax and Best Practices'
          ],
          objectives: [
            'Set up Python development environment',
            'Understand Python syntax and indentation',
            'Work with variables and data types',
            'Use basic operators and expressions',
            'Write your first Python programs'
          ],
          estimatedTime: '8 hours',
          stepId: 'step-006',
          description: 'Learn Python basics and fundamentals',
          skills: ['micro-011', 'micro-012']
        },
        {
          step: 2,
          title: 'Python Data Structures',
          duration: '1.5 weeks',
          resources: [
            'Python Docs: Data Structures',
            'Real Python: Lists and Tuples',
            'Real Python: Dictionaries',
            'Video: Python Data Structures Explained',
            'Practice: Working with Data Structures'
          ],
          objectives: [
            'Master lists, tuples, and dictionaries',
            'Understand when to use each data structure',
            'Perform common operations on data structures',
            'Use list comprehensions',
            'Work with nested data structures'
          ],
          estimatedTime: '10 hours',
          stepId: 'step-007',
          description: 'Lists, tuples, and dictionaries',
          skills: ['micro-013', 'micro-014']
        }
      ],
      estimatedCompletion: '3-4 weeks',
      totalSteps: 2,
      createdAt: '2025-11-06T09:00:00Z',
      updatedAt: '2025-11-06T09:00:00Z',
      // Backward compatibility fields
      pathTitle: 'Python Basics Course',
      totalDurationHours: 18,
      pathSteps: [
        {
          stepId: 'step-006',
          title: 'Python Fundamentals',
          description: 'Learn Python basics and fundamentals',
          duration: 8,
          order: 1,
          skills: ['micro-011', 'micro-012']
        },
        {
          stepId: 'step-007',
          title: 'Python Data Structures',
          description: 'Lists, tuples, and dictionaries',
          duration: 10,
          order: 2,
          skills: ['micro-013', 'micro-014']
        }
      ],
      learningModules: [
        { moduleId: 'module-005', name: 'Python Fundamentals', duration: 8, module_title: 'Python Fundamentals' },
        { moduleId: 'module-006', name: 'Data Structures', duration: 10, module_title: 'Data Structures' }
      ],
      metadata: {
        generatedAt: '2025-11-06T09:00:00Z',
        version: '1.0',
        competencies: ['Python Basics', 'Data Structures']
      },
      companyId: 'c1d2e3f4-5678-9012-3456-789012345678',
      competencyTargetName: 'Python Basics',
      status: 'pending'
    },
    approved: false
  },
  {
    competency_target_name: 'Node.js Backend',
    user_id: 'e5f6a7b8-c9d0-1234-5678-901234567890',
    learning_path: {
      steps: [
        {
          step: 1,
          title: 'Express Framework: Building REST APIs',
          duration: '1.5 weeks',
          resources: [
            'Express.js Official Documentation',
            'MDN: REST API Design',
            'Video: Express.js Crash Course',
            'Article: Building RESTful APIs with Express',
            'Practice: Create Your First Express API'
          ],
          objectives: [
            'Set up an Express.js server',
            'Create RESTful API endpoints',
            'Handle HTTP methods (GET, POST, PUT, DELETE)',
            'Implement route parameters and query strings',
            'Structure Express applications properly'
          ],
          estimatedTime: '10 hours',
          stepId: 'step-008',
          description: 'Building REST APIs with Express',
          skills: ['micro-015', 'micro-016']
        },
        {
          step: 2,
          title: 'Middleware & Best Practices',
          duration: '1.5 weeks',
          resources: [
            'Express.js: Using Middleware',
            'Article: Express Middleware Explained',
            'Video: Advanced Express Patterns',
            'Best Practices: Express.js Security',
            'Practice: Building Custom Middleware'
          ],
          objectives: [
            'Understand middleware concepts and execution order',
            'Use built-in Express middleware',
            'Create custom middleware functions',
            'Implement error handling middleware',
            'Apply security best practices'
          ],
          estimatedTime: '8 hours',
          stepId: 'step-009',
          description: 'Advanced Express patterns and middleware',
          skills: ['micro-017']
        }
      ],
      estimatedCompletion: '3-4 weeks',
      totalSteps: 2,
      createdAt: '2025-11-06T11:30:00Z',
      updatedAt: '2025-11-06T11:30:00Z',
      // Backward compatibility fields
      pathTitle: 'Node.js Backend Development',
      totalDurationHours: 18,
      pathSteps: [
        {
          stepId: 'step-008',
          title: 'Express Framework: Building REST APIs',
          description: 'Building REST APIs with Express',
          duration: 10,
          order: 1,
          skills: ['micro-015', 'micro-016']
        },
        {
          stepId: 'step-009',
          title: 'Middleware & Best Practices',
          description: 'Advanced Express patterns and middleware',
          duration: 8,
          order: 2,
          skills: ['micro-017']
        }
      ],
      learningModules: [
        { moduleId: 'module-007', name: 'Express Framework', duration: 10, module_title: 'Express Framework' },
        { moduleId: 'module-008', name: 'Advanced Patterns', duration: 8, module_title: 'Advanced Patterns' }
      ],
      metadata: {
        generatedAt: '2025-11-06T11:30:00Z',
        version: '1.0',
        competencies: ['Node.js', 'REST API Design']
      },
      companyId: 'c1d2e3f4-5678-9012-3456-789012345678',
      competencyTargetName: 'Node.js Backend',
      status: 'pending'
    },
    approved: false
  },
  {
    competency_target_name: 'TypeScript Fundamentals',
    user_id: 'f6a7b8c9-d0e1-2345-6789-012345678901',
    learning_path: {
      steps: [
        {
          step: 1,
          title: 'TypeScript Basics: Type Annotations and Interfaces',
          duration: '1 week',
          resources: [
            'TypeScript Handbook: Basic Types',
            'TypeScript Handbook: Interfaces',
            'Video: TypeScript Basics Tutorial',
            'Interactive: TypeScript Playground',
            'Article: TypeScript for JavaScript Developers'
          ],
          objectives: [
            'Understand TypeScript and its benefits',
            'Master basic type annotations',
            'Create and use interfaces',
            'Understand type inference',
            'Set up TypeScript in a project'
          ],
          estimatedTime: '6 hours',
          stepId: 'step-010',
          description: 'Type annotations and interfaces',
          skills: ['micro-018', 'micro-019']
        },
        {
          step: 2,
          title: 'Advanced TypeScript: Generics and Utility Types',
          duration: '1.5 weeks',
          resources: [
            'TypeScript Handbook: Generics',
            'TypeScript Handbook: Utility Types',
            'Video: Advanced TypeScript Patterns',
            'Article: TypeScript Generics Explained',
            'Practice: Building Generic Components'
          ],
          objectives: [
            'Master generic types and constraints',
            'Use utility types effectively',
            'Understand conditional types',
            'Apply mapped types in real scenarios',
            'Build type-safe reusable code'
          ],
          estimatedTime: '8 hours',
          stepId: 'step-011',
          description: 'Generics and utility types',
          skills: ['micro-020']
        }
      ],
      estimatedCompletion: '2-3 weeks',
      totalSteps: 2,
      createdAt: '2025-11-06T12:00:00Z',
      updatedAt: '2025-11-06T12:00:00Z',
      // Backward compatibility fields
      pathTitle: 'TypeScript Fundamentals',
      totalDurationHours: 14,
      pathSteps: [
        {
          stepId: 'step-010',
          title: 'TypeScript Basics: Type Annotations and Interfaces',
          description: 'Type annotations and interfaces',
          duration: 6,
          order: 1,
          skills: ['micro-018', 'micro-019']
        },
        {
          stepId: 'step-011',
          title: 'Advanced TypeScript: Generics and Utility Types',
          description: 'Generics and utility types',
          duration: 8,
          order: 2,
          skills: ['micro-020']
        }
      ],
      learningModules: [
        { moduleId: 'module-009', name: 'TypeScript Basics', duration: 6, module_title: 'TypeScript Basics' },
        { moduleId: 'module-010', name: 'Advanced Types', duration: 8, module_title: 'Advanced Types' }
      ],
      metadata: {
        generatedAt: '2025-11-06T12:00:00Z',
        version: '1.0',
        competencies: ['TypeScript']
      },
      companyId: 'c1d2e3f4-5678-9012-3456-789012345678',
      competencyTargetName: 'TypeScript Fundamentals',
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

