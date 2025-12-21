import Card from './Card';

/**
 * LearningPathTimeline Component
 * Displays learning path as a beautiful vertical timeline with modules and steps
 * Supports the new Prompt 3 structure: learning_modules with steps and skills
 */
export default function LearningPathTimeline({ path, className = '' }) {
  if (!path) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg">No learning path available</p>
      </div>
    );
  }

  // Extract modules from the new structure
  const pathData = path.pathData || path.learning_path || path;
  const modules = pathData.learning_modules || path.modules || [];
  const totalDuration = pathData.total_estimated_duration_hours || path.totalDurationHours || 0;

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg">No learning modules available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header with total duration - Title removed (shown in parent Card) */}
      {totalDuration > 0 && (
        <div className="mb-8 flex items-center justify-between">
          <div style={{ marginLeft: '75px' }}>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {modules.length} {modules.length === 1 ? 'Module' : 'Modules'} • {totalDuration} hours total
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg border border-primary-200 dark:border-primary-700">
            <svg className="w-5 h-5 text-primary-700 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold text-primary-700 dark:text-primary-400">
              {totalDuration}h
            </span>
          </div>
        </div>
      )}

      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 via-primary-500 to-primary-400 dark:from-primary-600 dark:via-primary-500 dark:to-primary-600 opacity-20 rounded-full"></div>

      {/* Modules */}
      <div className="space-y-8">
        {modules.map((module, moduleIndex) => {
          const moduleOrder = module.module_order || moduleIndex + 1;
          const moduleTitle = module.module_title || module.name || `Module ${moduleOrder}`;
          const moduleDuration = module.estimated_duration_hours || module.duration || 0;
          const skillsInModule = module.skills_in_module || [];
          const steps = module.steps || [];

          return (
            <div key={moduleIndex} className="relative pl-20">
              {/* Timeline Dot */}
              <div className="absolute left-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 border-4 border-white dark:border-slate-900 shadow-lg z-10 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{moduleOrder}</span>
              </div>

              {/* Module Card */}
              <Card className="ml-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary-500 dark:border-l-primary-400">
                <div className="p-6">
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full uppercase tracking-wide">
                          Module {moduleOrder}
                        </span>
                        {moduleDuration > 0 && (
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {moduleDuration}h
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                        {moduleTitle}
                      </h3>
                      {module.module_description && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                          {module.module_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Module-level Skills */}
                  {skillsInModule && skillsInModule.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Module Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {skillsInModule.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
                          >
                            {typeof skill === 'string' ? skill : skill.name || skill.title || JSON.stringify(skill)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {steps.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                      <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Learning Steps ({steps.length})
                      </h4>
                      <div className="space-y-4">
                        {steps.map((step, stepIndex) => {
                          const stepNumber = step.step || step.order || stepIndex + 1;
                          const stepTitle = step.title || `Step ${stepNumber}`;
                          const stepDescription = step.description || '';
                          const stepDuration = step.estimatedTime || step.duration || 0;
                          const skillsCovered = step.skills_covered || step.skillsCovered || [];

                          return (
                            <div
                              key={stepIndex}
                              className="relative bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600"
                            >
                              {/* Step Number Badge */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {stepNumber}
                                  </div>
                                  <h5 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                                    {stepTitle}
                                  </h5>
                                </div>
                                {stepDuration > 0 && (
                                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1 bg-white dark:bg-slate-700 px-2 py-1 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {stepDuration}h
                                  </span>
                                )}
                              </div>

                              {/* Step Description */}
                              {stepDescription && (
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed pl-11">
                                  {stepDescription}
                                </p>
                              )}

                              {/* Skills Covered */}
                              {skillsCovered && skillsCovered.length > 0 && (
                                <div className="pl-11 mt-4">
                                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center gap-1">
                                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Skills Covered:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {skillsCovered.map((skill, skillIndex) => (
                                      <span
                                        key={skillIndex}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
                                      >
                                        {typeof skill === 'string' ? skill : skill.name || skill.title || JSON.stringify(skill)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
