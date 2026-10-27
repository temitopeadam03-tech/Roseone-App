import React, { useState } from 'react';
import {
  X,
  Repeat2,
  Quote,
  Sparkles,
  Share2,
  Copy,
  BadgeCheck,
  Globe,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const ReshareModal: React.FC = () => {
  const {
    reshareModalPost,
    setReshareModalPost,
    resharePostWithQuote,
    toggleRepostPost,
    createStory,
    currentUser,
    showToast,
  } = useApp();

  const [quoteCaption, setQuoteCaption] = useState('');
  const [mode, setMode] = useState<'quote' | 'options'>('quote');
  const [audience, setAudience] = useState<'public' | 'followers'>('public');

  if (!reshareModalPost) return null;

  const originalPost = reshareModalPost;

  const handleQuickRepost = () => {
    toggleRepostPost(originalPost.id);
    setReshareModalPost(null);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resharePostWithQuote(originalPost.id, quoteCaption.trim());
    setQuoteCaption('');
    setReshareModalPost(null);
  };

  const handleShareToStory = () => {
    const storyText = `Shared post from @${originalPost.author.handle}: "${originalPost.content.slice(0, 100)}${originalPost.content.length > 100 ? '...' : ''}"`;
    createStory(
      originalPost.media && originalPost.media[0] ? 'photo' : 'text',
      originalPost.media && originalPost.media[0] ? originalPost.media[0] : '',
      `Post by @${originalPost.author.handle}`,
      storyText,
      'bg-gradient-to-tr from-[#BE185D] via-[#E91E8C] to-[#831843]',
      'everyone',
      originalPost.media && originalPost.media[0] ? originalPost.media[0] : originalPost.author.avatar
    );
    setReshareModalPost(null);
    showToast('Post shared to your Rose Story for 24 hours!', 'success');
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${originalPost.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      showToast('Post link copied to clipboard!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Repeat2 className="w-5 h-5 text-[#E91E8C]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reshare Post
            </h3>
          </div>
          <button
            onClick={() => setReshareModalPost(null)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Pills */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={handleQuickRepost}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#17131A] border border-slate-200 dark:border-slate-700 hover:border-[#E91E8C] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Repeat2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Quick Repost</span>
          </button>

          <button
            onClick={handleShareToStory}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#17131A] border border-slate-200 dark:border-slate-700 hover:border-[#E91E8C] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Add to Story (24h)</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#17131A] border border-slate-200 dark:border-slate-700 hover:border-[#E91E8C] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-500" />
            <span>Copy Link</span>
          </button>
        </div>

        {/* Content Body: Quote Composer */}
        <form onSubmit={handleQuoteSubmit} className="p-4 space-y-3.5 overflow-y-auto max-h-[70vh]">
          {/* User's commentary */}
          <div className="flex items-start gap-3">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <div className="flex-1 space-y-2">
              <textarea
                value={quoteCaption}
                onChange={(e) => setQuoteCaption(e.target.value)}
                placeholder="Add your thoughts / commentary..."
                rows={3}
                className="w-full text-xs sm:text-sm bg-transparent placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none resize-none"
                autoFocus
              />

              {/* Privacy selector */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAudience(audience === 'public' ? 'followers' : 'public')}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  {audience === 'public' ? (
                    <>
                      <Globe className="w-3 h-3 text-[#E91E8C]" />
                      <span>Anyone can view</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 text-indigo-500" />
                      <span>Followers only</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Embedded Original Post Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Avatar src={originalPost.author.avatar} name={originalPost.author.name} size="xs" />
              <div className="flex items-center gap-1 leading-none flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {originalPost.author.name}
                </span>
                {originalPost.author.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-[#E91E8C] fill-[#E91E8C]/20" />
                )}
                <span className="text-[11px] text-slate-400">@{originalPost.author.handle}</span>
                <span className="text-[11px] text-slate-400">· {originalPost.createdAt}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {originalPost.content}
            </p>

            {originalPost.media && originalPost.media.length > 0 && (
              <div className="rounded-xl overflow-hidden max-h-40 border border-slate-200/60 dark:border-slate-800">
                <img
                  src={originalPost.media[0]}
                  alt="Original media"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setReshareModalPost(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white shadow-md shadow-[#E91E8C]/20 transition-all flex items-center gap-1.5"
            >
              <Repeat2 className="w-4 h-4" />
              <span>Reshare Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
