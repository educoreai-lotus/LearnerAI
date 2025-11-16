/**
 * LoadingSpinner Component
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`inline-block ${sizes[size]} ${className}`}>
      <div className="animate-spin rounded-full border-3 border-primary-200 dark:border-primary-800 border-t-primary-700 dark:border-t-primary-400" style={{ borderWidth: '3px' }}></div>
    </div>
  );
}

