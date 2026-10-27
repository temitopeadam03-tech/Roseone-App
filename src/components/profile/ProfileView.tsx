import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Link as LinkIcon,
  BadgeCheck,
  Edit3,
  Bookmark,
  Heart,
  Grid,
  Image as ImageIcon,
  Camera,
  Upload,
  Share2,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../feed/PostCard';
import { Avatar } from '../ui/Avatar';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateCurrentUser,
    posts,
    setEditProfileModalOpen,
    setCreatePostModalOpen,
    uploadMedia,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'saved' | 'likes'>('posts');

  const myPosts = posts.filter((p) => p.author.id === currentUser.id);
  const mediaPosts = posts.filter((p) => p.author.id === currentUser.id && p.media && p.media.length > 0);
  const savedPosts = posts.filter((p) => p.isSaved);
  const likedPosts = posts.filter((p) => p.isLiked);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          try {
            const url = await uploadMedia(reader.result, file.name);
            updateCurrentUser({ banner: url });
            showToast('Cover banner updated!', 'success');
          } catch {
            updateCurrentUser({ banner: reader.result as string });
            showToast('Cover banner updated!', 'success');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          try {
            const url = await uploadMedia(reader.result, file.name);
            updateCurrentUser({ avatar: url });
            showToast('Profile photo updated!', 'success');
          } catch {
            updateCurrentUser({ avatar: reader.result as string });
            showToast('Profile photo updated!', 'success');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/@${currentUser.handle}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      showToast(`Profile link copied: ${profileUrl}`, 'success');
    }
  };

  const renderActiveTabContent = () => {
    let list = myPosts;
    let emptyTitle = 'No posts yet';
    let emptySubtitle = 'Share your first post with the community.';

    if (activeTab === 'media') {
      list = mediaPosts;
      emptyTitle = 'No media uploaded yet';
      emptySubtitle = 'Photos you share in posts or stories will appear here.';
    } else if (activeTab === 'saved') {
      list = savedPosts;
      emptyTitle = 'No saved posts';
      emptySubtitle = 'Bookmark posts from your feed to view them here.';
    } else if (activeTab === 'likes') {
      list = likedPosts;
      emptyTitle = 'No liked posts yet';
      emptySubtitle = 'Like posts in your feed to see them here.';
    }

    if (list.length === 0) {
      return (
        <div className="p-8 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {emptyTitle}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {emptySubtitle}
          </p>
          {activeTab === 'posts' && (
            <button
              onClick={() => setCreatePostModalOpen(true)}
              className="mt-3.5 px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Profile Card */}
      <div className="bg-white dark:bg-[#17131A] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-[#BE185D] via-[#E91E8C] to-[#FCE7F3] overflow-hidden group">
          {currentUser.banner ? (
            <img
              src={currentUser.banner}
              alt="Profile Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#BE185D]/70 via-[#E91E8C]/60 to-[#FCE7F3]/80 flex items-center justify-center text-white/50 text-xs font-medium" />
          )}

          <label className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all">
            <Camera className="w-3.5 h-3.5" />
            <span>Edit Cover</span>
            <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          </label>
        </div>

        {/* Profile Info Header */}
        <div className="px-4 sm:px-5 pb-4">
          <div className="flex justify-between items-end -mt-10 sm:-mt-12 mb-3">
            {/* Avatar with neutral fallback and real upload trigger */}
            <div className="relative group">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                size="xl"
                className="border-4 border-white dark:border-[#17131A] shadow-md bg-white"
              />
              <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareProfile}
                title="Share Profile URL"
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#E91E8C] hover:border-[#E91E8C] flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={() => setEditProfileModalOpen(true)}
                className="min-h-[38px] px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-[#E91E8C] hover:text-[#E91E8C] flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Name & Handle */}
          <div className="space-y-0.5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              {currentUser.verified && (
                <BadgeCheck className="w-4 h-4 text-[#E91E8C] fill-[#E91E8C]/20" />
              )}
            </div>
            <p className="text-xs text-slate-500">@{currentUser.handle}</p>
          </div>

          {/* Bio (shows prompt to add if empty) */}
          {currentUser.bio ? (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3 whitespace-pre-line">
              {currentUser.bio}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic mb-3">
              No biography yet. Tap "Edit Profile" to tell the community about yourself.
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
            {currentUser.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E91E8C]" />
                <span>{currentUser.location}</span>
              </div>
            )}
            {currentUser.website && (
              <div className="flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-[#E91E8C]" />
                <a
                  href={currentUser.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#BE185D] dark:text-[#FCE7F3] hover:underline"
                >
                  {currentUser.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentUser.joinedDate}</span>
            </div>
          </div>

          {/* Genuine Real Stats */}
          <div className="flex items-center gap-6 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <strong className="font-bold text-slate-900 dark:text-white tabular-nums">
                {myPosts.length}
              </strong>{' '}
              <span className="text-slate-500">Posts</span>
            </div>
            <div>
              <strong className="font-bold text-slate-900 dark:text-white tabular-nums">
                {currentUser.followersCount}
              </strong>{' '}
              <span className="text-slate-500">Followers</span>
            </div>
            <div>
              <strong className="font-bold text-slate-900 dark:text-white tabular-nums">
                {currentUser.followingCount}
              </strong>{' '}
              <span className="text-slate-500">Following</span>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="grid grid-cols-4 border-t border-slate-200/80 dark:border-slate-800">
          {[
            { id: 'posts', label: 'Posts', icon: <Grid className="w-4 h-4" /> },
            { id: 'media', label: 'Media', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'saved', label: 'Saved', icon: <Bookmark className="w-4 h-4" /> },
            { id: 'likes', label: 'Likes', icon: <Heart className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-[44px] py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#E91E8C] text-[#E91E8C]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Feed Content */}
      {renderActiveTabContent()}
    </div>
  );
};
