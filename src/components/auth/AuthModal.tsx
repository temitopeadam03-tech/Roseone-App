import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AtSign, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, isAuthenticated, setIsAuthModalOpen, login, register, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [handleOrEmail, setHandleOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [supabaseMessage, setSupabaseMessage] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;



  const handleGoogleSignIn = async () => {
    if (!supabase) { setError('Google sign-in is not configured. Please contact the app administrator.'); return; }
    setIsLoading(true); setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    setIsLoading(false);
    if (oauthError) setError(oauthError.message);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) { setError('Enter the email address for your account.'); return; }
    if (!supabase) { setError('Password recovery is not configured. Please contact the app administrator.'); return; }
    setIsLoading(true); setError(null); setSupabaseMessage('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setIsLoading(false);
    if (resetError) setError(resetError.message); else setSupabaseMessage('If this email belongs to a Supabase Auth account, a password reset link has been sent.');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleOrEmail.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(handleOrEmail.trim(), password);
    setIsLoading(false);

    if (res.success) {
      setIsAuthModalOpen(false);
      showToast('Signed in successfully! Welcome to Gistupp.', 'success');
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const cleanHandle = handle.trim().replace(/^@/, '');
    const res = await register(name.trim(), cleanHandle, email.trim(), password, bio.trim());
    setIsLoading(false);

    if (res.success) {
      setIsAuthModalOpen(false);
      showToast('Account created! Welcome to Gistupp.', 'success');
    } else {
      setError(res.error || 'Failed to create account.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => { if (isAuthenticated) setIsAuthModalOpen(false); }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a151f] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-[#FCE7F3]/40 dark:from-[#E91E8C]/10 to-transparent">
          {isAuthenticated && <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-white/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>}

          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E91E8C] to-[#F06292] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E91E8C]">
              Gistupp Network
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {mode === 'login' ? 'Sign in to Gistupp' : 'Join the Gistupp network'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login'
              ? 'Connect, share, and express yourself across all your devices.'
              : 'Create your account to start sharing posts, stories, and voice notes.'}
          </p>

          {/* Mode Tabs */}
          <div className="flex p-1 mt-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#251f2c] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#251f2c] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 pt-2">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={handleOrEmail}
                    onChange={(e) => setHandleOrEmail(e.target.value)}
                    placeholder="Username or email address"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E91E8C] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E91E8C] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E91E8C]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <div className="text-right mt-2"><button type="button" onClick={() => { setResetMode(true); setResetEmail(handleOrEmail.includes("@") ? handleOrEmail : ""); setError(null); }} className="text-xs font-semibold text-[#E91E8C] hover:underline">Forgot password?</button></div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#E91E8C] hover:bg-[#BE185D] disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Gistupp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E91E8C] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Handle
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase())}
                      placeholder="jordanh"
                      required
                      className="w-full pl-8 pr-8 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E91E8C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full pl-8 pr-8 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E91E8C] transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E91E8C]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@example.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E91E8C] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Bio <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Creative designer & tech explorer."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E91E8C] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#E91E8C] hover:bg-[#BE185D] disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <div className="mt-4">
              <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div><div className="relative flex justify-center"><span className="px-3 bg-white dark:bg-[#1a151f] text-[10px] uppercase tracking-wider text-slate-400">or continue with</span></div></div>
              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full py-3 border border-slate-200 dark:border-slate-700 hover:border-[#E91E8C] rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 disabled:opacity-50">
                <svg aria-hidden="true" viewBox="0 0 48 48" className="w-4 h-4"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.13 13.22l7.98 6.19C13 13.72 18.03 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.92 46.98 24.55Z"/><path fill="#FBBC05" d="M11.11 28.59A14.4 14.4 0 0 1 10.35 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 3.13 10.78l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.47 0 11.91-2.13 15.88-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.15 2.3-5.97 0-11-4.22-12.89-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
                Continue with Google
              </button>
            </div>
          )}

          {resetMode && (
            <div className="mt-4 rounded-2xl border border-rose-100 dark:border-slate-700 p-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Reset your password</h3>
              <p className="text-xs text-slate-500 mb-3">Enter the email linked to your account to request a reset link.</p>
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required placeholder="Email address" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#251f2c] border border-slate-200 dark:border-slate-700 rounded-xl text-xs" />
                <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-[#E91E8C] text-white rounded-xl text-xs font-bold disabled:opacity-50">{isLoading ? 'Sending…' : 'Send reset link'}</button>
                <button type="button" onClick={() => { setResetMode(false); setSupabaseMessage(''); setError(null); }} className="w-full text-xs text-slate-500">Back to sign in</button>
              </form>
              {supabaseMessage && <p className="mt-3 text-xs text-emerald-600">{supabaseMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
