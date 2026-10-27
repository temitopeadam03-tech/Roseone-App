import React from 'react';
import { Search, TrendingUp, Users, Plus, Hash } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DesktopRightPanel: React.FC = () => {
  const {
    posts,
    setActiveTab,
    setActiveView,
    communities,
    setActiveCommunityId,
    openCreateCommunity,
  } = useApp();

  // Extract genuine hashtags from real user posts
  const realTagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    p.tags?.forEach((tag) => {
      const clean = tag.replace(/^#/, '');
      realTagCounts[clean] = (realTagCounts[clean] || 0) + 1;
    });
  });

  const trendingTags = Object.entries(realTagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <aside className="w-72 xl:w-80 sticky top-14 h-[calc(100vh-3.5rem)] py-4 pl-2 space-y-4 shrink-0 overflow-y-auto no-scrollbar select-none">
      {/* Search trigger */}
      <div
        onClick={() => {
          setActiveView('feed');
          setActiveTab('explore');
        }}
        className="p-3 bg-white dark:bg-[#17131A] border border-slate-200/80 dark:border-slate-800 hover:border-[#E91E8C] rounded-2xl flex items-center gap-2.5 text-xs text-slate-500 cursor-pointer transition-colors shadow-xs"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span>Search RoseOne...</span>
      </div>

      {/* Trending Box - Genuine Real Data */}
      <div className="p-4 bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#E91E8C]" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Trending on RoseOne
          </h3>
        </div>

        {trendingTags.length === 0 ? (
          <div className="py-2 text-center">
            <p className="text-xs text-slate-500 font-medium mb-2.5">Suggested Topics</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {['photography', 'design', 'creatives', 'mobiledev'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setActiveView('feed');
                    setActiveTab('explore');
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#FCE7F3] dark:hover:bg-[#BE185D]/20 hover:text-[#BE185D] dark:hover:text-[#FCE7F3] transition-colors"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {trendingTags.map(([tag, count]) => (
              <div
                key={tag}
                onClick={() => {
                  setActiveView('feed');
                  setActiveTab('explore');
                }}
                className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-xl cursor-pointer transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-[#E91E8C]">
                  #{tag}
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {count} {count === 1 ? 'post' : 'posts'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Communities Box */}
      <div className="p-4 bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#BE185D]" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Communities
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateCommunity('community')}
              className="text-[11px] text-[#BE185D] dark:text-[#FCE7F3] font-bold hover:underline"
              title="Create new community or group"
            >
              + Create
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => {
                setActiveCommunityId(null);
                setActiveView('communities');
              }}
              className="text-[11px] text-[#BE185D] dark:text-[#FCE7F3] font-semibold hover:underline"
            >
              Explore
            </button>
          </div>
        </div>

        {communities.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-xs text-slate-500 font-medium">No communities joined yet</p>
            <button
              onClick={() => openCreateCommunity('community')}
              className="mt-2 text-xs font-bold text-[#E91E8C] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Space</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {communities.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setActiveCommunityId(c.id);
                  setActiveView('communities');
                }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {c.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {c.membersCount} members · {c.type === 'group' ? 'Group' : 'Community'}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#E91E8C] px-2 py-0.5 rounded-lg bg-[#FCE7F3] dark:bg-[#BE185D]/30 shrink-0">
                  Open
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiet Footer Links */}
      <footer className="px-2 text-[11px] text-slate-400 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span>Terms</span>
          <span>·</span>
          <span>Privacy Policy</span>
          <span>·</span>
          <span>Community Standards</span>
        </div>
        <p>© 2026 RoseOne Inc. All rights reserved.</p>
      </footer>
    </aside>
  );
};
