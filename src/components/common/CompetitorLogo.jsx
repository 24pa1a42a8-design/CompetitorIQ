import React, { useState } from 'react';

/**
 * Official Brand SVG Logos for Enterprise Competitors
 * Microsoft, Google Cloud, AWS, Oracle, Salesforce, IBM
 */

export function MicrosoftLogo({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 23" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="10.8" height="10.8" fill="#F25022" />
      <rect x="12.2" y="0" width="10.8" height="10.8" fill="#7FBA00" />
      <rect x="0" y="12.2" width="10.8" height="10.8" fill="#00A4EF" />
      <rect x="12.2" y="12.2" width="10.8" height="10.8" fill="#FFB900" />
    </svg>
  );
}

export function GoogleCloudLogo({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#4285F4" />
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.39 0-2.7.38-3.82 1.05l2.45 2.45C11.18 7.18 11.58 7.1 12 7.1c2.71 0 4.96 1.95 5.4 4.54l.43 2.56h1.52c1.46 0 2.65 1.19 2.65 2.65 0 1.25-.87 2.3-2.07 2.57l1.79 1.79c1.92-.81 3.28-2.69 3.28-4.86 0-2.64-2.05-4.78-4.65-4.96z" fill="#34A853" />
      <path d="M12 4C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 1.83.82 3.47 2.11 4.58l2.12-2.12C3.42 15.8 3.1 14.94 3.1 14c0-2.21 1.79-4 4-4 .38 0 .75.06 1.1.16l2.15-2.15C9.48 7.37 10.69 7.1 12 7.1" fill="#EA4335" />
      <path d="M6 20h13c.48 0 .94-.07 1.38-.2l-2.07-2.07C18.04 17.88 17.53 18 17 18H6c-2.21 0-4-1.79-4-4 0-.94.32-1.8.83-2.46L.72 9.42C.26 10.8.0 12.37.0 14c0 3.31 2.69 6 6 6z" fill="#FBBC05" />
    </svg>
  );
}

export function AwsLogo({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M7.7 13.2c-.7.5-1.5.8-2.3.8-1.5 0-2.2-.8-2.2-2.1 0-1.7 1.3-2.6 3.7-2.6h.8v-.5c0-.9-.5-1.4-1.6-1.4-.8 0-1.5.2-2.2.6l-.4-1.2c.8-.5 1.8-.8 2.9-.8 2 0 3 1 3 2.7v5.2H7.9l-.2-.7zm.1-2.7h-.7c-1.5 0-2.2.5-2.2 1.4 0 .7.4 1.1 1.2 1.1.6 0 1.2-.2 1.7-.6v-1.9zM15.4 6.2l-2.1 7.7h-1.6L9.9 7.7l-1.8 6.2H6.6l-2.5-7.7h1.7l1.7 5.8 1.8-5.8h1.5l1.8 5.8 1.7-5.8h1.6zm7.2 4.4c0-1.1-.3-1.9-.9-2.5-.6-.6-1.5-.9-2.6-.9-1.1 0-2.1.3-2.9 1l.5 1.2c.7-.5 1.5-.8 2.2-.8.7 0 1.2.2 1.5.5.3.3.5.7.5 1.2 0 .4-.1.7-.4 1-.3.3-.8.6-1.6.8-1.2.4-2.1.8-2.6 1.3-.5.5-.8 1.2-.8 2 0 .9.3 1.6.9 2.1.6.5 1.4.8 2.4.8 1 0 1.9-.3 2.7-.9l.2.7h1.4v-5.2c.3-.8.3-1.6.3-2.3zm-1.6 2.3v1.3c-.6.6-1.3.9-2.1.9-.6 0-1-.1-1.3-.4-.3-.3-.5-.7-.5-1.2 0-.5.2-.9.5-1.2.3-.3.9-.6 1.8-.9.9-.2 1.4-.4 1.6-.5z" fill="#232F3E" />
      <path d="M21.2 18.2c-3.1 2.3-7.6 3.5-11.5 3.5-5.4 0-10.3-2-14-5.3l-.9.8c4.1 3.7 9.4 6 15.3 6 4.3 0 9.2-1.3 12.6-3.8l-1.5-1.2z" fill="#FF9900" />
      <path d="M22.5 16.7c-.4-.5-2.5-.2-3.5 0l1.1.9c.7.6 1.7.5 2.1.1.4-.4.6-1.3.3-1Spr.0" fill="#FF9900" />
    </svg>
  );
}

export function OracleLogo({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="2" width="32" height="16" rx="3" fill="#EA2929" />
      <path d="M6 6.5C4.6 6.5 3.5 7.6 3.5 9s1.1 2.5 2.5 2.5h2C9.4 11.5 10.5 10.4 10.5 9S9.4 6.5 8 6.5H6zm0 1.2h2c.7 0 1.3.6 1.3 1.3s-.6 1.3-1.3 1.3H6c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3zm6.3-1.2h1.8l1.7 2.4 1.7-2.4h1.8l-2.4 3.2 2.6 3.3h-1.9l-1.8-2.5-1.8 2.5h-1.9l2.6-3.3-2.5-3.2zm9.5 0H24c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5h-2.2v-5zm1.3 1.2v2.6H24c.7 0 1.3-.6 1.3-1.3s-.6-1.3-1.3-1.3h-2.2z" fill="#FFFFFF" />
    </svg>
  );
}

