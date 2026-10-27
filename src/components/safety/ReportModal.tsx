import React, { useState } from 'react';
import { Flag, X, ShieldAlert, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReportModal: React.FC = () => {
  const { reportingTarget, setReportingTarget, reportItem, showToast } = useApp();
  const [selectedReason, setSelectedReason] = useState('Harassment or Bullying');

  if (!reportingTarget || !reportingTarget.isOpen) return null;

  const reasons = [
    'Harassment or Bullying',
    'Hate Speech or Discrimination',
    'Spam, Bots or Phishing',
    'Impersonation or Fake Account',
    'Copyright or IP Infringement',
    'Sensitive or Inappropriate Content',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportItem(reportingTarget.type, reportingTarget.id, selectedReason);
    setReportingTarget(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#17131A] rounded-2xl w-full max-w-sm p-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <Flag className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Report {reportingTarget.type === 'post' ? 'Post' : 'User'}
            </h3>
          </div>
          <button
            onClick={() => setReportingTarget(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Help maintain community trust. Aura safety reviews reported content against our community standards.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            {reasons.map((r) => (
              <label
                key={r}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                  selectedReason === r
                    ? 'border-[#E91E8C] bg-[#FCE7F3]/40 dark:bg-[#BE185D]/20 text-[#BE185D] dark:text-[#FCE7F3] font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{r}</span>
                <input
                  type="radio"
                  name="reportReason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="w-4 h-4 accent-[#E91E8C]"
                />
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReportingTarget(null)}
              className="flex-1 min-h-[44px] py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
