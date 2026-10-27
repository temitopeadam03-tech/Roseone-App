import React, { useState } from 'react';
import {
  X,
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  Calendar,
  UserPlus,
  UserCheck,
  MessageCircle,
  Clock,
  Lock,
  Flag,
  VolumeX,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { PostCard } from '../feed/PostCard';

export const UserProfileModal: React.FC = () => {
  const {
    viewingUser,
    setViewingUser,
    currentUser,
    posts,
    toggleFollowUser,
    startNewConversation,
    muteUser,
    setReportingTarget,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');

  if (!viewingUser) return null;

  const isMe = viewingUser.id === currentUser.id;
  const isFollowing = currentUser.following?.includes(viewingUser.id);
  const userPosts = posts.filter((p) => p.author?.id === viewingUser.id);
  const mediaPosts = userPosts.filter((p) => Array.isArray(p.media) && p.media.length > 0);

  const handleShare = () => {
    const url = `${window.location.origin}/@${viewingUser.handle}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Profile link copied: ${url}`, 'success');
    }
  };

  const handleOpenChat = () => {
    startNewConversation(viewingUser.name, viewingUser.handle);
    setViewingUser(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Cover & Close */}
        <div className="relative h-28 sm:h-36 w-full bg-gradient-to-r from-[#BE185D] via-[#E91E8C] to-[#FCE7F3] shrink-0">
          {viewingUser.banner && (
            <img
              src={viewingUser.banner}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={() => setViewingUser(null)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Info Header */}
        <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex justify-between items-end -mt-9 mb-2.5">
            <Avatar
              src={viewingUser.avatar}
              name={viewingUser.name}
              size="lg"
              className="border-4 border-white dark:border-[#17131A] shadow-md bg-white"
            />

            {!isMe && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#E91E8C]"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleOpenChat}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#E91E8C] hover:text-[#E91E8C] flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#E91E8C]" />
                  <span>Message</span>
                </button>
                <button
                  onClick={() => toggleFollowUser(viewingUser.id)}
                  className={`min-h-[34px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                    isFollowing
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600'
                      : viewingUser.isRequested
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                      : 'bg-[#E91E8C] hover:bg-[#BE185D] text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Following</span>
                    </>
                  ) : viewingUser.isRequested ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Requested</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{viewingUser.isPrivate ? 'Request to Follow' : 'Follow'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-0.5 mb-2">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {viewingUser.name}
              </h2>
              {viewingUser.verified && (
                <BadgeCheck className="w-4 h-4 text-[#E91E8C] fill-[#E91E8C]/20" />
              )}
            </div>
            <p className="text-xs text-slate-500">@{viewingUser.handle}</p>
          </div>

          {viewingUser.bio && (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2.5">
              {viewingUser.bio}
            </p>
          )}

          {/* Details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            {viewingUser.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#E91E8C]" />
                <span>{viewingUser.location}</span>
              </div>
            )}
            {viewingUser.website && (
              <div className="flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-[#E91E8C]" />
                <a
                  href={viewingUser.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#BE185D] dark:text-[#FCE7F3] hover:underline"
                >
                  {viewingUser.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{viewingUser.joinedDate}</span>
            </div>
          </div>

          {/* Real Counter Stats */}
          <div className="flex items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <div>
              <strong className="font-bold text-slate-900 dark:text-white tabular-nums">
                {userPosts.length}
              </strong>{' '}
              <span className="text-slate-500">Posts</span>
            </div>
            <div>
              <strong className="font-bold text-slate-900 dark:text-white tabular-nums">
                {viewingUser.followersCount}
              </strong>{' '}
              <span className="text-slate-500">Followers</span>
            </div>
            <div>
              <strong className="font-bold text-slate-900 dark:text-white tabular-nums">
                {viewingUser.followingCount}
              </strong>{' '}
              <span className="text-slate-500">Following</span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-[#141017]">
          {/* If private and not following */}
          {viewingUser.isPrivate && !isFollowing && !isMe ? (
            <div className="py-12 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <Lock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                This Account is Private
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Follow this account to see their photos, clips, and community posts.
              </p>
              <button
                onClick={() => toggleFollowUser(viewingUser.id)}
                className="mt-3.5 px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                {viewingUser.isRequested ? 'Requested' : 'Request to Follow'}
              </button>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="py-10 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No posts published yet
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                When @{viewingUser.handle} shares a post, it will appear here.
              </p>
            </div>
          ) : (
            userPosts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>

        {/* Footer Actions */}
        {!isMe && (
          <div className="px-4 py-2.5 bg-white dark:bg-[#17131A] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => {
                muteUser(viewingUser.id);
                setViewingUser(null);
              }}
              className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mute</span>
            </button>
            <button
              onClick={() => {
                setReportingTarget({
                  isOpen: true,
                  type: 'user',
                  id: viewingUser.id,
                  name: viewingUser.name,
                });
                setViewingUser(null);
              }}
              className="flex items-center gap-1 text-rose-500 hover:text-rose-600"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
