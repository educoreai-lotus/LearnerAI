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
  // Using Alice's user ID from mock data: a1b2c3d4-e5f6-4789-a012-345678901234
  // You can also use: b2c3d4e5-f6a7-8901-2345-678901234567 (Wajdan) or c3d4e5f6-a7b8-9012-3456-789012345678 (Bob)
  const [userId] = useState('a1b2c3d4-e5f6-4789-a012-345678901234'); // Alice Johnson from mock data
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
      const paths = await api.getLearningPaths(userId);
      
      // Extract unique courses
      const courseSet = new Set();
      paths.forEach(path => {
        const competencyName = path.competencyTargetName || path.courseId || path.course_id;
        if (competencyName) courseSet.add(competencyName);
      });
      
      setCourses(Array.from(courseSet).map(id => ({ id, name: `Course ${id}` })));
      
      if (paths.length > 0 && !selectedCourse) {
        const firstCourse = paths[0].competencyTargetName || paths[0].courseId || paths[0].course_id;
        if (firstCourse) {
          setSelectedCourse(firstCourse);
          loadLearningPath(firstCourse, paths);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLearningPath = async (competencyTargetName, existingPaths = null) => {
    try {
      setPathLoading(true);
      let paths = existingPaths;
      
      if (!paths) {
        paths = await api.getLearningPaths(userId);
      }
      
      // Find path by competencyTargetName (which is the same as the path id in courses table)
      const path = paths.find(p => {
        const pId = p.competencyTargetName || p.courseId || p.course_id || p.id;
        return pId === competencyTargetName;
      });
      
      console.log('Found path for competency:', competencyTargetName, path); // Debug log
      
      if (path) {
        // Handle LearningPath entity format (from SupabaseRepository)
        const pathData = path.pathMetadata || path.pathData || path.learning_path || {};
        setLearningPath({
          id: path.id || path.competencyTargetName || path.course_id || competencyTargetName,
          pathTitle: path.pathTitle || pathData.pathTitle || 'Learning Path',
          totalDurationHours: path.totalDurationHours || pathData.totalDurationHours,
          pathSteps: path.pathSteps || pathData.pathSteps || [],
          modules: pathData.learning_modules || pathData.learningModules || [],
          pathData: pathData
        });
      } else {
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
            <p className="text-text-secondary">View your personalized learning journey</p>
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
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-text-primary mb-2">
                      {learningPath.pathTitle || 'Learning Path'}
                    </h2>
                    {learningPath.totalDurationHours && (
                      <p className="text-text-secondary">
                        Total Duration: {learningPath.totalDurationHours} hours
                      </p>
                    )}
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

