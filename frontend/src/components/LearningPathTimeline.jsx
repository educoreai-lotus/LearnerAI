import Card from './Card';

/**
 * LearningPathTimeline Component
 * Displays learning path as a vertical timeline
 */
export default function LearningPathTimeline({ path, className = '' }) {
  if (!path || !path.modules || path.modules.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No learning path available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-cyan opacity-30"></div>

      {/* Modules */}
      <div className="space-y-6">
        {path.modules.map((module, index) => (
          <div key={index} className="relative pl-20">
            {/* Timeline Dot */}
            <div className="absolute left-6 w-4 h-4 rounded-full bg-gradient-primary border-4 border-bg-primary z-10"></div>

            {/* Module Card */}
            <Card className="ml-4">
              <div className="flex items-start space-x-4">
                {/* Module Number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                  {module.module_order || index + 1}
                </div>

                {/* Module Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {module.module_title || `Module ${index + 1}`}
                  </h3>
                  
                  {module.estimated_duration_hours && (
                    <p className="text-sm text-text-secondary mb-2">
                      Duration: {module.estimated_duration_hours} hours
                    </p>
                  )}

                  {module.learning_goals && module.learning_goals.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-text-primary mb-1">Learning Goals:</h4>
                      <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                        {module.learning_goals.map((goal, i) => (
                          <li key={i}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {module.suggested_content_sequence && module.suggested_content_sequence.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-text-primary mb-2">Content Sequence:</h4>
                      <div className="space-y-2">
                        {module.suggested_content_sequence.map((content, i) => (
                          <div
                            key={i}
                            className="text-sm text-text-secondary bg-bg-secondary rounded px-3 py-2"
                          >
                            {content}
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

