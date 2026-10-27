import React from 'react';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../feed/PostCard';

export const SavedView: React.FC = () => {
  const { posts, setActiveView } = useApp();
  const savedPosts = posts.filter((p) => p.isSaved);

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="p-3.5 bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('feed')}
            className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Saved Posts & Collections
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {savedPosts.length} saved bookmarks
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {savedPosts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#17131A] rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No saved posts yet
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tap the bookmark icon on any post in your feed to save it here for later.
            </p>
          </div>
        ) : (
          savedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
};
