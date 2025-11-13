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
  const baseClasses = 'px-6 py-3 rounded-button font-medium transition-smooth focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-primary text-white hover:shadow-hover hover:-translate-y-0.5',
    secondary: 'bg-transparent border-2 border-primary-cyan text-primary-cyan hover:bg-primary-cyan hover:text-white',
    accent: 'bg-gradient-accent text-white hover:shadow-hover hover:-translate-y-0.5',
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

