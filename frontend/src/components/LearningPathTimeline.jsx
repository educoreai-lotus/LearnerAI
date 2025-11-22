import Card from './Card';

/**
 * LearningPathTimeline Component
 * Displays learning path as a vertical timeline
 */
export default function LearningPathTimeline({ path, className = '' }) {
  // If no modules, try to show pathSteps as a fallback
  const modules = path?.modules || [];
  const pathSteps = path?.pathSteps || [];
  
  if (!path) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-500">
        No learning path available
      </div>
    );
  }
  
  // If we have modules, show them. Otherwise, show pathSteps as modules
  const displayModules = modules.length > 0 
    ? modules 
    : pathSteps.map((step, index) => ({
        name: step.title || `Step ${step.order || index + 1}`,
        module_title: step.title || `Step ${step.order || index + 1}`,
        duration: step.duration,
        estimated_duration_hours: step.duration,
        description: step.description,
        order: step.order || index + 1,
        stepId: step.stepId || step.step_id
      }));
  
  if (displayModules.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-500">
        No learning path content available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-400 dark:bg-primary-500 opacity-30"></div>

      {/* Modules */}
      <div className="space-y-6">
        {displayModules.map((module, index) => (
          <div key={index} className="relative pl-20">
            {/* Timeline Dot */}
            <div className="absolute left-6 w-4 h-4 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 dark:from-teal-600 dark:to-emerald-600 border-4 border-white dark:border-slate-900 z-10"></div>

            {/* Module Card */}
            <Card className="ml-4">
              <div className="flex items-start space-x-4">
                {/* Module Number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 dark:from-teal-600 dark:to-emerald-600 flex items-center justify-center text-white font-bold">
                  {module.module_order || index + 1}
                </div>

                {/* Module Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                      {module.module_title || module.name || `Module ${index + 1}`}
                    </h3>
                    {(module.estimated_duration_hours || module.duration) && (
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
                        {module.estimated_duration_hours || module.duration} hours
                      </span>
                    )}
                  </div>

                  {module.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {module.description}
                    </p>
                  )}

                  {module.learning_goals && module.learning_goals.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">Learning Goals:</h4>
                      <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                        {module.learning_goals.map((goal, i) => (
                          <li key={i}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Show steps within this module if available */}
                  {module.steps && module.steps.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
                        Steps in this module ({module.steps.length})
                      </h4>
                      <div className="space-y-4">
                        {module.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="bg-neutral-50 dark:bg-slate-800/50 rounded-lg p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow duration-fast">
                            {/* Step Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                                    Step {step.step || step.order || stepIndex + 1}
                                  </span>
                                  <h5 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                                    {step.title || `Step ${step.step || step.order || stepIndex + 1}`}
                                  </h5>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                                  {step.duration && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {step.duration}
                                    </span>
                                  )}
                                  {step.estimatedTime && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                      {step.estimatedTime}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Step Description */}
                            {step.description && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                                {step.description}
                              </p>
                            )}

                            {/* Learning Objectives */}
                            {step.objectives && step.objectives.length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-primary-700 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Learning Objectives
                                </h6>
                                <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 ml-2">
                                  {step.objectives.map((objective, objIndex) => (
                                    <li key={objIndex} className="leading-relaxed">{objective}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Resources */}
                            {step.resources && step.resources.length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-2 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-primary-700 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  Learning Resources
                                </h6>
                                <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 ml-2">
                                  {step.resources.map((resource, resIndex) => (
                                    <li key={resIndex} className="leading-relaxed">{resource}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {module.suggested_content_sequence && module.suggested_content_sequence.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">Content Sequence:</h4>
                      <div className="space-y-2">
                        {module.suggested_content_sequence.map((content, i) => (
                          <div
                            key={i}
                            className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-slate-700 rounded px-3 py-2"
                          >
                            {content}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show subtopics if available (from database learning_modules structure) */}
                  {module.subtopics && module.subtopics.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                        Subtopics ({module.subtopics.length})
                      </h4>
                      <div className="space-y-3">
                        {module.subtopics.map((subtopic, subIndex) => (
                          <div key={subIndex} className="bg-neutral-50 dark:bg-slate-800/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                            <h5 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                              {subtopic.title || `Subtopic ${subIndex + 1}`}
                            </h5>
                            {subtopic.description && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {subtopic.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

