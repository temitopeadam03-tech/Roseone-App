import React, { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  MoreHorizontal,
  BadgeCheck,
  Send,
  Trash2,
  Flag,
  VolumeX,
  Mic,
  Smile,
  X,
} from 'lucide-react';
import { Post, Comment, ReactionType } from '../../types';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { AudioPlayer } from '../ui/AudioPlayer';
import { VoiceRecorder } from '../ui/VoiceRecorder';

const REACTION_OPTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'rose', emoji: '🌹', label: 'Rose', color: 'text-[#E91E8C]' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-rose-500' },
  { type: 'fire', emoji: '🔥', label: 'Fire', color: 'text-amber-500' },
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500' },
  { type: 'clap', emoji: '👏', label: 'Clap', color: 'text-purple-500' },
  { type: 'insight', emoji: '💡', label: 'Insight', color: 'text-yellow-500' },
];

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const {
    currentUser,
    toggleLikePost,
    reactToPost,
    toggleSavePost,
    setReshareModalPost,
    votePoll,
    deletePost,
    comments,
    addComment,
    addVoiceComment,
    deleteComment,
    toggleLikeComment,
    muteUser,
    setReportingTarget,
    setViewingUser,
    toggleFollowUser,
    showToast,
  } = useApp();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyVoiceForId, setReplyVoiceForId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);
  const reactionTimeoutRef = useRef<any>(null);

  const postComments = comments[post.id] || [];
  const isMyPost = post.author?.id === currentUser?.id;
  const isFollowing = currentUser?.following?.includes(post.author?.id);

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      showToast('Post link copied to clipboard!', 'success');
    }
  };

  const handleCommentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = commentText.trim();
    if (!clean || isSubmittingComment) return;

    setIsSubmittingComment(true);
    addComment(post.id, clean);
    setCommentText('');

    setTimeout(() => {
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop = 0;
      }
      setIsSubmittingComment(false);
    }, 200);
  };

  const handleVoiceCommentSubmit = (voiceUrl: string, duration: number) => {
    addVoiceComment(post.id, voiceUrl, duration);
    setShowVoiceRecorder(false);
  };

  const handleReplySubmit = (commentId: string) => {
    const clean = replyText.trim();
    if (!clean || isSubmittingReply) return;

    setIsSubmittingReply(true);
    addComment(post.id, clean, commentId);
    setReplyText('');
    setReplyingToId(null);

    setTimeout(() => {
      setIsSubmittingReply(false);
    }, 200);
  };

  const handleReplyVoiceSubmit = (commentId: string, voiceUrl: string, duration: number) => {
    addVoiceComment(post.id, voiceUrl, duration, undefined, commentId);
    setReplyVoiceForId(null);
  };

  // Find user's active reaction option
  const activeReaction = post.userReaction
    ? REACTION_OPTIONS.find((r) => r.type === post.userReaction)
    : null;

  // Collect top reactions breakdown
  const topReactions = Object.entries(post.reactionCounts || {})
    .filter(([_, count]) => (count || 0) > 0)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .slice(0, 3)
    .map(([type]) => REACTION_OPTIONS.find((r) => r.type === type)?.emoji)
    .filter(Boolean);

  return (
    <article className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="p-3.5 sm:p-4 flex items-start justify-between">
        <div
          onClick={() => setViewingUser(post.author)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Avatar src={post.author.avatar} name={post.author.name} size="md" />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-[#E91E8C] transition-colors">
                {post.author.name}
              </span>
              {post.author.verified && (
                <BadgeCheck className="w-4 h-4 text-[#E91E8C] fill-[#E91E8C]/20" />
              )}
              <span className="text-xs text-slate-500">@{post.author.handle}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{post.createdAt}</span>
            </div>
            {post.communityName && (
              <span className="text-[11px] font-medium text-[#BE185D] dark:text-[#FCE7F3]">
                in {post.communityName}
              </span>
            )}
          </div>
        </div>

        {/* Right side controls: Follow button (if not my post) & More dropdown */}
        <div className="flex items-center gap-1.5">
          {!isMyPost && (
            <button
              onClick={() => toggleFollowUser(post.author.id)}
              className={`min-h-[30px] px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                isFollowing
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600'
                  : 'bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] hover:bg-[#E91E8C] hover:text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-44 bg-white dark:bg-[#1f1a24] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-20 animate-in fade-in zoom-in-95">
                {isMyPost ? (
                  <button
                    onClick={() => {
                      deletePost(post.id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        muteUser(post.author.id);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>Mute @{post.author.handle}</span>
                    </button>
                    <button
                      onClick={() => {
                        setReportingTarget({
                          isOpen: true,
                          type: 'post',
                          id: post.id,
                          name: post.author.name,
                        });
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report Post</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3.5 sm:px-4 pb-3">
        {post.content && (
          <p className="text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
            {post.content}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-[#BE185D] dark:text-[#FCE7F3] hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Quotation / Reshared Post */}
      {post.resharedPost && (
        <div className="px-3.5 sm:px-4 pb-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-2.5 hover:border-[#E91E8C]/40 transition-colors">
            <div
              onClick={() => setViewingUser(post.resharedPost!.author)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Avatar
                src={post.resharedPost.author.avatar}
                name={post.resharedPost.author.name}
                size="xs"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#E91E8C]">
                  {post.resharedPost.author.name}
                </span>
                {post.resharedPost.author.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-[#E91E8C] fill-[#E91E8C]/20" />
                )}
                <span className="text-[11px] text-slate-500">
                  @{post.resharedPost.author.handle}
                </span>
                <span className="text-[11px] text-slate-400">· {post.resharedPost.createdAt}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {post.resharedPost.content}
            </p>

            {post.resharedPost.media && post.resharedPost.media.length > 0 && (
              <div className="rounded-xl overflow-hidden max-h-56 border border-slate-200/80 dark:border-slate-800">
                <img
                  src={post.resharedPost.media[0]}
                  alt="Embedded media"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Poll */}
      {post.poll && (
        <div className="px-3.5 sm:px-4 pb-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5">
              {post.poll.question}
            </h4>
            <div className="space-y-2">
              {post.poll.options.map((opt) => {
                const total = post.poll?.totalVotes || 0;
                const percentage = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                const isSelected = post.poll?.userVotedId === opt.id;
                const hasVoted = Boolean(post.poll?.userVotedId);

                return (
                  <button
                    key={opt.id}
                    disabled={hasVoted}
                    onClick={() => votePoll(post.id, opt.id)}
                    className={`w-full relative overflow-hidden min-h-[44px] rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[#E91E8C] text-[#BE185D] dark:text-[#FCE7F3]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    } ${!hasVoted ? 'hover:border-[#E91E8C] cursor-pointer' : 'cursor-default'}`}
                  >
                    {hasVoted && (
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          isSelected ? 'bg-[#E91E8C]/20' : 'bg-slate-200/50 dark:bg-slate-700/50'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                    <div className="relative flex items-center justify-between z-10">
                      <span>{opt.text}</span>
                      {hasVoted && (
                        <span className="font-bold tabular-nums ml-2">{percentage}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-right tabular-nums">
              {post.poll.totalVotes} total {post.poll.totalVotes === 1 ? 'vote' : 'votes'}
            </p>
          </div>
        </div>
      )}

      {/* Media Gallery */}
      {post.media && post.media.length > 0 && (
        <div className="px-3.5 sm:px-4 pb-3">
          <div
            className={`grid gap-1.5 rounded-2xl overflow-hidden ${
              post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {post.media.map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt={`Media ${i + 1}`}
                onClick={() => setSelectedImage(imgUrl)}
                className={`w-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${
                  post.media && post.media.length === 1 ? 'max-h-[420px]' : 'h-48'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reaction Counts Breakdown Bar */}
      {post.likesCount > 0 && (
        <div className="px-3.5 sm:px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center -space-x-1">
              {topReactions.length > 0 ? (
                topReactions.map((emoji, idx) => (
                  <span
                    key={idx}
                    className="w-4 h-4 rounded-full bg-white dark:bg-[#17131A] shadow-2xs flex items-center justify-center text-xs"
                  >
                    {emoji}
                  </span>
                ))
              ) : (
                <span className="text-xs">🌹</span>
              )}
            </span>
            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {post.likesCount}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {post.commentsCount > 0 && (
              <span>
                {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
              </span>
            )}
            {post.repostsCount > 0 && (
              <span>
                {post.repostsCount} {post.repostsCount === 1 ? 'repost' : 'reposts'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="relative px-3.5 sm:px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-slate-500 dark:text-slate-400">
        {/* Like & Reaction Button with Hover / Click Picker */}
        <div
          className="relative"
          onMouseEnter={() => {
            reactionTimeoutRef.current = setTimeout(() => setShowReactionPicker(true), 300);
          }}
          onMouseLeave={() => {
            if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
            setShowReactionPicker(false);
          }}
        >
          <button
            onClick={() => toggleLikePost(post.id)}
            className={`min-h-[40px] flex items-center gap-1.5 text-xs font-semibold transition-transform active:scale-95 ${
              post.isLiked ? 'text-[#E91E8C] font-bold' : 'hover:text-[#E91E8C]'
            }`}
            title="Like or react to post"
          >
            {activeReaction ? (
              <span className="text-base leading-none">{activeReaction.emoji}</span>
            ) : (
              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-[#E91E8C]' : ''}`} />
            )}
            <span className="tabular-nums">
              {activeReaction ? activeReaction.label : 'React'}
            </span>
          </button>

          {/* Floating Reactions Dock */}
          {showReactionPicker && (
            <div
              className="absolute -top-12 left-0 z-30 bg-white dark:bg-[#1f1a24] rounded-full shadow-2xl border border-slate-200 dark:border-slate-800 p-1 flex items-center gap-1 animate-in zoom-in-95 duration-150"
              onMouseEnter={() => setShowReactionPicker(true)}
            >
              {REACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    reactToPost(post.id, opt.type);
                    setShowReactionPicker(false);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg hover:scale-130 active:scale-95 transition-transform ${
                    post.userReaction === opt.type
                      ? 'bg-[#FCE7F3] dark:bg-[#BE185D]/40 ring-2 ring-[#E91E8C]'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={opt.label}
                >
                  {opt.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Trigger */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`min-h-[40px] flex items-center gap-1.5 text-xs font-semibold hover:text-[#E91E8C] transition-colors ${
            showComments ? 'text-[#E91E8C]' : ''
          }`}
          title="Comments and voice replies"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="tabular-nums">{post.commentsCount}</span>
        </button>

        {/* Reshare / Repost Trigger (Opens ReshareModal) */}
        <button
          onClick={() => setReshareModalPost(post)}
          className={`min-h-[40px] flex items-center gap-1.5 text-xs font-semibold transition-transform active:scale-90 ${
            post.isReposted ? 'text-emerald-500 font-bold' : 'hover:text-emerald-500'
          }`}
          title="Reshare or Quote Post"
        >
          <Repeat2 className="w-4 h-4" />
          <span className="tabular-nums">{post.repostsCount}</span>
        </button>

        {/* Bookmark Trigger */}
        <button
          onClick={() => toggleSavePost(post.id)}
          className={`min-h-[40px] flex items-center gap-1 text-xs font-semibold transition-colors ${
            post.isSaved ? 'text-[#E91E8C]' : 'hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Save post"
        >
          <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-[#E91E8C]' : ''}`} />
        </button>

        {/* Share Link Trigger */}
        <button
          onClick={handleShare}
          className="min-h-[40px] flex items-center gap-1 text-xs font-semibold hover:text-slate-800 dark:hover:text-slate-200"
          title="Copy link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comments Drawer / Section */}
      {showComments && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 sm:p-4 space-y-3.5 animate-in fade-in duration-150">
          {/* Add comment input */}
          <form onSubmit={handleCommentSubmit} className="flex items-start gap-2.5">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  placeholder="Write a comment or record voice note..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
                    showVoiceRecorder
                      ? 'border-[#E91E8C] bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-[#E91E8C] text-slate-600 dark:text-slate-300'
                  }`}
                  title="Record voice note comment"
                >
                  <Mic className="w-3.5 h-3.5 text-[#E91E8C]" />
                  <span className="hidden sm:inline">Voice</span>
                </button>

                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="min-h-[38px] px-3.5 py-1.5 bg-[#E91E8C] hover:bg-[#BE185D] disabled:opacity-40 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Voice Recorder */}
              {showVoiceRecorder && (
                <VoiceRecorder
                  onSend={handleVoiceCommentSubmit}
                  onCancel={() => setShowVoiceRecorder(false)}
                  maxSeconds={120}
                />
              )}
            </div>
          </form>

          {/* Comment list with bounded scroll container to prevent vertical jumping */}
          {postComments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No comments yet. Start the conversation with text or a voice note!
            </p>
          ) : (
            <div
              ref={commentsContainerRef}
              tabIndex={-1}
              className="space-y-2.5 max-h-[380px] sm:max-h-[440px] overflow-y-auto overscroll-contain pr-1.5 scroll-smooth focus:outline-none"
            >
              {postComments.map((c) => {
                const canDelete = c.author?.id === currentUser?.id || isMyPost;

                return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-start gap-2.5 group/comment">
                      <Avatar src={c.author?.avatar} name={c.author?.name || 'User'} size="sm" />
                      <div className="flex-1 bg-white dark:bg-[#17131A] p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {c.author?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400">· {c.createdAt}</span>
                          </div>

                          {canDelete && (
                            <button
                              onClick={() => deleteComment(post.id, c.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Text Content */}
                        {c.content && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal whitespace-pre-line">
                            {c.content}
                          </p>
                        )}

                        {/* Voice Note Content - Compact player prevents huge card height */}
                        {c.voiceUrl && (
                          <div className="pt-0.5">
                            <AudioPlayer
                              src={c.voiceUrl}
                              duration={c.voiceDuration || 20}
                              authorName={c.author?.name}
                              isCompact
                            />
                          </div>
                        )}

                        {/* Comment Action Footer */}
                        <div className="flex items-center gap-3.5 pt-1 text-[11px] text-slate-500">
                          <button
                            onClick={() => toggleLikeComment(post.id, c.id)}
                            className={`flex items-center gap-1 font-semibold transition-colors ${
                              c.isLiked ? 'text-[#E91E8C]' : 'hover:text-[#E91E8C]'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${c.isLiked ? 'fill-[#E91E8C]' : ''}`} />
                            <span className="tabular-nums">{c.likesCount}</span>
                          </button>

                          <button
                            onClick={() => {
                              setReplyingToId(replyingToId === c.id ? null : c.id);
                              setReplyVoiceForId(null);
                            }}
                            className="font-semibold hover:text-[#E91E8C] transition-colors"
                          >
                            Reply
                          </button>

                          <button
                            onClick={() => {
                              setReplyVoiceForId(replyVoiceForId === c.id ? null : c.id);
                              setReplyingToId(null);
                            }}
                            className="font-semibold hover:text-[#E91E8C] transition-colors flex items-center gap-1"
                          >
                            <Mic className="w-3 h-3 text-[#E91E8C]" />
                            <span>Voice Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reply Input Box (Text) */}
                    {replyingToId === c.id && (
                      <div className="ml-10 flex gap-2 animate-in fade-in">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReplySubmit(c.id);
                            }
                          }}
                          placeholder={`Reply to ${c.author?.name || 'user'}...`}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleReplySubmit(c.id)}
                          disabled={!replyText.trim() || isSubmittingReply}
                          className="px-3.5 py-1.5 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => setReplyingToId(null)}
                          className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Reply Input Box (Voice Note) */}
                    {replyVoiceForId === c.id && (
                      <div className="ml-10 animate-in fade-in">
                        <VoiceRecorder
                          onSend={(voiceUrl, duration) =>
                            handleReplyVoiceSubmit(c.id, voiceUrl, duration)
                          }
                          onCancel={() => setReplyVoiceForId(null)}
                          maxSeconds={120}
                        />
                      </div>
                    )}

                    {/* Nested Threaded Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="ml-10 space-y-2 border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                        {c.replies.map((reply) => {
                          const canDeleteReply =
                            reply.author?.id === currentUser?.id || isMyPost;

                          return (
                            <div key={reply.id} className="flex items-start gap-2">
                              <Avatar
                                src={reply.author?.avatar}
                                name={reply.author?.name || 'User'}
                                size="xs"
                              />
                              <div className="flex-1 bg-white/90 dark:bg-[#17131A]/90 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {reply.author?.name || 'User'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      · {reply.createdAt}
                                    </span>
                                  </div>

                                  {canDeleteReply && (
                                    <button
                                      onClick={() =>
                                        deleteComment(post.id, reply.id, true, c.id)
                                      }
                                      className="text-slate-400 hover:text-rose-600 p-0.5"
                                      title="Delete reply"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {reply.content && (
                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                                    {reply.content}
                                  </p>
                                )}

                                {reply.voiceUrl && (
                                  <div className="pt-0.5">
                                    <AudioPlayer
                                      src={reply.voiceUrl}
                                      duration={reply.voiceDuration || 15}
                                      authorName={reply.author?.name}
                                      isCompact
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-3 pt-0.5 text-[10px] text-slate-500">
                                  <button
                                    onClick={() => toggleLikeComment(post.id, reply.id)}
                                    className={`flex items-center gap-1 font-semibold ${
                                      reply.isLiked ? 'text-[#E91E8C]' : 'hover:text-[#E91E8C]'
                                    }`}
                                  >
                                    <Heart
                                      className={`w-3 h-3 ${
                                        reply.isLiked ? 'fill-[#E91E8C]' : ''
                                      }`}
                                    />
                                    <span>{reply.likesCount}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Full Image Preview Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
          />
        </div>
      )}
    </article>
  );
};
