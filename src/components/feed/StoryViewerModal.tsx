import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Clock,
  Globe,
  Users,
  Star,
  Eye,
  Pause,
  Play,
  Trash2,
  MessageCircle,
  Mic,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { VoiceRecorder } from '../ui/VoiceRecorder';
import { AudioPlayer } from '../ui/AudioPlayer';

const QUICK_EMOJIS = ['❤️', '🌹', '🔥', '👏', '😂', '😮'];

export const StoryViewerModal: React.FC = () => {
  const {
    stories,
    activeStoryIndex,
    setActiveStoryIndex,
    markStoryViewed,
    reactToStory,
    addStoryComment,
    deleteStory,
    currentUser,
    startNewConversation,
    showToast,
  } = useApp();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number }[]>([]);

  const pauseTimeoutRef = useRef<any>(null);

  // Keep hook order stable even when the viewer is closed. Returning before
  // these hooks caused React's "Rendered more/fewer hooks than expected" crash.
  const currentStory =
    activeStoryIndex !== null && activeStoryIndex >= 0
      ? stories[activeStoryIndex]
      : undefined;
  const isMyStory = currentStory?.userId === currentUser.id;

  // Pause timer if modal drawers are open
  const isSheetOpen = showViewersSheet || showCommentsSheet || showVoiceRecorder;

  // Mark story as viewed on open
  useEffect(() => {
    if (activeStoryIndex !== null && currentStory) {
      markStoryViewed(currentStory.id);
    }
    setProgress(0);
  }, [activeStoryIndex, currentStory?.id]);

  // Timer loop for auto progression
  useEffect(() => {
    if (activeStoryIndex === null || !currentStory || isPaused || isSheetOpen) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStoryIndex((activeStoryIndex < stories.length - 1) ? activeStoryIndex + 1 : null);
          return 0;
        }
        return prev + 1.5;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [activeStoryIndex, currentStory?.id, stories.length, isPaused, isSheetOpen]);

  if (!currentStory) return null;

  const handleNext = () => {
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    // Add to story comments
    addStoryComment(currentStory.id, replyText.trim());

    // Also forward as direct message to story author
    if (!isMyStory) {
      startNewConversation(
        currentStory.userName,
        currentStory.userHandle,
        `Replied to your story: "${replyText.trim()}"`
      );
    }

    setReplyText('');
    showToast('Reply sent!', 'success');
  };

  const handleSendVoiceComment = (voiceUrl: string, duration: number) => {
    addStoryComment(currentStory.id, undefined, voiceUrl, duration);
    setShowVoiceRecorder(false);
    showToast(`Voice note sent on story (${duration}s)!`, 'success');
  };

  const handleEmojiReact = (emoji: string) => {
    reactToStory(currentStory.id, emoji);

    // Add floating emoji animation
    const id = `anim_${Date.now()}_${Math.random()}`;
    const x = Math.random() * 60 + 20; // 20% to 80%
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1500);
  };

  // Press and hold pause handlers
  const handlePointerDown = () => {
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(true);
    }, 150);
  };

  const handlePointerUp = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    setIsPaused(false);
  };

  const getAudienceIcon = (aud?: string) => {
    if (aud === 'close-friends') return <Star className="w-3 h-3 text-amber-300" />;
    if (aud === 'followers') return <Users className="w-3 h-3 text-white/80" />;
    return <Globe className="w-3 h-3 text-white/80" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none"
      onPointerUp={handlePointerUp}
    >
      {/* Floating emojis overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((f) => (
          <div
            key={f.id}
            className="absolute text-4xl animate-bounce duration-1000"
            style={{
              bottom: '120px',
              left: `${f.x}%`,
              transition: 'all 1.5s ease-out',
            }}
          >
            {f.emoji}
          </div>
        ))}
      </div>

      {/* Main Story Container */}
      <div
        className="relative w-full max-w-sm sm:max-w-md h-full max-h-[860px] bg-slate-950 rounded-none sm:rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    activeStoryIndex !== null && idx < activeStoryIndex
                      ? '100%'
                      : idx === activeStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="relative z-30 pt-7 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar src={currentStory.userAvatar} name={currentStory.userName} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white drop-shadow-md">
                  {currentStory.userName}
                </p>
                {getAudienceIcon(currentStory.audience)}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/80">
                <Clock className="w-3 h-3" />
                <span>24h story · {currentStory.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPaused && (
              <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-bold text-white flex items-center gap-1">
                <Pause className="w-3 h-3" /> Paused
              </span>
            )}

            {isMyStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStory(currentStory.id);
                  setActiveStoryIndex(null);
                }}
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-rose-400 rounded-full bg-black/40 backdrop-blur-xs transition-colors"
                title="Delete your story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setActiveStoryIndex(null)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-white/90 hover:text-white rounded-full bg-black/40 backdrop-blur-xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Content Presentation - Uncropped full-screen display */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black overflow-hidden">
          {currentStory.mediaType === 'text' ? (
            <div
              className={`w-full h-full flex items-center justify-center p-8 text-center text-white text-xl sm:text-2xl font-black ${
                currentStory.bgColor || 'bg-gradient-to-tr from-[#BE185D] to-[#E91E8C]'
              }`}
            >
              <p className="drop-shadow-lg leading-snug max-w-xs">
                {currentStory.textContent}
              </p>
            </div>
          ) : currentStory.mediaType === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                loop
                muted={false}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Blurred ambient background to complement uncropped image */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${currentStory.mediaUrl})` }}
              />
              {/* Complete image without cropping */}
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="relative z-10 w-full h-full object-contain"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />
        </div>

        {/* Tap areas for next/prev navigation */}
        <div className="absolute inset-0 z-20 flex">
          <div
            onClick={handlePrev}
            className="w-1/3 h-full cursor-pointer"
            title="Previous story"
          />
          <div
            onClick={handleNext}
            className="w-2/3 h-full cursor-pointer"
            title="Next story"
          />
        </div>

        {/* Bottom Interactive Zone: Emojis, Caption, Reply, Viewers */}
        <div className="relative z-30 p-4 space-y-2.5">
          {/* Caption */}
          {currentStory.caption && (
            <p className="text-xs font-medium text-white drop-shadow-md bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              {currentStory.caption}
            </p>
          )}

          {/* Quick Reaction Emojis & Viewers Pill */}
          <div className="flex items-center justify-between gap-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEmojiReact(emoji);
                  }}
                  className="text-lg p-1 hover:scale-125 active:scale-95 transition-transform"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Viewers & Comments triggers */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommentsSheet(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                title="View comments"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{currentStory.comments?.length || 0}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewersSheet(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                title="View viewers list"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{currentStory.viewers?.length || 0}</span>
              </button>
            </div>
          </div>

          {/* Reply Form & Voice Note trigger */}
          <form
            onSubmit={handleSendReply}
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to @${currentStory.userHandle}...`}
              className="flex-1 min-h-[42px] px-4 py-2 text-xs rounded-full bg-white/20 text-white placeholder-white/70 backdrop-blur-md border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />

            <button
              type="button"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className="min-h-[42px] min-w-[42px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors border border-white/30"
              title="Record voice comment"
            >
              <Mic className="w-4 h-4 text-[#F472B6]" />
            </button>

            <button
              type="submit"
              disabled={!replyText.trim()}
              className="min-h-[42px] min-w-[42px] rounded-full bg-[#E91E8C] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#BE185D] transition-colors shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Voice Recorder Overlay Drawer */}
        {showVoiceRecorder && (
          <div
            className="absolute inset-x-0 bottom-0 z-40 p-4 bg-slate-900/95 backdrop-blur-md rounded-t-3xl border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#E91E8C]" />
                <span>Voice Note on Story (Max 2m)</span>
              </span>
              <button
                onClick={() => setShowVoiceRecorder(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <VoiceRecorder
              onSend={handleSendVoiceComment}
              onCancel={() => setShowVoiceRecorder(false)}
              maxSeconds={120}
            />
          </div>
        )}

        {/* Viewers List Drawer */}
        {showViewersSheet && (
          <div
            className="absolute inset-x-0 bottom-0 z-40 max-h-[70%] bg-slate-900/95 backdrop-blur-md rounded-t-3xl border-t border-white/10 flex flex-col p-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#E91E8C]" />
                <h4 className="text-sm font-bold text-white">
                  Story Viewers ({currentStory.viewers?.length || 0})
                </h4>
              </div>
              <button
                onClick={() => setShowViewersSheet(false)}
                className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {(!currentStory.viewers || currentStory.viewers.length === 0) ? (
                <p className="text-xs text-white/50 text-center py-6">
                  No viewers yet. Friends and followers who view this story will appear here.
                </p>
              ) : (
                currentStory.viewers.map((viewer, idx) => (
                  <div
                    key={`${viewer.userId}_${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={viewer.userAvatar} name={viewer.userName} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {viewer.userName}
                        </p>
                        <p className="text-[10px] text-white/60">
                          @{viewer.userHandle || 'user'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/50">{viewer.viewedAt}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Comments Drawer */}
        {showCommentsSheet && (
          <div
            className="absolute inset-x-0 bottom-0 z-40 max-h-[75%] bg-slate-900/95 backdrop-blur-md rounded-t-3xl border-t border-white/10 flex flex-col p-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#E91E8C]" />
                <h4 className="text-sm font-bold text-white">
                  Story Comments ({currentStory.comments?.length || 0})
                </h4>
              </div>
              <button
                onClick={() => setShowCommentsSheet(false)}
                className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {(!currentStory.comments || currentStory.comments.length === 0) ? (
                <p className="text-xs text-white/50 text-center py-6">
                  No comments yet. Leave a note or voice memo below!
                </p>
              ) : (
                currentStory.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-2.5 rounded-2xl bg-white/10 border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar src={comm.author.avatar} name={comm.author.name} size="xs" />
                        <span className="text-xs font-bold text-white">
                          {comm.author.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/50">{comm.createdAt}</span>
                    </div>

                    {comm.text && (
                      <p className="text-xs text-white/90 leading-relaxed pl-7">
                        {comm.text}
                      </p>
                    )}

                    {comm.voiceUrl && (
                      <div className="pl-7 pt-1">
                        <AudioPlayer
                          src={comm.voiceUrl}
                          duration={comm.voiceDuration || 20}
                          authorName={comm.author.name}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
