import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import FormError from '../components/common/FormError';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('competitor_iq_remember') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    try {
      const res = await login(email, password, rememberMe);
      if (res && res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setGeneralError(res?.message || 'Invalid email or password.');
      }
    } catch (_err) {
      setGeneralError('Invalid email or password.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to CompetitorIQ"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Inline Error Message */}
        <FormError message={generalError} />

        {/* Demo Credentials Hint */}
        <div className="p-3 bg-slate-50 border border-stone-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Demo Sign In:</span> Enter any valid email & password to access the workspace (e.g. <span className="font-mono text-slate-900 font-medium">alex.rivera@enterprise.com</span>).
          </div>
        </div>

        {/* Email Input */}
        <Input
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: null });
            if (generalError) setGeneralError('');
          }}
          placeholder="Enter your email"
          required
          autoComplete="email"
          icon={Mail}
          error={errors.email}
          disabled={isLoading}
        />

        {/* Password Input with Visibility Toggle */}
        <PasswordInput
          label="Password"
          id="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors({ ...errors, password: null });
            if (generalError) setGeneralError('');
          }}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
          error={errors.password}
          disabled={isLoading}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500/20 transition cursor-pointer"
            />
            <span className="font-medium">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition focus:outline-none focus:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Primary Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Create Account Link */}
        <div className="pt-4 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-bold text-slate-900 hover:text-orange-600 transition underline underline-offset-4"
          >
            Create account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
