/**
 * Card Component
 * Reusable card with gradient and shadow
 */
export default function Card({ children, className = '', hover = false, ...props }) {
  const hoverClasses = hover ? 'hover:shadow-brand-hover hover:-translate-y-0.5 transition-all duration-normal cursor-pointer' : '';
  
  return (
    <div
      className={`bg-white dark:bg-slate-800 shadow-lg dark:shadow-xl rounded-lg p-6 border border-neutral-200 dark:border-neutral-700/50 ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

