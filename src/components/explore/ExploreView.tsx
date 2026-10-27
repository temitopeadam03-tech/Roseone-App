import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  Video,
  Compass,
  Users,
  Film,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from '../feed/PostCard';
import { Avatar } from '../ui/Avatar';

export const ExploreView: React.FC = () => {
  const {
    posts,
    allUsers,
    currentUser,
    toggleFollowUser,
    openUserProfile,
    setCreatePostModalOpen,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'trending' | 'videos' | 'creators'>('top');

  // Extract real tags from actual user posts
  const realTagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    p.tags?.forEach((tag) => {
      const clean = tag.replace(/^#/, '');
      realTagCounts[clean] = (realTagCounts[clean] || 0) + 1;
    });
  });

  const trendingTags = Object.entries(realTagCounts).sort((a, b) => b[1] - a[1]);

  // Search filtering over real posts safely
  const q = searchQuery.toLowerCase().trim();
  const matchingPosts = posts.filter((p) => {
    if (!p) return false;
    if (!q) return true;
    const matchContent = (p.content || '').toLowerCase().includes(q);
    const matchName = (p.author?.name || '').toLowerCase().includes(q);
    const matchHandle = (p.author?.handle || '').toLowerCase().includes(q);
    const matchTags = Array.isArray(p.tags) && p.tags.some((t) => (t || '').toLowerCase().includes(q));
    return matchContent || matchName || matchHandle || matchTags;
  });

  // Creators: all platform users except current logged in user
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);

  return (
    <div className="space-y-3 pb-8">
      {/* Search Header */}
      <div className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, hashtags, or creators on RoseOne..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'top', label: 'Top' },
            { id: 'trending', label: 'Trending' },
            { id: 'videos', label: 'Videos & Clips' },
            { id: 'creators', label: 'Creators' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-h-[34px] py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Tab - Genuine Empty State */}
      {activeTab === 'videos' ? (
        <div className="p-10 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Film className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No video clips published yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload your first video clip to reach the community and appear in discovery feeds.
          </p>
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="mt-3.5 px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Media</span>
          </button>
        </div>
      ) : activeTab === 'creators' ? (
        /* Creators Tab - Genuine Members */
        <div className="space-y-3">
          {otherUsers.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No creator profiles yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                As creators join RoseOne, their profiles will appear here for you to connect with.
              </p>
            </div>
          ) : (
            otherUsers.map((creator) => {
              const isFollowing = currentUser.following?.includes(creator.id);
              return (
                <div
                  key={creator.id}
                  className="p-3.5 bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <button
                    onClick={() => openUserProfile(creator)}
                    className="flex items-center gap-3 min-w-0 text-left focus:outline-none flex-1"
                  >
                    <Avatar src={creator.avatar} name={creator.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate hover:underline">
                          {creator.name}
                        </h4>
                        {creator.verified && (
                          <span className="text-[10px] text-[#E91E8C] font-bold">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">@{creator.handle}</p>
                      {creator.bio && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          {creator.bio}
                        </p>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => toggleFollowUser(creator.id)}
                    className={`min-h-[34px] px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                        : 'bg-[#E91E8C] hover:bg-[#BE185D] text-white shadow-xs'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Top / Trending View */
        <div className="space-y-3">
          {/* Trending hashtags strip */}
          <div className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 shadow-xs">
            <div className="flex items-center gap-2 mb-2.5">
              <TrendingUp className="w-4 h-4 text-[#E91E8C]" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Trending on RoseOne
              </h3>
            </div>

            {trendingTags.length === 0 ? (
              <div className="py-1">
                <p className="text-xs text-slate-500 mb-2">Explore popular topics:</p>
                <div className="flex flex-wrap gap-2">
                  {['photography', 'design', 'creatives', 'mobiledev', 'audio', 'tokyo'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSearchQuery(topic)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FCE7F3] dark:hover:bg-[#BE185D]/20 text-slate-700 dark:text-slate-300 hover:text-[#BE185D] dark:hover:text-[#FCE7F3] rounded-xl text-xs font-semibold transition-colors"
                    >
                      #{topic}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {trendingTags.map(([tag, count]) => (
                  <div
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#E91E8C]">
                      #{tag}
                    </span>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {count} {count === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Posts Feed for Explore */}
          <div className="space-y-3">
            {matchingPosts.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <Compass className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {searchQuery ? 'No matching posts found' : 'No posts in discovery'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No results found for "${searchQuery}". Try a different keyword.`
                    : 'Posts shared with the community will appear here for discovery.'}
                </p>
              </div>
            ) : (
              matchingPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
