import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import FormError from '../components/common/FormError';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await resetPassword(email);
      if (res.success) {
        setIsSuccess(true);
      }
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your registered work email and we'll send you instructions to reset your password"
    >
      {isSuccess ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Check your inbox</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We have dispatched a password reset link to <span className="font-semibold text-slate-900">{email}</span>. The link will remain valid for 60 minutes.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
              }}
            >
              Try another email address
            </Button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition py-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />

          <Input
            label="Work Email Address"
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="alex.rivera@enterprise.com"
            required
            autoComplete="email"
            icon={Mail}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="indigo"
            fullWidth
            size="lg"
            isLoading={isLoading}
            icon={KeyRound}
            className="mt-2"
          >
            Send Password Reset Link
          </Button>

          <div className="pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
