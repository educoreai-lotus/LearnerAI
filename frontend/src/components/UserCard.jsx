import Card from './Card';

/**
 * UserCard Component
 * Displays user information in dashboard
 */
export default function UserCard({ user, onClick, className = '' }) {
  return (
    <Card hover onClick={onClick} className={className}>
      <div className="flex items-center space-x-4">
        {/* User Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        {/* User Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary">{user.name || 'Unknown User'}</h3>
          <p className="text-sm text-text-secondary">{user.role || 'Learner'}</p>
          <div className="mt-2 flex items-center space-x-4 text-sm text-text-muted">
            <span>{user.courseCount || 0} Courses</span>
            <span>•</span>
            <span>{user.pathCount || 0} Paths</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

