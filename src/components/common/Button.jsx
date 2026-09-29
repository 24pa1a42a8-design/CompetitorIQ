import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none active:scale-[0.99]';

  const variants = {
    primary:
      'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800 focus:ring-orange-500 border border-transparent shadow-xs',
    dark:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-900 border border-transparent shadow-xs',
    outline:
      'bg-white text-slate-700 border border-stone-200 hover:bg-stone-50 hover:text-slate-900 hover:border-stone-300 focus:ring-orange-500 shadow-2xs',
    ghost:
      'bg-transparent text-slate-600 hover:bg-stone-100 hover:text-slate-900 focus:ring-slate-400'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2.5 gap-2',
    lg: 'text-xs sm:text-sm px-5 py-3 gap-2.5'
  };

  const disabledStyles = 'opacity-60 cursor-not-allowed active:scale-100 shadow-none pointer-events-none';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? disabledStyles : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
