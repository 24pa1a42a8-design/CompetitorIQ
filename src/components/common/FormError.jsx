import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormError({ message, id = 'form-error' }) {
  if (!message) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
    >
      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      <span className="font-medium leading-relaxed">{message}</span>
    </div>
  );
}
