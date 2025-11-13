/**
 * Card Component
 * Reusable card with gradient and shadow
 */
export default function Card({ children, className = '', hover = false, ...props }) {
  const hoverClasses = hover ? 'hover:shadow-hover hover:-translate-y-1 transition-smooth cursor-pointer' : '';
  
  return (
    <div
      className={`gradient-card shadow-card rounded-card p-lg border border-emeraldbrand-200/20 dark:border-emeraldbrand-800/20 ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

