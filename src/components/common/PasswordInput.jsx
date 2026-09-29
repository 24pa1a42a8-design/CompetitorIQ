import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  label = 'Password',
  id = 'password',
  value,
  onChange,
  error,
  placeholder = '••••••••',
  required = false,
  autoComplete = 'current-password',
  disabled = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Lock className="w-4 h-4" />
        </div>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full bg-white text-slate-900 border text-xs rounded-xl py-2.5 pl-10 pr-10 transition duration-150 placeholder:text-slate-400 focus:outline-none ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-900'
              : 'border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 hover:border-stone-300'
          } ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded focus:ring-1 focus:ring-orange-500 transition"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-[11px] font-medium text-rose-600 animate-in fade-in duration-150">
          {error}
        </p>
      )}
    </div>
  );
}
