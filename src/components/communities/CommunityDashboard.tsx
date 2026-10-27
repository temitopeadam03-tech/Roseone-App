import React, { useState } from 'react';
import {
  Users,
  Hash,
  Lock,
  Globe,
  Plus,
  BookOpen,
  ArrowLeft,
  Settings,
  Shield,
  Bot,
  Calendar,
  Megaphone,
  Check,
  X,
  Share2,
  Copy,
  Pin,
  Trash2,
  UserPlus,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Send,
  MoreVertical,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Community, CommunityRule, User } from '../../types';
import { PostCard } from '../feed/PostCard';

interface CommunityDashboardProps {
  community: Community;
  onBack: () => void;
}

export const CommunityDashboard: React.FC<CommunityDashboardProps> = ({
  community,
  onBack,
}) => {
  const {
    currentUser,
    joinCommunity,
    leaveCommunity,
    switchCommunityChannel,
    posts,
    createPost,
    showToast,
    updateCommunity,
    deleteCommunity,
    approvePendingMember,
    rejectPendingMember,
    addCommunityAnnouncement,
    deleteCommunityAnnouncement,
    addCommunityEvent,
    toggleCommunityEventRsvp,
    togglePinPostInCommunity,
    addCommunityChannel,
    deleteCommunityChannel,
    addCommunityRule,
    deleteCommunityRule,
    assignMemberRole,
    removeMemberFromCommunity,
    communityDashboardTab,
    setCommunityDashboardTab,
  } = useApp();

  const isOwner = community.ownerId === currentUser.id || community.owner?.id === currentUser.id;
  const isAdmin = isOwner || community.admins?.some((a) => a.id === currentUser.id);
  const isModerator = isAdmin || community.moderators?.some((m) => m.id === currentUser.id);
  const isMember = community.isJoined;

  // Local state for tabs & interactions
  const [activeTab, setActiveTab] = useState<'feed' | 'announcements' | 'events' | 'members' | 'rules' | 'ai' | 'settings'>('feed');
  const [postContent, setPostContent] = useState('');

  // Modals inside dashboard
  const [isJoinRequestModalOpen, setIsJoinRequestModalOpen] = useState(false);
  const [joinAnswers, setJoinAnswers] = useState<Record<string, string>>({});
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtTime, setEvtTime] = useState('');
  const [evtLocation, setEvtLocation] = useState('');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'admins' | 'moderators' | 'members'>('all');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // AI interactive prompt test
  const [aiUserQuery, setAiUserQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Hello! I am ${community.aiAssistant?.botName || 'RoseBot'}, your community guide for ${community.name}. Feel free to ask me anything about our rules, active channels, or scheduled events!`,
    },
  ]);

  // Settings edit state
  const [editName, setEditName] = useState(community.name);
  const [editDesc, setEditDesc] = useState(community.description);
  const [editCategory, setEditCategory] = useState(community.category || 'Technology');
  const [editIsPrivate, setEditIsPrivate] = useState(community.isPrivate);
  const [editWhoCanJoin, setEditWhoCanJoin] = useState(community.whoCanJoin || 'anyone');
  const [editPostingApproval, setEditPostingApproval] = useState(community.postingApproval || 'instant');

  // Filter posts for this community
  const communityPosts = posts.filter((p) => p.communityId === community.id);
  const channelPosts = communityPosts.filter((p) => {
    // If post has a specific tag matching activeChannel or is generic
    return true;
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    createPost(
      postContent.trim(),
      undefined,
      undefined,
      [community.name, `#${community.activeChannel}`],
      community.id
    );
    setPostContent('');
  };

  const handleCopyInvite = () => {
    const link = community.inviteLink || `https://rosesocial.net/c/${community.slug}`;
    navigator.clipboard?.writeText(link);
    showToast('Community invite link copied to clipboard!', 'success');
  };

  // Handle request to join private community
  const handleSubmitJoinRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newPending = {
      user: currentUser,
      appliedAt: 'Just now',
      answers: joinAnswers,
    };
    updateCommunity(community.id, {
      pendingMembers: [...(community.pendingMembers || []), newPending],
    });
    setIsJoinRequestModalOpen(false);
    showToast('Membership request submitted to community admins!', 'success');
  };

  // Handle post announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    addCommunityAnnouncement(community.id, annTitle.trim(), annContent.trim());
    setAnnTitle('');
    setAnnContent('');
    setIsAnnouncementModalOpen(false);
  };

  // Handle create event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtDate.trim()) return;
    addCommunityEvent(community.id, {
      title: evtTitle.trim(),
      description: evtDesc.trim(),
      date: evtDate.trim(),
      time: evtTime.trim() || '18:00 UTC',
      location: evtLocation.trim() || 'Rose Spaces',
    });
    setEvtTitle('');
    setEvtDesc('');
    setEvtDate('');
    setEvtTime('');
    setEvtLocation('');
    setIsEventModalOpen(false);
  };

  // Handle add rule
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim()) return;
    addCommunityRule(community.id, ruleTitle.trim(), ruleDesc.trim());
    setRuleTitle('');
    setRuleDesc('');
    setIsRuleModalOpen(false);
  };

  // Handle add channel
  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    addCommunityChannel(community.id, newChannelName.trim());
    setNewChannelName('');
    setIsAddChannelModalOpen(false);
  };

  // Save settings updates
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommunity(community.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      category: editCategory,
      isPrivate: editIsPrivate,
      whoCanJoin: editWhoCanJoin,
      postingApproval: editPostingApproval,
    });
  };

  // AI Query handler
  const handleAiQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiUserQuery.trim()) return;
    const userQ = aiUserQuery.trim();
    setAiUserQuery('');

    setAiChatHistory((prev) => [...prev, { role: 'user', text: userQ }]);

    setTimeout(() => {
      let reply = `In ${community.name}, we follow our guidelines: `;
      if (userQ.toLowerCase().includes('rule') || userQ.toLowerCase().includes('guideline')) {
        reply = `Here is our key community rule: "${community.rules[0] ? (typeof community.rules[0] === 'string' ? community.rules[0] : community.rules[0].title) : 'Be respectful and kind.'}". Please ensure discussions remain constructive!`;
      } else if (userQ.toLowerCase().includes('event') || userQ.toLowerCase().includes('meetup')) {
        reply = community.events && community.events.length > 0
          ? `We have an upcoming event: "${community.events[0].title}" on ${community.events[0].date} at ${community.events[0].time} (${community.events[0].location}). You can RSVP directly in the Events tab!`
          : `There are no scheduled events at this moment. Stay tuned in #announcements!`;
      } else if (userQ.toLowerCase().includes('channel')) {
        reply = `We currently have ${community.channels.length} channels: ${community.channels.map((c) => `#${c}`).join(', ')}. Head to #general for general discussion or #showcase to share your work!`;
      } else {
        reply = `Thanks for asking! As the ${community.aiAssistant?.personality || 'welcoming'} assistant for ${community.name}, I am here to help you get the most out of our discussions. Check out our active channels or ask an admin if you need specific access.`;
      }
      setAiChatHistory((prev) => [...prev, { role: 'assistant', text: reply }]);
    }, 400);
  };

  // Members list
  const memberList = community.memberList || [
    { user: community.owner || currentUser, role: 'owner' as const, joinedDate: 'Launch' },
  ];
  const filteredMembers = memberList.filter((m) => {
    const matchSearch =
      m.user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.user.handle.toLowerCase().includes(memberSearchQuery.toLowerCase());
    if (memberRoleFilter === 'admins') return matchSearch && (m.role === 'admin' || m.role === 'owner');
    if (memberRoleFilter === 'moderators') return matchSearch && m.role === 'moderator';
    if (memberRoleFilter === 'members') return matchSearch && m.role === 'member';
    return matchSearch;
  });

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Community Banner & Header */}
      <div className="bg-white dark:bg-[#161218] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Cover Image */}
        <div className="relative h-36 sm:h-52 w-full bg-gradient-to-r from-[#BE185D] via-[#E91E8C] to-[#FCE7F3]">
          {community.coverImage && (
            <img
              src={community.coverImage}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={onBack}
            className="absolute top-3.5 left-3.5 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Spaces</span>
          </button>

          <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
              className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite Link</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3 py-1.5 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Manage</span>
              </button>
            )}
          </div>
        </div>

        {/* Community Info Body */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-start gap-4">
              {community.avatar ? (
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl object-cover -mt-10 sm:-mt-12 border-4 border-white dark:border-[#161218] shadow-md shrink-0 bg-white dark:bg-[#161218]"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-[#BE185D] to-[#E91E8C] text-white flex items-center justify-center -mt-10 sm:-mt-12 border-4 border-white dark:border-[#161218] shadow-md text-2xl font-bold shrink-0">
                  {community.name[0]?.toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {community.name}
                  </h1>
                  {community.badge && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3]">
                      {community.badge}
                    </span>
                  )}
                  {community.isPrivate ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Private Group
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Public Community
                    </span>
                  )}
                  {community.category && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      · {community.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {community.membersCount}
                    </strong>{' '}
                    {community.membersCount === 1 ? 'member' : 'members'}
                  </span>
                  <span>·</span>
                  <span>
                    Created by{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {community.owner?.name || 'Rose Creator'}
                    </strong>
                  </span>
                </p>
              </div>
            </div>

            {/* Action Buttons: Join, Leave, Request */}
            <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
              {isMember ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Joined Member</span>
                  </span>
                  {!isOwner && (
                    <button
                      onClick={() => leaveCommunity(community.id)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                      title="Leave community"
                    >
                      Leave
                    </button>
                  )}
                </div>
              ) : community.isPrivate && community.requireAdminApprovalForJoin ? (
                <button
                  onClick={() => setIsJoinRequestModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold shadow-md shadow-[#E91E8C]/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Request to Join Group</span>
                </button>
              ) : (
                <button
                  onClick={() => joinCommunity(community.id)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold shadow-md shadow-[#E91E8C]/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Join Community</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
            {community.description}
          </p>

          {/* Navigation Tabs (Inspired by Facebook Groups & X Communities) */}
          <div className="flex items-center gap-1 sm:gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'feed'
                  ? 'bg-[#E91E8C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feed & Channels</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'announcements'
                  ? 'bg-[#E91E8C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Announcements</span>
              {community.announcements && community.announcements.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center font-bold">
                  {community.announcements.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'events'
                  ? 'bg-[#E91E8C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events</span>
              {community.events && community.events.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center font-bold">
                  {community.events.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'members'
                  ? 'bg-[#E91E8C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members & Roles</span>
              {community.pendingMembers && community.pendingMembers.length > 0 && isAdmin && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                  {community.pendingMembers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'rules'
                  ? 'bg-[#E91E8C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rules & Safety</span>
            </button>

            {community.aiAssistant?.enabled && (
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'ai'
                    ? 'bg-[#E91E8C] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{community.aiAssistant.botName || 'AI Guide'}</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#E91E8C] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: FEED & CHANNELS */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Channel selector row */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-[#161218] border border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {community.channels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => switchCommunityChannel(community.id, channel)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    community.activeChannel === channel
                      ? 'bg-[#E91E8C] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  <span>{channel}</span>
                </button>
              ))}
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddChannelModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-[#E91E8C] text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Channel</span>
              </button>
            )}
          </div>

          {/* Pinned Announcement Box if available */}
          {community.announcements && community.announcements.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FCE7F3]/60 via-[#FCE7F3]/20 to-transparent dark:from-[#BE185D]/15 dark:to-transparent border border-[#E91E8C]/20 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#BE185D] dark:text-[#FCE7F3] uppercase tracking-wider">
                  <Pin className="w-3.5 h-3.5 rotate-45" />
                  <span>Pinned Announcement</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {community.announcements[0].createdAt}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {community.announcements[0].title}
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {community.announcements[0].content}
              </p>
            </div>
          )}

          {/* Post Composer (for members) */}
          {isMember ? (
            <form
              onSubmit={handlePostSubmit}
              className="p-4 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E91E8C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Posting to <strong className="text-slate-900 dark:text-white">#{community.activeChannel}</strong>
                </span>
              </div>

              <textarea
                rows={2}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={`Share an update, question, or resource in #${community.activeChannel}...`}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              />

              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Formatting: Markdown supported</span>
                </div>
                <button
                  type="submit"
                  disabled={!postContent.trim()}
                  className="px-4 py-2 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post to Space</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <Lock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Join this space to participate in discussions and post updates.
              </p>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-3">
            {channelPosts.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No discussions in #{community.activeChannel} yet
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Be the first to start the conversation or share insights with members of {community.name}.
                </p>
              </div>
            ) : (
              channelPosts.map((post) => (
                <div key={post.id} className="relative group">
                  <PostCard post={post} />
                  {isAdmin && (
                    <button
                      onClick={() => togglePinPostInCommunity(community.id, post.id)}
                      className="absolute top-4 right-14 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#E91E8C] opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1"
                      title="Pin post to community top"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#E91E8C]" />
                <span>Official Announcements</span>
              </h3>
              <p className="text-xs text-slate-500">
                Important broadcasts from community creators and admins.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsAnnouncementModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Announcement</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {!community.announcements || community.announcements.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No announcements posted yet.</p>
              </div>
            ) : (
              community.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E91E8C] text-white flex items-center justify-center font-bold text-xs">
                        {ann.authorName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {ann.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          {ann.createdAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] text-[10px] font-bold flex items-center gap-1">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => deleteCommunityAnnouncement(community.id, ann.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {ann.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E91E8C]" />
                <span>Community Events & AMAs</span>
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled workshops, live streams, and community calls.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Event</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!community.events || community.events.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No events scheduled at the moment.</p>
              </div>
            ) : (
              community.events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-5 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/30 dark:text-[#FCE7F3]">
                        {evt.date} · {evt.time}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {evt.attendeesCount} attending
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {evt.title}
                    </h4>
                    {evt.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <span>📍</span> <span>{evt.location}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => toggleCommunityEventRsvp(community.id, evt.id)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        evt.isAttending
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#E91E8C]'
                      }`}
                    >
                      {evt.isAttending ? 'Attending ✓' : 'RSVP Now'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS & ROLES */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Header & Pending Requests count */}
          <div className="p-4 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E91E8C]" />
                  <span>Member Directory & Governance</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage roles, permissions, and incoming membership applications.
                </p>
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setMemberRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    memberRoleFilter === 'all'
                      ? 'bg-white dark:bg-[#161218] text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  All ({memberList.length})
                </button>
                <button
                  onClick={() => setMemberRoleFilter('admins')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    memberRoleFilter === 'admins'
                      ? 'bg-white dark:bg-[#161218] text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  Admins
                </button>
                <button
                  onClick={() => setMemberRoleFilter('moderators')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    memberRoleFilter === 'moderators'
                      ? 'bg-white dark:bg-[#161218] text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  Mods
                </button>
              </div>
            </div>

            {/* Search members bar */}
            <input
              type="text"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              placeholder="Search members by name or @handle..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>

          {/* Pending Membership Requests (for Admins) */}
          {isAdmin && community.pendingMembers && community.pendingMembers.length > 0 && (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Pending Membership Requests ({community.pendingMembers.length})
                  </h4>
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">
                  Review applicant answers before approval
                </span>
              </div>

              <div className="space-y-2.5">
                {community.pendingMembers.map((pending, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white dark:bg-[#161218] rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                          {pending.user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {pending.user.name}
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            @{pending.user.handle} · Applied {pending.appliedAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => rejectPendingMember(community.id, pending.user.id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:text-rose-600"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => approvePendingMember(community.id, pending.user.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#E91E8C] text-white text-xs font-bold hover:bg-[#BE185D]"
                        >
                          Approve Member
                        </button>
                      </div>
                    </div>

                    {pending.answers && Object.keys(pending.answers).length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        {Object.entries(pending.answers).map(([q, a], aIdx) => (
                          <div key={aIdx} className="text-xs">
                            <span className="font-semibold text-slate-500 block text-[11px]">
                              Q: {q}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 italic">
                              "{a}"
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {filteredMembers.map((member) => {
              const isMemberOwner = member.role === 'owner';
              const isMemberAdmin = member.role === 'admin' || isMemberOwner;
              const isMemberMod = member.role === 'moderator';

              return (
                <div
                  key={member.user.id}
                  className="p-3.5 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#BE185D] to-[#E91E8C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {member.user.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {member.user.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isMemberOwner
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                              : isMemberAdmin
                              ? 'bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/30 dark:text-[#FCE7F3]'
                              : isMemberMod
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {member.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{member.user.handle} · Joined {member.joinedDate}
                      </p>
                    </div>
                  </div>

                  {/* Role Assignment Actions (for Owner & Admins) */}
                  {isAdmin && !isMemberOwner && member.user.id !== currentUser.id && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          assignMemberRole(
                            community.id,
                            member.user.id,
                            e.target.value as 'admin' | 'moderator' | 'member'
                          )
                        }
                        className="px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => removeMemberFromCommunity(community.id, member.user.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: RULES & SAFETY */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#E91E8C]" />
                <span>Guidelines & Code of Conduct</span>
              </h3>
              <p className="text-xs text-slate-500">
                Core standards and safety protections enforced across this space.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsRuleModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Rule</span>
              </button>
            )}
          </div>

          {/* Rules List */}
          <div className="space-y-2.5">
            {community.rules.map((rule, idx) => {
              const ruleObj =
                typeof rule === 'string'
                  ? { id: `r_${idx}`, title: `Rule ${idx + 1}`, description: rule }
                  : rule;

              return (
                <div
                  key={ruleObj.id || idx}
                  className="p-4 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {ruleObj.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {ruleObj.description}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => deleteCommunityRule(community.id, ruleObj.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spam Prevention & Safety Controls Overview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Automated Safety Protections</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-white dark:bg-[#161218] rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Spam Filter
                </span>
                <span className="font-bold text-emerald-600">
                  {community.spamPrevention?.autoFilterSpam ? 'Active Heuristics' : 'Standard'}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-[#161218] rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Link Blocking
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {community.spamPrevention?.blockExternalLinks ? 'External Blocked' : 'Permitted'}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-[#161218] rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Min Account Age
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {community.spamPrevention?.minAccountAgeDays || 0} days
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI ASSISTANT */}
      {activeTab === 'ai' && community.aiAssistant?.enabled && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#BE185D] to-[#E91E8C] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{community.aiAssistant.botName || 'RoseBot'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Active Guide
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Persona: <strong className="capitalize">{community.aiAssistant.personality}</strong> · Admin Authorized
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Assistant Chat Box */}
          <div className="p-4 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ask {community.aiAssistant.botName || 'AI Guide'} about {community.name}
            </h4>

            <div className="space-y-2.5 max-h-60 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
              {aiChatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 text-xs ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-[#E91E8C] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      AI
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#E91E8C] text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAiQuery} className="flex gap-2">
              <input
                type="text"
                value={aiUserQuery}
                onChange={(e) => setAiUserQuery(e.target.value)}
                placeholder="Ask about guidelines, channel topics, or upcoming events..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              />
              <button
                type="submit"
                disabled={!aiUserQuery.trim()}
                className="px-4 py-2 rounded-xl bg-[#E91E8C] text-white text-xs font-bold disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: SETTINGS (Admins & Owners) */}
      {activeTab === 'settings' && isAdmin && (
        <div className="space-y-5">
          <form
            onSubmit={handleSaveSettings}
            className="p-5 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#E91E8C]" />
              <span>Space General Settings</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Privacy Mode
                </label>
                <select
                  value={editIsPrivate ? 'private' : 'public'}
                  onChange={(e) => setEditIsPrivate(e.target.value === 'private')}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Join Policy
                </label>
                <select
                  value={editWhoCanJoin}
                  onChange={(e) => setEditWhoCanJoin(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="anyone">Open Join (Anyone)</option>
                  <option value="approval_required">Admin Approval Required</option>
                  <option value="invite_only">Invite Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E91E8C] text-white font-bold text-xs hover:bg-[#BE185D]"
              >
                Save Settings
              </button>
            </div>
          </form>

          {/* Manage Channels */}
          <div className="p-5 bg-white dark:bg-[#161218] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Manage Channels
            </h4>
            <div className="space-y-2">
              {community.channels.map((ch) => (
                <div
                  key={ch}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#E91E8C]" />
                    #{ch}
                  </span>
                  {community.channels.length > 1 && (
                    <button
                      onClick={() => deleteCommunityChannel(community.id, ch)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Delete channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Delete Community */}
          {isOwner && (
            <div className="p-5 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Danger Zone
                </h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                  Permanently remove this group or community, all channels, and associated member listings.
                </p>
              </div>

              {isDeleteConfirmOpen ? (
                <div className="p-3 bg-white dark:bg-[#161218] rounded-xl border border-rose-300 dark:border-rose-800 space-y-2">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        deleteCommunity(community.id);
                        onBack();
                      }}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                    >
                      Yes, Delete Permanently
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                >
                  Delete Space
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Join Request Questions */}
      {isJoinRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161218] rounded-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Request to Join {community.name}
              </h3>
              <button onClick={() => setIsJoinRequestModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitJoinRequest} className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Please answer the following screening questions required by space administrators:
              </p>

              {(community.membershipQuestions && community.membershipQuestions.length > 0
                ? community.membershipQuestions
                : ['What is your background or interest in this group?']
              ).map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    {idx + 1}. {q}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={joinAnswers[q] || ''}
                    onChange={(e) =>
                      setJoinAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                    }
                    placeholder="Your answer..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinRequestModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D]"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Post Announcement */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161218] rounded-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                New Community Announcement
              </h3>
              <button onClick={() => setIsAnnouncementModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Community Guidelines Update"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Broadcast message to all space members..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D]"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Schedule Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161218] rounded-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Schedule Community Event
              </h3>
              <button onClick={() => setIsEventModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="e.g. Monthly Design Review"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Date & Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    placeholder="e.g. Oct 28"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={evtTime}
                    onChange={(e) => setEvtTime(e.target.value)}
                    placeholder="6:00 PM"
                    className="w-28 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Location / Room
                </label>
                <input
                  type="text"
                  value={evtLocation}
                  onChange={(e) => setEvtLocation(e.target.value)}
                  placeholder="e.g. Rose Audio Space #1"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={evtDesc}
                  onChange={(e) => setEvtDesc(e.target.value)}
                  placeholder="What will members cover in this meetup?"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D]"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Rule */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161218] rounded-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Community Rule
              </h3>
              <button onClick={() => setIsRuleModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Rule Title
                </label>
                <input
                  type="text"
                  required
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  placeholder="e.g. Constructive Feedback Only"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="Provide clarity on expectations..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D]"
                >
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Channel */}
      {isAddChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161218] rounded-2xl w-full max-w-sm p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Channel
              </h3>
              <button onClick={() => setIsAddChannelModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddChannel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) =>
                      setNewChannelName(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                      )
                    }
                    placeholder="e.g. introductions, jobs"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddChannelModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D]"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
