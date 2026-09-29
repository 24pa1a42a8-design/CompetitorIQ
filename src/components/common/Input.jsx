import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  autoComplete,
  disabled = false,
  icon: Icon,
  helperText,
  className = '',
  ...props
}) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full bg-white text-slate-900 border text-xs rounded-xl py-2.5 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 transition duration-150 placeholder:text-slate-400 focus:outline-none ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-900'
              : 'border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 hover:border-stone-300'
          } ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="text-[11px] font-medium text-rose-600 animate-in fade-in duration-150">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-[11px] text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
