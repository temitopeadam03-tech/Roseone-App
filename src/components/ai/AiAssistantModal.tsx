import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AiAssistantModal: React.FC = () => {
  const {
    aiAssistantModalOpen,
    setAiAssistantModalOpen,
    showToast,
  } = useApp();

  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<'creative' | 'professional' | 'bold' | 'playful'>('creative');
  const [generatedResult, setGeneratedResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!aiAssistantModalOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      let result = '';
      if (tone === 'creative') {
        result = `✨ "${prompt}" — Crafted with clean pink aesthetics and human-centered design. Every detail brings warmth and intentional simplicity. #RoseOne #Design`;
      } else if (tone === 'professional') {
        result = `Announcement: ${prompt}. Engineered with dedicated Android back-stack routing, zero dead clicks, and full WCAG contrast accessibility. #MobileArchitecture #Product`;
      } else if (tone === 'bold') {
        result = `Real mobile experiences belong to native thumb zones. ${prompt} — Built with privacy-first standards and clean ergonomics. 🌸 #RoseOne #NextGen`;
      } else {
        result = `🌸 Quick thoughts on ${prompt}: Love how clean the RoseOne layout feels! What are you creating today? Let me know 👇`;
      }
      setGeneratedResult(result);
      setIsLoading(false);
      showToast('RoseOne AI generated draft!', 'success');
    }, 600);
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard?.writeText(generatedResult);
    setCopied(true);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#FCE7F3]/40 to-transparent dark:from-[#BE185D]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#BE185D] to-[#E91E8C] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                RoseOne AI Assistant
              </h3>
              <p className="text-[11px] text-slate-500">Caption suggestions & tone refiner</p>
            </div>
          </div>
          <button
            onClick={() => setAiAssistantModalOpen(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Privacy Notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Privacy-First Guarantee:
              </span>{' '}
              <span className="text-slate-500">
                RoseOne AI operates strictly with your explicit consent. Your drafts are never shared or used for public training.
              </span>
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Select Tone
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['creative', 'professional', 'bold', 'playful'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`min-h-[34px] py-1 text-xs font-semibold rounded-xl capitalize transition-all border ${
                    tone === t
                      ? 'border-[#E91E8C] bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              What would you like to draft or polish?
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Announce our mobile app release on RoseOne..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>

          {/* Generated Result */}
          {generatedResult && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-[#E91E8C]">Generated Draft:</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {generatedResult}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="flex-1 min-h-[40px] py-2 px-4 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Polishing...' : 'Generate with Rose AI'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
