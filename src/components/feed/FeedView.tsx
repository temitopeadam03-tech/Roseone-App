import React, { useState, useRef } from 'react';
import {
  Plus,
  Image,
  BarChart2,
  Sparkles,
  Layers,
  PlusCircle,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from './PostCard';
import { Avatar } from '../ui/Avatar';

export const FeedView: React.FC = () => {
  const {
    currentUser,
    posts,
    stories,
    setCreatePostModalOpen,
    setCreateStoryModalOpen,
    setActiveStoryIndex,
    setAiAssistantModalOpen,
    refreshData,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'for-you' | 'following' | 'media'>('for-you');

  // Pull-to-refresh mobile gesture handling
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const hasVibrated = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only initiate pull-to-refresh if scroll is at top
    if (window.scrollY <= 4) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    if (deltaY > 0 && window.scrollY <= 4) {
      // Natural rubber-band resistance curve
      const distance = Math.min(Math.pow(deltaY, 0.82) * 1.55, 96);
      setPullDistance(distance);
      setIsPulling(true);

      // Tactile haptic feedback when crossing release threshold (62px)
      if (distance >= 62 && !hasVibrated.current) {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(15);
          } catch {}
        }
        hasVibrated.current = true;
      } else if (distance < 62) {
        hasVibrated.current = false;
      }
    } else if (isPulling) {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    setPullDistance(56);
    const start = Date.now();
    try {
      await refreshData();
    } catch (err) {
      console.warn('Feed refresh error:', err);
    } finally {
      const elapsed = Date.now() - start;
      const remainingWait = Math.max(0, 650 - elapsed);
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        hasVibrated.current = false;
      }, remainingWait);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsPulling(false);

    if (pullDistance >= 62) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      hasVibrated.current = false;
    }
  };

  // Filter posts safely
  const filteredPosts = posts.filter((post) => {
    if (!post || !post.author) return false;
    if (activeFilter === 'following') {
      return post.author.isFollowing || post.author.id === currentUser?.id;
    }
    if (activeFilter === 'media') {
      return Array.isArray(post.media) && post.media.length > 0;
    }
    return true; // for-you default
  });

  return (
    <div
      className="space-y-3 pb-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Mobile Pull-to-Refresh Gesture Visual Indicator */}
      <div
        className="w-full flex items-center justify-center overflow-hidden transition-all ease-out pointer-events-none"
        style={{
          height: isPulling ? `${pullDistance}px` : isRefreshing ? '56px' : '0px',
          opacity: isPulling ? Math.min(pullDistance / 35, 1) : isRefreshing ? 1 : 0,
          transition: isPulling
            ? 'none'
            : 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        }}
      >
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-[#1A1420]/95 backdrop-blur-md border border-[#E91E8C]/30 text-[#E91E8C] shadow-lg mb-1">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#E91E8C]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Updating feed...
              </span>
            </>
          ) : (
            <>
              <div
                className="transition-transform duration-150 flex items-center justify-center"
                style={{
                  transform: `rotate(${Math.min(pullDistance * 3.2, 180)}deg)`,
                }}
              >
                <ArrowDown className="w-4 h-4 stroke-[2.5] text-[#E91E8C]" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {pullDistance >= 62 ? 'Release to refresh' : 'Pull down to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stories Rail */}
      <div className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-1 px-1">
          {/* Current User Story Circle / Add Trigger */}
          {(() => {
            const myStoryIdx = stories.findIndex((s) => s.userId === currentUser.id);
            const myStory = myStoryIdx >= 0 ? stories[myStoryIdx] : null;

            if (myStory) {
              return (
                <div className="flex flex-col items-center shrink-0 group relative">
                  <button
                    onClick={() => setActiveStoryIndex(myStoryIdx)}
                    className="flex flex-col items-center focus:outline-none"
                    title="View your active story"
                  >
                    <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#BE185D] via-[#E91E8C] to-[#F472B6] ring-2 ring-[#E91E8C] ring-offset-2 ring-offset-white dark:ring-offset-[#17131A] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-[#17131A] overflow-hidden flex items-center justify-center">
                        <img
                          src={myStory.storyThumbnail || myStory.userAvatar}
                          alt={myStory.userName || 'Your Story'}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = currentUser.avatar;
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#E91E8C] mt-1.5 truncate max-w-[72px] text-center">
                      Your Story
                    </span>
                  </button>
                  {/* Quick Add Another Story Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateStoryModalOpen(true);
                    }}
                    className="absolute bottom-5 right-0 w-5 h-5 rounded-full bg-[#E91E8C] hover:bg-[#BE185D] text-white flex items-center justify-center border-2 border-white dark:border-[#17131A] shadow-md hover:scale-110 transition-transform z-10"
                    title="Add another story"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              );
            }

            return (
              <button
                onClick={() => setCreateStoryModalOpen(true)}
                className="flex flex-col items-center shrink-0 group focus:outline-none"
                title="Add a 24-hour story"
              >
                <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-[#E91E8C] flex items-center justify-center p-[2.5px] group-hover:scale-105 transition-transform bg-[#FCE7F3]/30 dark:bg-[#BE185D]/10">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#E91E8C] text-white flex items-center justify-center border-2 border-white dark:border-[#17131A] shadow-md">
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 truncate max-w-[72px] text-center">
                  Add Story
                </span>
              </button>
            );
          })()}

          {/* Genuine Active Stories List from other users */}
          {stories
            .map((story, originalIdx) => ({ story, originalIdx }))
            .filter(({ story }) => story.userId !== currentUser.id)
            .map(({ story, originalIdx }) => {
              const displayImage = story.storyThumbnail || story.userAvatar;
              const hasUnviewed = !story.isViewed;

              return (
                <button
                  key={story.id}
                  onClick={() => setActiveStoryIndex(originalIdx)}
                  className="flex flex-col items-center shrink-0 group focus:outline-none"
                  title={`View story by ${story.userName || 'user'}`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs ${
                      hasUnviewed
                        ? 'p-[2.5px] bg-gradient-to-tr from-[#BE185D] via-[#E91E8C] to-[#F472B6] ring-2 ring-[#E91E8C] ring-offset-2 ring-offset-white dark:ring-offset-[#17131A]'
                        : 'p-[2.5px] border-2 border-slate-300 dark:border-slate-700 opacity-80'
                    }`}
                  >
                    <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-[#17131A] overflow-hidden flex items-center justify-center">
                      <img
                        src={displayImage}
                        alt={story.userName || 'Story'}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = story.userAvatar;
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1.5 truncate max-w-[72px] text-center">
                    {(story.userName || 'User').split(' ')[0]}
                  </span>
                </button>
              );
            })}

          {/* Clean helper indicator when only the user's story or no other stories exist */}
          {stories.filter((s) => s.userId !== currentUser.id).length === 0 && (
            <div className="hidden sm:flex items-center pl-3 text-xs text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-slate-800/80 my-auto py-1">
              <span>Stories shared by followed creators appear here for 24h.</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Composer Box */}
      <div className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="flex-1 min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-left text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors"
          >
            What's happening on RoseOne?
          </button>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCreatePostModalOpen(true)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#FCE7F3]/40 dark:hover:bg-[#BE185D]/20 hover:text-[#BE185D] transition-colors"
            >
              <Image className="w-4 h-4 text-[#E91E8C]" />
              <span className="hidden sm:inline">Photo</span>
            </button>
            <button
              onClick={() => setCreatePostModalOpen(true)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#FCE7F3]/40 dark:hover:bg-[#BE185D]/20 hover:text-[#BE185D] transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Poll</span>
            </button>
            <button
              onClick={() => setAiAssistantModalOpen(true)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#FCE7F3]/40 dark:hover:bg-[#BE185D]/20 hover:text-[#BE185D] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Rose AI</span>
            </button>
          </div>

          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="min-h-[34px] px-4 py-1.5 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Post
          </button>
        </div>
      </div>

      {/* Segmented Filter Control & Refresh Button */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-1 flex-1">
          {[
            { id: 'for-you', label: 'For You' },
            { id: 'following', label: 'Following' },
            { id: 'media', label: 'Media' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`flex-1 min-h-[34px] py-1 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === tab.id
                  ? 'bg-white dark:bg-[#17131A] text-[#BE185D] dark:text-[#FCE7F3] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Manual Refresh Trigger */}
        <button
          onClick={() => triggerRefresh()}
          disabled={isRefreshing}
          className="min-h-[34px] px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-[#BE185D] hover:bg-slate-200/50 dark:hover:bg-slate-700/50 flex items-center gap-1.5 transition-all disabled:opacity-60"
          title="Refresh feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E91E8C]' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Feed Posts */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No posts yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Share your first post with the community. Photos, polls, and ideas will appear here.
            </p>
            <button
              onClick={() => setCreatePostModalOpen(true)}
              className="mt-4 px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish First Post</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
};
