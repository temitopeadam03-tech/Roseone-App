import React, { useState } from 'react';
import {
  X,
  Bell,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  Sparkles,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const NotificationsModal: React.FC = () => {
  const {
    notifications,
    notificationsModalOpen,
    setNotificationsModalOpen,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFollowRequest,
    declineFollowRequest,
    setViewingUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'requests'>('all');

  if (!notificationsModalOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'requests') return n.type === 'follow_request';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-[#E91E8C] fill-[#E91E8C]" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
      case 'follow_request':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'reaction':
        return <Repeat2 className="w-3.5 h-3.5 text-teal-500" />;
      case 'story_reaction':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#E91E8C]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FCE7F3] dark:bg-[#BE185D]/25 text-[#BE185D] dark:text-[#FCE7F3] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-[11px] text-slate-400">
                {notifications.filter((n) => !n.isRead).length} unread alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={markAllNotificationsAsRead}
                title="Mark all as read"
                className="text-xs font-semibold text-[#BE185D] dark:text-[#FCE7F3] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            <button
              onClick={() => setNotificationsModalOpen(false)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'requests', label: 'Requests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#17131A] text-[#BE185D] dark:text-[#FCE7F3] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No notifications yet
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                When other accounts follow you, like your posts, comment, or react to your stories, updates will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3 rounded-2xl border transition-colors flex items-start gap-3 cursor-pointer ${
                  n.isRead
                    ? 'bg-white dark:bg-[#17131A] border-slate-100 dark:border-slate-800/80 hover:border-slate-200'
                    : 'bg-[#FCE7F3]/20 dark:bg-[#BE185D]/10 border-[#E91E8C]/20'
                }`}
              >
                <div
                  className="relative shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingUser(n.actor);
                    setNotificationsModalOpen(false);
                  }}
                >
                  <Avatar src={n.actor.avatar} name={n.actor.name} size="sm" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-[#17131A] shadow-xs flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    <strong className="font-bold text-slate-900 dark:text-white mr-1">
                      {n.actor.name}
                    </strong>
                    {n.title.replace(n.actor.name, '').trim()}
                  </p>

                  {n.previewText && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                      "{n.previewText}"
                    </p>
                  )}

                  <span className="text-[10px] text-slate-400 block mt-1">
                    {n.timestamp}
                  </span>

                  {/* Actions for follow requests */}
                  {n.type === 'follow_request' && !n.handled && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptFollowRequest(n.id, n.actor.id);
                        }}
                        className="px-3 py-1 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          declineFollowRequest(n.id);
                        }}
                        className="px-3 py-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {n.type === 'follow_request' && n.handled && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                      Request answered
                    </span>
                  )}
                </div>

                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[#E91E8C] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