export function SalesforceLogo({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M10.1 4.3a5.5 5.5 0 0 1 4.8 2.8 4.2 4.2 0 0 1 2.7.2 4.6 4.6 0 0 1 2.9 4.2 4.1 4.1 0 0 1-1.3 3.1 5.4 5.4 0 0 1-3.7 1.4H7.5A4.5 4.5 0 0 1 3 11.5c0-2.1 1.4-3.9 3.4-4.4a5.6 5.6 0 0 1 3.7-2.8z" fill="#00A1E0" />
      <path d="M8.2 10.8c.3-.4.8-.6 1.4-.6.7 0 1.2.3 1.5.8l.2.4.4-.2c.4-.2.8-.3 1.2-.3.9 0 1.6.6 1.8 1.4l.1.4.4.1c.5.1.9.5 1 1 .1.5-.1 1-.5 1.3-.3.3-.8.4-1.3.4H7.5c-.6 0-1.1-.2-1.5-.6-.4-.4-.6-.9-.5-1.5.1-.6.5-1.1 1.1-1.3l.4-.1.1-.4c.2-.5.6-.8 1.1-.8z" fill="#FFFFFF" />
    </svg>
  );
}

export function IbmLogo({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 18" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* IBM 8-bar striped logo representation */}
      <g fill="#0F62FE">
        {/* I */}
        <rect x="2" y="2" width="4" height="1.5" />
        <rect x="2" y="4.2" width="4" height="1.5" />
        <rect x="3.2" y="6.4" width="1.6" height="1.5" />
        <rect x="3.2" y="8.6" width="1.6" height="1.5" />
        <rect x="3.2" y="10.8" width="1.6" height="1.5" />
        <rect x="3.2" y="13" width="1.6" height="1.5" />
        <rect x="2" y="15.2" width="4" height="1.5" />

        {/* B */}
        <rect x="8" y="2" width="7" height="1.5" />
        <rect x="8" y="4.2" width="2" height="1.5" /><rect x="13" y="4.2" width="2" height="1.5" />
        <rect x="8" y="6.4" width="2" height="1.5" /><rect x="13.5" y="6.4" width="2" height="1.5" />
        <rect x="8" y="8.6" width="7" height="1.5" />
        <rect x="8" y="10.8" width="2" height="1.5" /><rect x="13.5" y="10.8" width="2" height="1.5" />
        <rect x="8" y="13" width="2" height="1.5" /><rect x="13" y="13" width="2" height="1.5" />
        <rect x="8" y="15.2" width="7" height="1.5" />

        {/* M */}
        <rect x="17" y="2" width="2" height="1.5" /><rect x="22" y="2" width="2" height="1.5" /><rect x="27" y="2" width="2" height="1.5" />
        <rect x="17" y="4.2" width="2.5" height="1.5" /><rect x="21.7" y="4.2" width="2.6" height="1.5" /><rect x="26.5" y="4.2" width="2.5" height="1.5" />
        <rect x="17" y="6.4" width="3" height="1.5" /><rect x="21.5" y="6.4" width="3" height="1.5" /><rect x="26" y="6.4" width="3" height="1.5" />
        <rect x="17" y="8.6" width="2" height="1.5" /><rect x="22" y="8.6" width="2" height="1.5" /><rect x="27" y="8.6" width="2" height="1.5" />
        <rect x="17" y="10.8" width="2" height="1.5" /><rect x="27" y="10.8" width="2" height="1.5" />
        <rect x="17" y="13" width="2" height="1.5" /><rect x="27" y="13" width="2" height="1.5" />
        <rect x="17" y="15.2" width="2" height="1.5" /><rect x="27" y="15.2" width="2" height="1.5" />
      </g>
    </svg>
  );
}

/**
 * Universal CompetitorLogo Component
 * Maps competitor names/slugs to official brand SVGs with error safety & letter fallback.
 */
export default function CompetitorLogo({
  name = '',
  size = 20,
  className = '',
  containerClassName = '',
  showContainer = false,
  fallbackBg = 'bg-slate-700 text-white'
}) {
  const [hasError, setHasError] = useState(false);

  const cleanName = (name || '').toLowerCase().trim();

  // Normalize competitor key
  let logoComponent = null;

  if (!hasError) {
    if (cleanName.includes('microsoft') || cleanName === 'msft') {
      logoComponent = <MicrosoftLogo size={size} className={className} />;
    } else if (cleanName.includes('google') || cleanName.includes('gcp')) {
      logoComponent = <GoogleCloudLogo size={size} className={className} />;
    } else if (cleanName.includes('aws') || cleanName.includes('amazon')) {
      logoComponent = <AwsLogo size={size} className={className} />;
    } else if (cleanName.includes('oracle')) {
      logoComponent = <OracleLogo size={size} className={className} />;
    } else if (cleanName.includes('salesforce') || cleanName.includes('sfdc')) {
      logoComponent = <SalesforceLogo size={size} className={className} />;
    } else if (cleanName.includes('ibm')) {
      logoComponent = <IbmLogo size={size} className={className} />;
    }
  }

  // Fallback initial letter
  const initial = (name || 'C').charAt(0).toUpperCase();

  if (!logoComponent || hasError) {
    return (
      <div 
        className={`inline-flex items-center justify-center font-bold rounded-lg shrink-0 ${fallbackBg} ${containerClassName}`}
        style={{ width: size + 4, height: size + 4, fontSize: Math.max(10, Math.floor(size * 0.5)) }}
      >
        {initial}
      </div>
    );
  }

  if (showContainer) {
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-lg bg-white border border-stone-200/80 shadow-2xs shrink-0 overflow-hidden ${containerClassName}`}
        style={{ width: size + 8, height: size + 8, padding: 2 }}
        onError={() => setHasError(true)}
      >
        {logoComponent}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${containerClassName}`} onError={() => setHasError(true)}>
      {logoComponent}
    </span>
  );
}
