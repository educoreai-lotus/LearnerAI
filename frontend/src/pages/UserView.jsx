import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import LearningPathTimeline from '../components/LearningPathTimeline';
import api from '../services/api';

/**
 * User View Page
 * Displays learner's courses and learning paths
 */
export default function UserView() {
  // Using Sara Neer's user ID from mock data: b2c3d4e5-f6a7-8901-2345-678901234567
  // Sara has 3 learning paths: React Hooks, TypeScript Fundamentals, Node.js Backend Development
  const [userId] = useState('b2c3d4e5-f6a7-8901-2345-678901234567'); // Sara Neer from mock data
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await api.getCoursesByUser(userId);
      const coursesData = response.courses || [];
      
      // Extract unique courses with better names
      const courseMap = new Map();
      coursesData.forEach(course => {
        const competencyName = course.competency_target_name || course.competencyTargetName;
        if (competencyName) {
          const pathData = course.learning_path || course.pathData || {};
          const pathTitle = pathData.pathTitle || pathData.path_title || course.pathTitle || competencyName;
          if (!courseMap.has(competencyName)) {
            courseMap.set(competencyName, {
              id: competencyName,
              name: pathTitle,
              courseData: course
            });
          }
        }
      });
      
      setCourses(Array.from(courseMap.values()));
      
      if (coursesData.length > 0 && !selectedCourse) {
        const firstCourse = coursesData[0].competency_target_name || coursesData[0].competencyTargetName;
        if (firstCourse) {
          setSelectedCourse(firstCourse);
          loadLearningPath(firstCourse, coursesData);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLearningPath = async (competencyTargetName, existingCourses = null) => {
    try {
      setPathLoading(true);
      let courses = existingCourses;
      
      if (!courses) {
        const response = await api.getCoursesByUser(userId);
        courses = response.courses || [];
      }
      
      // Find course by competencyTargetName
      const course = courses.find(c => {
        const cId = c.competency_target_name || c.competencyTargetName;
        return cId === competencyTargetName;
      });
      
      console.log('Found course for competency:', competencyTargetName, course); // Debug log
      
      if (course) {
        // Handle course format from CourseRepository
        // learning_path is a JSONB field, might be a string or object
        let pathData = course.learning_path || course.pathData || {};
        
        // If learning_path is a string, parse it
        if (typeof pathData === 'string') {
          try {
            pathData = JSON.parse(pathData);
          } catch (e) {
            console.error('Failed to parse learning_path JSON:', e);
            pathData = {};
          }
        }
        
        // Extract steps from the new structure (prioritize 'steps' array)
        const steps = pathData.steps || pathData.pathSteps || [];
        let modules = pathData.learning_modules || pathData.learningModules || [];
        
        // If we have the new 'steps' array structure, use it directly
        // Map steps to modules for display (group steps by module if modules exist)
        if (steps.length > 0) {
          if (modules.length > 0) {
            // Group steps by modules (distribute steps evenly across modules)
            modules = modules.map((module, index) => {
              const stepsPerModule = Math.ceil(steps.length / modules.length);
              const startIndex = index * stepsPerModule;
              const endIndex = Math.min(startIndex + stepsPerModule, steps.length);
              const moduleSteps = steps.slice(startIndex, endIndex);
              
              return {
                ...module,
                module_order: index + 1,
                steps: moduleSteps.map(step => ({
                  ...step,
                  step: step.step || step.order || (startIndex + moduleSteps.indexOf(step) + 1),
                  order: step.order || step.step || (startIndex + moduleSteps.indexOf(step) + 1)
                })),
                module_title: module.module_title || module.name,
                estimated_duration_hours: module.estimated_duration_hours || module.duration
              };
            });
          } else {
            // No modules, create modules from steps (each step becomes a module)
            modules = steps.map((step, index) => ({
              name: step.title || `Step ${step.step || step.order || index + 1}`,
              module_title: step.title || `Step ${step.step || step.order || index + 1}`,
              duration: step.estimatedTime || step.duration,
              estimated_duration_hours: step.estimatedTime || step.duration,
              description: step.description,
              order: step.step || step.order || index + 1,
              module_order: step.step || step.order || index + 1,
              stepId: step.stepId || step.step_id,
              skills: step.skills || [],
              // Include the full step data
              steps: [step]
            }));
          }
        } else if (modules.length > 0) {
          // Only modules, no steps - ensure proper structure
          modules = modules.map((module, index) => ({
            ...module,
            module_order: module.module_order || index + 1,
            module_title: module.module_title || module.name,
            estimated_duration_hours: module.estimated_duration_hours || module.duration
          }));
        }
        
        console.log('Course data:', course); // Debug
        console.log('Path data:', pathData); // Debug
        console.log('Modules:', modules); // Debug
        console.log('Steps:', steps); // Debug
        
        setLearningPath({
          id: course.competency_target_name || course.competencyTargetName || competencyTargetName,
          pathTitle: pathData.pathTitle || pathData.path_title || course.pathTitle || 'Learning Path',
          totalDurationHours: pathData.totalDurationHours || pathData.total_duration_hours || pathData.estimatedCompletion,
          estimatedCompletion: pathData.estimatedCompletion,
          totalSteps: pathData.totalSteps || steps.length,
          pathSteps: steps, // Full steps array
          modules: modules, // Enhanced modules with step information
          pathData: pathData,
          approved: course.approved
        });
      } else {
        console.log('No course found for competency:', competencyTargetName); // Debug
        setLearningPath(null);
      }
    } catch (error) {
      console.error('Failed to load learning path:', error);
      setLearningPath(null);
    } finally {
      setPathLoading(false);
    }
  };

  const handleCourseChange = (competencyTargetName) => {
    setSelectedCourse(competencyTargetName);
    loadLearningPath(competencyTargetName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">My Learning Paths</h1>
            <p className="text-text-secondary">
              {courses.length > 0 
                ? `You have ${courses.length} learning path${courses.length !== 1 ? 's' : ''} available`
                : 'View your personalized learning journey'
              }
            </p>
          </div>

          {/* Course Selection */}
          <Card className="mb-8">
            <div className="flex items-center space-x-4">
              <label htmlFor="course-select" className="text-text-primary font-medium">
                Select Course:
              </label>
              <select
                id="course-select"
                value={selectedCourse || ''}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="flex-1 px-4 py-2 rounded-button bg-bg-secondary border border-emeraldbrand-200 dark:border-emeraldbrand-800 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-cyan"
              >
                <option value="">-- Select a course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <PrimaryButton onClick={() => loadUserData()}>
                Refresh
              </PrimaryButton>
            </div>
          </Card>

          {/* Learning Path Timeline */}
          {selectedCourse && (
            <Card>
              {pathLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : learningPath ? (
                <>
                  <div className="mb-6 pb-4 border-b border-emeraldbrand-200 dark:border-emeraldbrand-800">
                    <h2 className="text-2xl font-bold text-text-primary mb-2">
                      {learningPath.pathTitle || 'Learning Path'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      {learningPath.totalDurationHours && (
                        <span>
                          <strong>Total Duration:</strong> {learningPath.totalDurationHours} hours
                        </span>
                      )}
                      {learningPath.estimatedCompletion && (
                        <span>
                          <strong>Estimated Completion:</strong> {learningPath.estimatedCompletion}
                        </span>
                      )}
                      {learningPath.totalSteps && (
                        <span>
                          <strong>Total Steps:</strong> {learningPath.totalSteps}
                        </span>
                      )}
                      {learningPath.approved !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          learningPath.approved 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {learningPath.approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      )}
                    </div>
                  </div>
                  <LearningPathTimeline path={learningPath} />
                </>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <p>No learning path available for this course.</p>
                  <PrimaryButton
                    variant="primary"
                    className="mt-4"
                    onClick={() => {
                      // TODO: Trigger path generation
                      alert('Path generation feature coming soon!');
                    }}
                  >
                    Generate Learning Path
                  </PrimaryButton>
                </div>
              )}
            </Card>
          )}

          {!selectedCourse && (
            <Card className="text-center py-12">
              <p className="text-text-muted">Please select a course to view your learning path</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

