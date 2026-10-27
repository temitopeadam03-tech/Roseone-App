import React from 'react';
import { ShieldAlert, X, CheckCircle, Ban, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ModerationDashboardModal: React.FC = () => {
  const {
    moderationModalOpen,
    setModerationModalOpen,
    reportedItems,
    resolveModerationReport,
    showToast,
  } = useApp();

  if (!moderationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Moderation & Safety Center
              </h3>
              <p className="text-[11px] text-slate-500">Live review queue & audit logs</p>
            </div>
          </div>
          <button
            onClick={() => setModerationModalOpen(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {reportedItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Moderation Queue Clear
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Zero outstanding flags or policy violations. You can test reporting any post from the feed.
              </p>
            </div>
          ) : (
            reportedItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {item.targetType}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Reason: {item.reason}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Flagged by @{item.reporterHandle} · {item.timestamp}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {item.targetId}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                  <button
                    onClick={() => resolveModerationReport(item.id, 'dismiss')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => resolveModerationReport(item.id, 'delete_content')}
                    className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                  >
                    Take Down
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
