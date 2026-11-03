import React, { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff, Lock, Sparkles } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = useMemo(() => {
    const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
    const url = rawUrl && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(rawUrl) ? rawUrl : '';
    const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();
    return url && key && !key.includes('YOUR_') ? createClient(url, key) : null;
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (!supabase) { setError('Password recovery is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your Netlify environment variables.'); return; }
    if (password.length < 6) { setError('Your password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return; }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    setMessage('Your password has been updated. You can now return to Gistupp and sign in.');
  };

  return <main className="min-h-screen flex items-center justify-center bg-[#FDF2F8] dark:bg-[#120e14] p-4">
    <section className="w-full max-w-md rounded-3xl border border-pink-100 dark:border-slate-800 bg-white dark:bg-[#1a151f] p-7 shadow-xl">
      <div className="flex items-center gap-2 text-[#E91E8C] mb-5"><span className="w-9 h-9 rounded-xl bg-[#E91E8C] text-white flex items-center justify-center"><Sparkles className="w-5 h-5" /></span><span className="font-bold tracking-wide text-xs uppercase">Gistupp Network</span></div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Choose a new password</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Create a new password for your Gistupp account.</p>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm">{error}</p>}
      {message ? <div className="space-y-4"><p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3 text-sm">{message}</p><a className="block text-center rounded-xl bg-[#E91E8C] text-white py-3 font-bold" href="/">Return to Gistupp</a></div> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">New password<div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input autoComplete="new-password" required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#251f2c] py-3 pl-10 pr-11 text-sm" placeholder="At least 6 characters"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div></label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm new password<div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input autoComplete="new-password" required minLength={6} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#251f2c] py-3 pl-10 pr-11 text-sm" placeholder="Enter password again"/><button type="button" aria-label={showConfirm ? 'Hide password' : 'Show password'} onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div></label>
        <button disabled={busy} className="w-full rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] disabled:opacity-50 py-3 text-sm font-bold text-white">{busy ? 'Updating password…' : 'Update password'}</button>
      </form>}
    </section>
  </main>;
};
