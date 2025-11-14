import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import UserCard from '../components/UserCard';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

/**
 * Company Dashboard Page
 * Displays all users in a company with their learning paths
 */
export default function CompanyDashboard() {
  const [companyId] = useState('test-company-auto-001'); // TODO: Get from auth/context
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [learningPaths, setLearningPaths] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const paths = await api.getCompanyLearningPaths(companyId);
      
      // Group paths by user
      const userMap = {};
      paths.forEach(path => {
        const userId = path.userId || path.user_id;
        if (!userMap[userId]) {
          userMap[userId] = {
            userId,
            name: `User ${userId}`,
            courseCount: 0,
            pathCount: 0,
            paths: [],
          };
        }
        userMap[userId].paths.push(path);
        userMap[userId].pathCount++;
        userMap[userId].courseCount = new Set(userMap[userId].paths.map(p => p.competencyTargetName || p.courseId || p.course_id)).size;
      });

      setUsers(Object.values(userMap));
      setLearningPaths(paths.reduce((acc, path) => {
        const userId = path.userId || path.user_id;
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(path);
        return acc;
      }, {}));
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
            <h1 className="text-3xl font-bold text-text-primary mb-2">Company Dashboard</h1>
            <p className="text-text-secondary">View all users and their learning paths</p>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 rounded-button bg-bg-secondary border border-emeraldbrand-200 dark:border-emeraldbrand-800 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-cyan"
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
                onClick={() => setSelectedUser(selectedUser?.userId === user.userId ? null : user)}
              />
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-text-muted">No users found</p>
            </Card>
          )}

          {/* Selected User Learning Paths */}
          {selectedUser && learningPaths[selectedUser.userId] && (
            <Card className="mt-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Learning Paths for {selectedUser.name}
              </h2>
              <div className="space-y-6">
                {learningPaths[selectedUser.userId].map((path, index) => (
                  <div key={index} className="border-b border-emeraldbrand-200 dark:border-emeraldbrand-800 pb-6 last:border-0 last:pb-0">
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      {path.pathTitle || `Path ${index + 1}`}
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      Course: {path.competencyTargetName || path.courseId || path.course_id} • Status: {path.status || 'active'}
                    </p>
                    {path.pathData && path.pathData.learning_modules && (
                      <div className="space-y-4">
                        {path.pathData.learning_modules.map((module, i) => (
                          <div key={i} className="bg-bg-secondary rounded-lg p-4">
                            <h4 className="font-medium text-text-primary mb-2">
                              {module.module_title || `Module ${i + 1}`}
                            </h4>
                            {module.learning_goals && (
                              <ul className="list-disc list-inside text-sm text-text-secondary">
                                {module.learning_goals.map((goal, j) => (
                                  <li key={j}>{goal}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

