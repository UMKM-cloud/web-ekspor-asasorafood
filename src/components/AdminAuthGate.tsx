import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { SiteBranding } from '../data/asasoraData';

interface AuthStatusResponse {
  configured: boolean;
  source: 'env' | 'claimed' | 'unclaimed';
  adminEmail: string;
  twoFactorEnabled?: boolean;
}

interface AdminAuthGateProps {
  branding: SiteBranding;
  onAuthenticated: (token: string, adminEmail: string) => void;
  onBackToSite: () => void;
}

export function AdminAuthGate({
  branding,
  onAuthenticated,
  onBackToSite,
}: AdminAuthGateProps) {
  const [status, setStatus] = useState<AuthStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Two-Factor Challenge State
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeEmail, setChallengeEmail] = useState<string>('');
  const [totpCode, setTotpCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [backendUnavailable, setBackendUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/auth/status')
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error('BACKEND_UNAVAILABLE');
        }
        return (await res.json()) as AuthStatusResponse;
      })
      .then((data: AuthStatusResponse) => {
        if (!active) return;
        setBackendUnavailable(false);
        setStatus(data);
        if (data.adminEmail) {
          setEmail(data.adminEmail);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && err.message === 'BACKEND_UNAVAILABLE') {
          setBackendUnavailable(true);
          setErrorMsg(
            'Admin authentication backend (/api) is not running on this host. Static deployments (such as Netlify dist-only) do not run server.ts — open the AI Studio / Cloud Run URL or a Node.js deployment (npm start) to sign in.',
          );
        } else {
          setErrorMsg('Unable to reach authentication service.');
        }
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isFirstRunSetup = status?.source === 'unclaimed';

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (backendUnavailable) {
      setErrorMsg(
        'Admin authentication backend (/api) is not running on this host. Please sign in from your Node.js / AI Studio deployment.',
      );
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter the administrator email address.');
      return;
    }

    if (isFirstRunSetup) {
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Password confirmation does not match.');
        return;
      }
    } else if (!password) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isFirstRunSetup ? '/api/admin/auth/setup' : '/api/admin/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setBackendUnavailable(true);
        setErrorMsg(
          'Authentication endpoint returned a non-JSON response (static hosting detected). Deploy with Node.js (npm start) or use the AI Studio / Cloud Run URL to sign in.',
        );
        return;
      }

      const data = (await res.json()) as {
        token?: string;
        requires2fa?: boolean;
        challengeToken?: string;
        adminEmail?: string;
        error?: string;
      };

      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      if (data.requires2fa && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setChallengeEmail(data.adminEmail || email.trim());
        setPassword('');
        setTotpCode('');
        return;
      }

      if (!data.token) {
        setErrorMsg('Authentication failed. Missing session token.');
        return;
      }

      onAuthenticated(data.token, data.adminEmail || email.trim());
    } catch {
      setErrorMsg('Network error while contacting authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!challengeToken || !totpCode.trim()) {
      setErrorMsg('Please enter your 6-digit authenticator code or recovery code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/auth/login/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          code: totpCode.trim(),
        }),
      });

      const data = (await res.json()) as {
        token?: string;
        adminEmail?: string;
        error?: string;
      };

      if (!res.ok || !data.token) {
        setErrorMsg(data.error || 'Verification code invalid or expired.');
        return;
      }

      onAuthenticated(data.token, data.adminEmail || challengeEmail);
    } catch {
      setErrorMsg('Network error while verifying 2FA code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C2822] flex flex-col justify-between p-6">
      <div className="max-w-7xl w-full mx-auto">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#435249] hover:text-[#1B3B2B] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to {branding.brandName} Website</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto my-10 bg-white border border-[#1B3B2B]/15 rounded-sm p-8 sm:p-10">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-[#1B3B2B]/12">
          <div className="h-8 w-8 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={branding.logoUrl}
              alt={branding.brandName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center"
            />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-[#1B3B2B]">
              {branding.brandName}
            </p>
            <p className="text-xs text-[#6B7970]">Protected Content Studio</p>
          </div>
        </div>

        {loadingStatus ? (
          <div className="py-10 text-center text-sm text-[#526058]">
            Verifying security configuration...
          </div>
        ) : challengeToken ? (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#C87D55] mb-2">
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span>Two-Factor Authentication (2FA)</span>
              </div>
              <h1 className="font-display text-2xl font-semibold text-[#1B3B2B]">
                Verify Authenticator Code
              </h1>
              <p className="text-xs text-[#526058] mt-1.5 leading-relaxed">
                Enter the 6-digit code from your authenticator app for{' '}
                <strong className="text-[#1B3B2B]">{challengeEmail}</strong>, or enter one of your
                saved one-time recovery codes.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-sm"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-2fa-code"
                  className="block text-xs font-medium text-[#435249] mb-1.5"
                >
                  Authenticator or Recovery Code
                </label>
                <input
                  id="admin-2fa-code"
                  type="text"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456 or XXXX-XXXX"
                  className="w-full px-3.5 py-2.5 text-base tracking-widest text-center font-mono bg-[#FAF9F6] border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-5 py-3 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] disabled:opacity-60 rounded-sm transition-colors cursor-pointer"
              >
                {submitting ? 'Verifying Code...' : 'Verify & Open Content Studio'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setChallengeToken(null);
                  setTotpCode('');
                  setErrorMsg('');
                }}
                className="w-full px-4 py-2 text-xs font-medium text-[#526058] hover:text-[#1B3B2B] cursor-pointer"
              >
                Use a different account or retry password
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#C87D55] mb-2">
                {isFirstRunSetup ? (
                  <>
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    <span>Initial Admin Account Setup</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" aria-hidden="true" />
                    <span>Administrator Authentication</span>
                  </>
                )}
              </div>
              <h1 className="font-display text-2xl font-semibold text-[#1B3B2B]">
                {isFirstRunSetup ? 'Claim Admin Access' : 'Sign In to Admin Panel'}
              </h1>
              <p className="text-xs text-[#526058] mt-1.5 leading-relaxed">
                {isFirstRunSetup
                  ? 'No admin password has been set yet. Create your administrator credentials to lock and manage website content.'
                  : 'Enter your administrator email and password to edit storefront sections and view B2B buyer inquiries.'}
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 px-3.5 py-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-sm"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-[#435249] mb-1.5"
                >
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@asasorafood.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-medium text-[#435249] mb-1.5"
                >
                  {isFirstRunSetup ? 'Create Password (min. 8 characters)' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={isFirstRunSetup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#FAF9F6] border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#526058] hover:text-[#1B3B2B] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isFirstRunSetup && (
                <div>
                  <label
                    htmlFor="admin-password-confirm"
                    className="block text-xs font-medium text-[#435249] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="admin-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#1B3B2B]/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 px-5 py-3 text-sm font-medium text-[#FAF9F6] bg-[#1B3B2B] hover:bg-[#132A1E] disabled:opacity-60 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3B2B]"
              >
                {submitting
                  ? 'Verifying...'
                  : isFirstRunSetup
                    ? 'Save Password & Enter Admin Panel'
                    : 'Sign In to Content Studio'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-center text-xs text-[#6B7970]">
        Server-verified session authentication &middot; {branding.brandName}
      </p>
    </div>
  );
}
