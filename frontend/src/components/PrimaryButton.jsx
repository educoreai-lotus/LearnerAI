/**
 * PrimaryButton Component
 * Reusable button with emeraldbrand styling
 */
export default function PrimaryButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = 'px-6 py-3 rounded-button font-medium transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-primary-700 dark:focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-700 dark:bg-gradient-to-br dark:from-teal-600 dark:to-emerald-600 text-white hover:bg-primary-800 dark:hover:from-emerald-600 dark:hover:to-primary-700 hover:shadow-md dark:hover:shadow-lg disabled:bg-neutral-300 dark:disabled:bg-neutral-600',
    secondary: 'bg-transparent border-2 border-primary-700 dark:border-primary-400 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-neutral-800 disabled:border-neutral-300 dark:disabled:border-neutral-600 disabled:text-neutral-400',
    accent: 'bg-gradient-to-r from-accent-600 to-accent-500 text-white hover:from-accent-700 hover:to-accent-600 hover:shadow-md disabled:from-neutral-300 disabled:to-neutral-300',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

