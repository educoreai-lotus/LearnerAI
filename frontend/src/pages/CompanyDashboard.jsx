import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import UserCard from '../components/UserCard';
import LearningPathTimeline from '../components/LearningPathTimeline';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { getCurrentUser, getUrlParams } from '../utils/auth';

/**
 * Company Dashboard Page
 * Displays all users in a company with their learning paths
 */
export default function CompanyDashboard() {
  // Get company_id from URL params, localStorage, or fallback to mock data
  const getCompanyId = () => {
    // First, try URL parameters (from Directory redirect)
    const urlParams = getUrlParams();
    if (urlParams.company_id) {
      return urlParams.company_id;
    }
    
    // Second, try localStorage (stored by initializeAuthFromUrl)
    const user = getCurrentUser();
    if (user && user.company_id) {
      return user.company_id;
    }
    
    // Fallback to mock data for development/testing
    return 'c1d2e3f4-5678-9012-3456-789012345678'; // TechCorp Inc.
  };
  
  const [companyId, setCompanyId] = useState(getCompanyId());
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [learningPaths, setLearningPaths] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Update companyId when auth changes (check after auth initialization completes)
  useEffect(() => {
    // Wait a bit for App.jsx auth initialization to complete
    const checkAuth = () => {
      const newCompanyId = getCompanyId();
      if (newCompanyId !== companyId) {
        setCompanyId(newCompanyId);
      }
    };

    // Check immediately
    checkAuth();

    // Check again after a short delay (to catch auth initialization from App.jsx)
    const timeout = setTimeout(checkAuth, 1000);

    // Listen for storage events (when auth is updated)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [companyId]);

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      
      // Fetch learners for the company
      const learnersResponse = await api.getLearnersByCompany(companyId);
      const learners = learnersResponse.learners || [];
      
      // Fetch courses (which contain learning paths) for each user
      const pathMap = {};
      const userMap = await Promise.all(
        learners.map(async (learner) => {
          const userId = learner.user_id || learner.userId;
          try {
            // Fetch courses for this user
            const coursesResponse = await api.getCoursesByUser(userId);
            const courses = coursesResponse.courses || coursesResponse || [];
            
            // Debug logging
            console.log(`CompanyDashboard - Courses for user ${userId}:`, {
              coursesCount: courses.length,
              courses: courses.map(c => ({
                competency: c.competency_target_name,
                hasLearningPath: !!c.learning_path,
                learningPathType: typeof c.learning_path,
                learningPathKeys: c.learning_path && typeof c.learning_path === 'object' ? Object.keys(c.learning_path) : 'N/A',
                approved: c.approved
              }))
            });
            
            // Transform courses to learning path format
            const userPaths = courses.map(course => {
              // Parse learning_path if it's a string
              let learningPathData = course.learning_path;
              if (typeof learningPathData === 'string') {
                try {
                  learningPathData = JSON.parse(learningPathData);
                } catch (e) {
                  console.warn(`Failed to parse learning_path for course ${course.competency_target_name}:`, e);
                  learningPathData = {};
                }
              }
              
              // If learning_path is null or undefined, create empty object
              if (!learningPathData) {
                learningPathData = {};
              }
              
              return {
                userId: course.user_id || userId,
                user_id: course.user_id || userId,
                competencyTargetName: course.competency_target_name || course.competencyTargetName,
                pathTitle: learningPathData.pathTitle || learningPathData.path_title || course.competency_target_name,
                pathData: learningPathData,
                learning_path: learningPathData,
                status: learningPathData.status || 'active',
                totalDurationHours: learningPathData.totalDurationHours || learningPathData.total_duration_hours,
                approved: course.approved
              };
            });
            
            pathMap[userId] = userPaths;
            
            return {
              userId,
              name: learner.user_name || learner.userName || `User ${userId}`,
              companyName: learner.company_name || learner.companyName,
              courseCount: new Set(userPaths.map(p => p.competencyTargetName)).size,
              pathCount: userPaths.length,
              paths: userPaths,
            };
          } catch (error) {
            console.warn(`Failed to load courses for user ${userId}:`, error);
            pathMap[userId] = [];
            return {
              userId,
              name: learner.user_name || learner.userName || `User ${userId}`,
              companyName: learner.company_name || learner.companyName,
              courseCount: 0,
              pathCount: 0,
              paths: [],
            };
          }
        })
      );

      setUsers(userMap);
      setLearningPaths(pathMap);
    } catch (error) {
      console.error('Failed to load company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      
      <main className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-300 mb-2">
              {users.length > 0 && users[0].companyName ? `${users[0].companyName} Dashboard` : 'Company Dashboard'}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {users.length > 0 ? `Viewing ${users.length} user${users.length !== 1 ? 's' : ''} and their learning paths` : 'View all users and their learning paths'}
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 rounded-input bg-white dark:bg-slate-800 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-700 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-fast"
              />
              <PrimaryButton onClick={loadCompanyData}>
                Refresh
              </PrimaryButton>
            </div>
          </Card>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.userId}
                user={user}
                onClick={() => {
                  if (selectedUser?.userId === user.userId) {
                    setSelectedUser(null);
                  } else {
                    setSelectedUser(user);
                    setSelectedPathIndex(0); // Reset to first path when selecting a new user
                  }
                }}
              />
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-text-muted">No users found</p>
            </Card>
          )}

          {/* Selected User Learning Paths */}
          {selectedUser && learningPaths[selectedUser.userId] && learningPaths[selectedUser.userId].length > 0 && (
            <Card className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-300">
                  Learning Paths for {selectedUser.name}
                </h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors duration-fast"
                  type="button"
                >
                  Close
                </button>
              </div>

              {/* Path Selector - Tabs for few paths, Dropdown for many */}
              {learningPaths[selectedUser.userId].length > 1 && (
                <div className="mb-6">
                  {learningPaths[selectedUser.userId].length <= 5 ? (
                    // Tabs for 5 or fewer paths
                    <div className="border-b border-neutral-200 dark:border-neutral-700">
                      <div className="flex space-x-1 overflow-x-auto">
                        {learningPaths[selectedUser.userId].map((path, index) => {
                          const learningPath = path.learning_path || path.pathData || {};
                          const isActive = index === selectedPathIndex;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedPathIndex(index)}
                              className={`px-4 py-2 text-sm font-medium transition-all duration-fast whitespace-nowrap ${
                                isActive
                                  ? 'border-b-2 border-primary-700 dark:border-primary-400 text-primary-700 dark:text-primary-400'
                                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-50 hover:border-b-2 hover:border-neutral-300 dark:hover:border-neutral-600'
                              }`}
                              type="button"
                            >
                              {path.pathTitle || learningPath.pathTitle || learningPath.path_title || path.competencyTargetName || `Path ${index + 1}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Dropdown for more than 5 paths
                    <div className="flex items-center gap-3">
                      <label htmlFor="path-selector" className="text-sm font-medium text-neutral-900 dark:text-neutral-50 whitespace-nowrap">
                        Select Learning Path:
                      </label>
                      <select
                        id="path-selector"
                        value={selectedPathIndex}
                        onChange={(e) => setSelectedPathIndex(Number(e.target.value))}
                        className="flex-1 px-4 py-3 rounded-input bg-white dark:bg-slate-800 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-700 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-fast"
                      >
                        {learningPaths[selectedUser.userId].map((path, index) => {
                          const learningPath = path.learning_path || path.pathData || {};
                          return (
                            <option key={index} value={index}>
                              {path.pathTitle || learningPath.pathTitle || learningPath.path_title || path.competencyTargetName || `Path ${index + 1}`}
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {selectedPathIndex + 1} of {learningPaths[selectedUser.userId].length}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Path Details - Use same component as User View */}
              {learningPaths[selectedUser.userId][selectedPathIndex] && (() => {
                const path = learningPaths[selectedUser.userId][selectedPathIndex];
                const learningPath = path.learning_path || path.pathData || {};
                
                // Parse learning_path if it's a string
                let pathData = learningPath;
                if (typeof pathData === 'string') {
                  try {
                    pathData = JSON.parse(pathData);
                  } catch (e) {
                    console.error('Failed to parse learning_path JSON:', e);
                    pathData = {};
                  }
                }
                
                // If pathData is null or undefined, set to empty object
                if (!pathData || typeof pathData !== 'object') {
                  pathData = {};
                }
                
                // Extract steps and modules (same logic as UserView)
                const steps = pathData.steps || pathData.pathSteps || [];
                let modules = pathData.learning_modules || pathData.learningModules || pathData.modules || [];
                
                // Debug logging
                console.log('CompanyDashboard - Path data for', path.competencyTargetName, ':', {
                  hasPathData: !!pathData,
                  pathDataKeys: pathData ? Object.keys(pathData) : [],
                  stepsCount: steps.length,
                  modulesCount: modules.length,
                  learning_modules: pathData.learning_modules,
                  learningModules: pathData.learningModules,
                  modules: pathData.modules,
                  rawLearningPath: path.learning_path
                });
                
                // Map steps to modules for display (same as UserView)
                if (steps.length > 0) {
                  if (modules.length > 0) {
                    // Group steps by modules
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
                        description: module.description || module.module_description,
                        estimated_duration_hours: module.estimated_duration_hours || module.duration,
                        // Preserve subtopics from database structure
                        subtopics: module.subtopics || []
                      };
                    });
                  } else {
                    // No modules, create modules from steps
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
                      steps: [step]
                    }));
                  }
                } else if (modules.length > 0) {
                  // Only modules, no steps - ensure proper structure
                  modules = modules.map((module, index) => ({
                    ...module,
                    module_order: module.module_order || index + 1,
                    module_title: module.module_title || module.name,
                    description: module.description || module.module_description,
                    estimated_duration_hours: module.estimated_duration_hours || module.duration,
                    // Include subtopics if available
                    subtopics: module.subtopics || []
                  }));
                }
                
                // Check if learning path has content
                const hasContent = modules.length > 0 || steps.length > 0 || Object.keys(pathData).length > 0;
                
                // Create path object for LearningPathTimeline component
                const pathForTimeline = {
                  id: path.competencyTargetName,
                  pathTitle: pathData.pathTitle || pathData.path_title || path.pathTitle || 'Learning Path',
                  pathGoal: pathData.pathGoal || pathData.path_goal,
                  pathDescription: pathData.pathDescription || pathData.path_description,
                  totalDurationHours: pathData.totalDurationHours || pathData.total_duration_hours,
                  estimatedCompletion: pathData.estimatedCompletion,
                  totalSteps: pathData.totalSteps || steps.length,
                  pathSteps: steps,
                  modules: modules,
                  pathData: pathData,
                  approved: path.approved
                };
                
                // If no content, show message
                if (!hasContent) {
                  return (
                    <div>
                      <div className="mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                          {path.competencyTargetName}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Learning path is being generated. Please check back later.
                        </p>
                      </div>
                      <div className="text-center py-8 text-neutral-500 dark:text-neutral-500">
                        <p>Learning path content is not available yet.</p>
                        <p className="text-sm mt-2">The learning path may still be processing or hasn't been generated.</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div>
                    {/* Path Header - Same as User View */}
                    <div className="mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                        {pathForTimeline.pathTitle || 'Learning Path'}
                      </h3>
                      
                      {/* Path Goal */}
                      {pathForTimeline.pathGoal && (
                        <p className="text-base font-medium text-primary-700 dark:text-primary-400 mb-2">
                          {pathForTimeline.pathGoal}
                        </p>
                      )}
                      
                      {/* Path Description */}
                      {pathForTimeline.pathDescription && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                          {pathForTimeline.pathDescription}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <span>
                          <strong>Course:</strong> {path.competencyTargetName}
                        </span>
                        {pathForTimeline.totalDurationHours && (
                          <span>
                            <strong>Total Duration:</strong> {pathForTimeline.totalDurationHours} hours
                          </span>
                        )}
                        {pathForTimeline.estimatedCompletion && (
                          <span>
                            <strong>Estimated Completion:</strong> {pathForTimeline.estimatedCompletion}
                          </span>
                        )}
                        {pathForTimeline.totalSteps && (
                          <span>
                            <strong>Total Steps:</strong> {pathForTimeline.totalSteps}
                          </span>
                        )}
                        {path.approved !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            path.approved 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {path.approved ? 'Approved' : 'Pending Approval'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Use the same LearningPathTimeline component as User View */}
                    <LearningPathTimeline path={pathForTimeline} />
                  </div>
                );
              })()}
            </Card>
          )}
          
          {/* Show message if user has no paths */}
          {selectedUser && (!learningPaths[selectedUser.userId] || learningPaths[selectedUser.userId].length === 0) && (
            <Card className="mt-8">
              <div className="text-center py-8">
                <p className="text-neutral-500 dark:text-neutral-500">No learning paths found for {selectedUser.name}</p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

