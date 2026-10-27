import React, { useState } from 'react';
import {
  Users,
  Hash,
  Lock,
  Globe,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Community } from '../../types';
import { CommunityDashboard } from './CommunityDashboard';

export const CommunitiesView: React.FC = () => {
  const {
    communities,
    activeCommunityId,
    setActiveCommunityId,
    joinCommunity,
    leaveCommunity,
    isCreateCommunityOpen,
    setIsCreateCommunityOpen,
    createCommunityInitialType,
    openCreateCommunity,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'communities' | 'groups' | 'joined'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const activeCommunity = communities.find((c) => c.id === activeCommunityId);

  // If a community is selected, render the rich dashboard!
  if (activeCommunity) {
    return (
      <CommunityDashboard
        community={activeCommunity}
        onBack={() => setActiveCommunityId(null)}
      />
    );
  }

  // Filtered communities list
  const filtered = communities.filter((comm) => {
    if (!comm) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (comm.name || '').toLowerCase().includes(q) ||
      (comm.description || '').toLowerCase().includes(q) ||
      ((comm.category || '').toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterType === 'communities') return comm.type !== 'group';
    if (filterType === 'groups') return comm.type === 'group';
    if (filterType === 'joined') return comm.isJoined;

    if (selectedCategory !== 'All' && comm.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  const uniqueCategories = [
    'All',
    ...Array.from(new Set(communities.map((c) => c.category).filter(Boolean))),
  ];

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Banner & Creation Actions */}
      <div className="p-4 sm:p-6 bg-white dark:bg-[#161218] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/30 dark:text-[#FCE7F3] uppercase tracking-wider">
              Social Hubs & Guilds
            </span>
            <span className="text-xs text-slate-400">
              {communities.length} {communities.length === 1 ? 'Space' : 'Spaces'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Groups & Communities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Join interest-based groups or launch your own collaborative community with channels, rules, events, and optional admin AI.
          </p>
        </div>

        {/* Dual Actions: Create Group & Create Community */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => openCreateCommunity('group')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#E91E8C] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs"
          >
            <Users className="w-4 h-4 text-[#BE185D]" />
            <span>Create Group</span>
          </button>

          <button
            onClick={() => openCreateCommunity('community')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#BE185D] to-[#E91E8C] hover:from-[#9D174D] hover:to-[#BE185D] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[#E91E8C]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Community</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups and communities by title, keyword, or topic..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-[#E91E8C] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Spaces
          </button>
          <button
            onClick={() => setFilterType('joined')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'joined'
                ? 'bg-[#E91E8C] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            My Spaces
          </button>
          <button
            onClick={() => setFilterType('communities')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'communities'
                ? 'bg-[#E91E8C] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Communities
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'groups'
                ? 'bg-[#E91E8C] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Grid of Community & Group Cards */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#161218] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FCE7F3] dark:bg-[#BE185D]/20 text-[#BE185D] dark:text-[#FCE7F3] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No matching spaces found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No spaces match "${searchQuery}". Try a different keyword or start a new space.`
              : 'Be the first to launch a community or group on RoseOne.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => openCreateCommunity('community')}
              className="px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Community</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((comm) => (
            <div
              key={comm.id}
              className="bg-white dark:bg-[#161218] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:border-[#E91E8C]/40 transition-all flex flex-col justify-between group"
            >
              {/* Card Banner Cover */}
              <div className="relative h-28 w-full bg-gradient-to-r from-[#BE185D]/80 to-[#E91E8C]/80 overflow-hidden">
                {comm.coverImage ? (
                  <img
                    src={comm.coverImage}
                    alt={comm.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#BE185D] via-[#E91E8C] to-[#FCE7F3]" />
                )}

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  {comm.isPrivate ? (
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                  {comm.category && (
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold">
                      {comm.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 -mt-9 mb-2.5">
                    {comm.avatar ? (
                      <img
                        src={comm.avatar}
                        alt={comm.name}
                        className="w-14 h-14 rounded-2xl object-cover border-3 border-white dark:border-[#161218] shadow-md shrink-0 bg-white dark:bg-[#161218]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#BE185D] to-[#E91E8C] text-white flex items-center justify-center font-bold text-lg border-3 border-white dark:border-[#161218] shadow-md shrink-0">
                        {comm.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="pt-5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {comm.name}
                        </h3>
                        {comm.type === 'group' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 shrink-0">
                            GROUP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {comm.membersCount} {comm.membersCount === 1 ? 'member' : 'members'} ·{' '}
                        {comm.channels.length} channels
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {comm.description}
                  </p>

                  {/* Channel preview badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {comm.channels.slice(0, 3).map((ch) => (
                      <span
                        key={ch}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1"
                      >
                        <Hash className="w-2.5 h-2.5 text-[#E91E8C]" />
                        <span>{ch}</span>
                      </span>
                    ))}
                    {comm.channels.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{comm.channels.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Row */}
                <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                  <button
                    onClick={() => setActiveCommunityId(comm.id)}
                    className="text-xs font-bold text-[#BE185D] dark:text-[#FCE7F3] hover:underline flex items-center gap-1"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      comm.isJoined ? leaveCommunity(comm.id) : joinCommunity(comm.id)
                    }
                    className={`min-h-[34px] px-4 py-1 rounded-xl text-xs font-bold transition-all ${
                      comm.isJoined
                        ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600'
                        : 'bg-[#E91E8C] text-white hover:bg-[#BE185D] shadow-xs'
                    }`}
                  >
                    {comm.isJoined ? 'Joined ✓' : 'Join'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
