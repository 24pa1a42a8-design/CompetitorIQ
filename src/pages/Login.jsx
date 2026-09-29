import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import FormError from '../components/common/FormError';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Auto populate remember email if present
  useEffect(() => {
    const savedEmail = localStorage.getItem('competitor_iq_remember');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

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
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setGeneralError(res.message || 'Invalid credentials. Please check your details and try again.');
      }
    } catch (err) {
      setGeneralError('Something went wrong during sign in. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back to CompetitorIQ"
      subtitle="Sign in to access your strategic competitor intelligence workspace"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormError message={generalError} />

        {/* Demo credentials hint for seamless evaluation */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Quick Demo Sign In:</span> Enter any valid email & password to explore the workspace (e.g. <span className="font-mono text-indigo-700 font-medium">alex.rivera@enterprise.com</span>).
          </div>
        </div>

        {/* Email Input */}
        <Input
          label="Work Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: null });
          }}
          placeholder="name@company.com"
          required
          autoComplete="email"
          icon={Mail}
          error={errors.email}
          disabled={isLoading}
        />

        {/* Password Input */}
        <PasswordInput
          label="Password"
          id="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors({ ...errors, password: null });
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
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 transition cursor-pointer"
            />
            <span className="font-medium">Remember me for 30 days</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition focus:outline-none focus:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="indigo"
          fullWidth
          size="lg"
          isLoading={isLoading}
          icon={ArrowRight}
          className="mt-2"
        >
          Sign In to Workspace
        </Button>

        {/* Sign Up Link */}
        <div className="pt-4 text-center text-xs text-slate-600">
          Don't have an account yet?{' '}
          <Link
            to="/signup"
            className="font-bold text-slate-900 hover:text-indigo-600 transition underline underline-offset-4"
          >
            Create an Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
