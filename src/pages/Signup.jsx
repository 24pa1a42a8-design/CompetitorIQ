import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import FormError from '../components/common/FormError';
import { useAuth } from '../context/AuthContext';
import { User, Mail, CheckCircle2, UserPlus } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your work email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter a password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeTerms) {
      newErrors.terms = 'Please accept the Terms and Conditions to proceed.';
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
      const res = await signup({ name, email, password });
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1200);
      } else {
        setGeneralError(res.message || 'Failed to create account. Please try again.');
      }
    } catch (_err) {
      setGeneralError('An error occurred during account creation.');
    }
  };

  return (
    <AuthLayout
      title="Create your CompetitorIQ account"
      subtitle="Join thousands of enterprise strategy leads tracking market moves autonomously"
    >
      {isSuccess ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-emerald-950">Account Created Successfully!</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Welcome aboard, <span className="font-semibold">{name}</span>. Initializing your strategic intelligence workspace...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={generalError} />

          {/* Full Name */}
          <Input
            label="Full Name"
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            placeholder="Alex Rivera"
            required
            autoComplete="name"
            icon={User}
            error={errors.name}
            disabled={isLoading}
          />

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
            placeholder="alex.rivera@enterprise.com"
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
            placeholder="Min. 6 characters"
            required
            autoComplete="new-password"
            error={errors.password}
            disabled={isLoading}
          />

          {/* Confirm Password Input */}
          <PasswordInput
            label="Confirm Password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
            placeholder="Repeat password"
            required
            autoComplete="new-password"
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          {/* Terms & Conditions Checkbox */}
          <div className="space-y-1 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (errors.terms) setErrors({ ...errors, terms: null });
                }}
                disabled={isLoading}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 transition cursor-pointer"
              />
              <span className="leading-relaxed">
                I agree to the{' '}
                <a href="#terms" className="text-indigo-600 underline font-medium hover:text-indigo-800">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-indigo-600 underline font-medium hover:text-indigo-800">
                  Privacy Policy
                </a>.
              </span>
            </label>
            {errors.terms && (
              <p className="text-[11px] font-medium text-rose-600 pl-6 animate-in fade-in duration-150">
                {errors.terms}
              </p>
            )}
          </div>

          {/* Create Account Button */}
          <Button
            type="submit"
            variant="indigo"
            fullWidth
            size="lg"
            isLoading={isLoading}
            icon={UserPlus}
            className="mt-2"
          >
            Create Account & Launch Workspace
          </Button>

          {/* Login Link */}
          <div className="pt-3 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-slate-900 hover:text-indigo-600 transition underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
