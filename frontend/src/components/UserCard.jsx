import Card from './Card';

/**
 * UserCard Component
 * Displays user information in dashboard
 */
export default function UserCard({ user, onClick, className = '' }) {
  return (
    <Card hover onClick={onClick} className={className}>
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 dark:from-teal-600 dark:to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        {/* User Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{user.name || 'Unknown User'}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{user.role || 'Learner'}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-500">
            <span>{user.courseCount || 0} Courses</span>
            <span>•</span>
            <span>{user.pathCount || 0} Paths</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

