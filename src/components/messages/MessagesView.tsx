import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  Image,
  Mic,
  Pin,
  Smile,
  Phone,
  Video,
  ArrowLeft,
  CheckCheck,
  Play,
  Pause,
  Plus,
  MessageSquare,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Conversation, Message } from '../../types';
import { Avatar } from '../ui/Avatar';

export const MessagesView: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    startNewConversation,
    togglePinMessage,
    reactToMessage,
    currentUser,
    allUsers,
    uploadMedia,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  // New message modal
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientHandle, setNewRecipientHandle] = useState('');
  const [firstMessage, setFirstMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === (activeConversationId || conversations[0]?.id)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;
    sendMessage(activeConversation.id, messageText.trim());
    setMessageText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeConversation) {
      if (file.size > 15 * 1024 * 1024) {
        showToast('File size must be under 15MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const raw = reader.result;
          try {
            const url = await uploadMedia(raw, file.name);
            sendMessage(activeConversation.id, 'Shared a photo', url);
          } catch {
            sendMessage(activeConversation.id, 'Shared a photo', raw);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendVoiceNote = () => {
    if (!activeConversation) return;
    if (isRecording) {
      setIsRecording(false);
      const duration = Math.max(3, recordingSeconds);
      sendMessage(activeConversation.id, 'Voice message', undefined, duration);
      showToast(`Voice note sent (${duration}s)`, 'success');
    } else {
      setIsRecording(true);
      showToast('Recording voice note... tap again to send', 'info');
    }
  };

  const toggleAudioPlay = (msgId: string) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      setTimeout(() => setPlayingAudioId(null), 4000);
    }
  };

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientHandle.trim()) {
      showToast('Please enter a username or handle', 'error');
      return;
    }
    startNewConversation(newRecipientName, newRecipientHandle, firstMessage.trim() || undefined);
    setNewChatModalOpen(false);
    setNewRecipientName('');
    setNewRecipientHandle('');
    setFirstMessage('');
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden h-[calc(100vh-140px)] min-h-[540px] flex">
      {/* Conversation List Column */}
      <div
        className={`w-full sm:w-80 md:w-88 border-r border-slate-200 dark:border-slate-800 flex flex-col ${
          activeConversationId ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Header & New Chat button */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>

          <button
            onClick={() => setNewChatModalOpen(true)}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D] transition-colors shrink-0"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List or Empty State */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
          {conversations.length === 0 ? (
            <div className="p-8 text-center my-auto">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                No conversations yet
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Start a conversation with any member on RoseOne.
              </p>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-[#E91E8C] text-white text-xs font-bold rounded-xl hover:bg-[#BE185D] transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Message</span>
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              const lastMsg = conv.messages[conv.messages.length - 1];

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full p-3.5 flex items-center gap-3 transition-colors text-left ${
                    isActive
                      ? 'bg-[#FCE7F3]/40 dark:bg-[#BE185D]/15'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Avatar src={conv.avatar} name={conv.title} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {conv.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {conv.lastMessageTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {lastMsg ? lastMsg.text : 'Start chatting...'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#E91E8C] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Thread */}
      {activeConversation ? (
        <div
          className={`flex-1 flex flex-col ${
            !activeConversationId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Thread Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#17131A] z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveConversationId(null)}
                className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Avatar src={activeConversation.avatar} name={activeConversation.title} size="sm" />

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeConversation.title}
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Encrypted Direct Message
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  showToast('Voice call feature scheduled for next release', 'info')
                }
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#E91E8C] rounded-full"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  showToast('Video call feature scheduled for next release', 'info')
                }
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#E91E8C] rounded-full"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pinned Message Banner */}
          {activeConversation.pinnedMessage && (
            <div className="bg-[#FCE7F3]/60 dark:bg-[#BE185D]/20 px-4 py-2 border-b border-[#BE185D]/20 flex items-center justify-between text-xs text-[#BE185D] dark:text-[#FCE7F3]">
              <div className="flex items-center gap-2 truncate">
                <Pin className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold truncate">
                  Pinned: {activeConversation.pinnedMessage.text}
                </span>
              </div>
              <button
                onClick={() =>
                  togglePinMessage(activeConversation.id, activeConversation.pinnedMessage!.id)
                }
                className="text-[10px] underline ml-2 shrink-0 font-bold"
              >
                Unpin
              </button>
            </div>
          )}

          {/* Message Bubbles Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-[#141017]">
            {activeConversation.messages.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">No messages yet. Say hello!</p>
              </div>
            ) : (
              activeConversation.messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%]">
                      {isMine && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity mb-1">
                          <button
                            onClick={() => togglePinMessage(activeConversation.id, msg.id)}
                            className="p-1 rounded-full text-slate-400 hover:text-[#E91E8C]"
                            title="Pin message"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`relative p-3 rounded-2xl shadow-xs text-xs sm:text-sm leading-relaxed ${
                          isMine
                            ? 'bg-[#E91E8C] text-white rounded-br-xs'
                            : 'bg-white dark:bg-[#1f1a24] text-slate-900 dark:text-white rounded-bl-xs border border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        {msg.mediaUrl && (
                          <img
                            src={msg.mediaUrl}
                            alt="Attachment"
                            className="w-full max-h-56 object-cover rounded-xl mb-2"
                          />
                        )}

                        {msg.audioDuration ? (
                          <div className="flex items-center gap-3 min-w-[200px] py-1">
                            <button
                              type="button"
                              onClick={() => toggleAudioPlay(msg.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                isMine ? 'bg-white text-[#E91E8C]' : 'bg-[#E91E8C] text-white'
                              }`}
                            >
                              {playingAudioId === msg.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 flex items-center gap-1 h-6">
                              {[16, 24, 12, 28, 20, 10, 22, 14, 26, 18].map((h, i) => (
                                <div
                                  key={i}
                                  className={`w-1 rounded-full transition-all ${
                                    playingAudioId === msg.id ? 'animate-pulse' : ''
                                  } ${isMine ? 'bg-white/80' : 'bg-[#E91E8C]/80'}`}
                                  style={{ height: `${h}px` }}
                                />
                              ))}
                            </div>
                            <span
                              className={`text-[11px] font-bold tabular-nums ${
                                isMine ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              0:{msg.audioDuration.toString().padStart(2, '0')}
                            </span>
                          </div>
                        ) : (
                          <p>{msg.text}</p>
                        )}

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMine ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.createdAt}</span>
                          {isMine && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                        </div>

                        {msg.reaction && (
                          <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-white dark:bg-[#17131A] text-xs shadow-md border border-slate-200 dark:border-slate-700">
                            {msg.reaction}
                          </span>
                        )}
                      </div>

                      {!isMine && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity mb-1">
                          <button
                            onClick={() =>
                              setActiveReactionMessageId(
                                activeReactionMessageId === msg.id ? null : msg.id
                              )
                            }
                            className="p-1 rounded-full text-slate-400 hover:text-[#E91E8C]"
                            title="React"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {activeReactionMessageId === msg.id && (
                      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#1f1a24] rounded-full shadow-lg border border-slate-200 dark:border-slate-700 mt-1 z-20">
                        {['❤️', '✨', '👍', '🔥', '🌸'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              reactToMessage(activeConversation.id, msg.id, emoji);
                              setActiveReactionMessageId(null);
                            }}
                            className="p-1 text-sm hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17131A]">
            {isRecording ? (
              <div className="flex items-center justify-between px-4 py-2 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold tabular-nums">
                    Recording audio: 0:{recordingSeconds.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecording(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendVoiceNote}
                    className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-xl"
                  >
                    Send Note
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendText} className="flex items-center gap-2">
                <label className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-[#E91E8C] cursor-pointer">
                  <Image className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type an encrypted message..."
                  className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />

                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-[#E91E8C]"
                  title="Record Voice Note"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-[#E91E8C] disabled:opacity-40 text-white flex items-center justify-center hover:bg-[#BE185D] transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No conversations yet
          </h4>
          <p className="text-xs text-slate-500 mt-1">Start a conversation with anyone on RoseOne.</p>
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="mt-4 px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Start a Conversation
          </button>
        </div>
      )}

      {/* Start New Conversation Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#17131A] rounded-2xl w-full max-w-sm p-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                New Conversation
              </h3>
              <button onClick={() => setNewChatModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleStartChat} className="space-y-3">
              {/* Quick Contact Suggestions */}
              {allUsers.filter((u) => u.id !== currentUser.id).length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Quick Suggestions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allUsers
                      .filter((u) => u.id !== currentUser.id)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setNewRecipientHandle(u.handle);
                            setNewRecipientName(u.name);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 border transition-all ${
                            newRecipientHandle === u.handle
                              ? 'border-[#E91E8C] bg-[#FCE7F3] dark:bg-[#BE185D]/20 text-[#BE185D] dark:text-[#FCE7F3] font-bold'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Avatar src={u.avatar} name={u.name} size="xs" />
                          <span>@{u.handle}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Recipient Username or Handle
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={newRecipientHandle}
                    onChange={(e) => setNewRecipientHandle(e.target.value)}
                    placeholder="username"
                    required
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Initial Message (Optional)
                </label>
                <textarea
                  rows={2}
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Say hello..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewChatModalOpen(false)}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D]"
                >
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
