import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Bell,
  User as UserIcon,
  Settings,
  ChevronDown,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { RoseOneLogo } from '../ui/RoseOneLogo';

export const TopHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeView,
    setActiveView,
    setIsAndroidDrawerOpen,
    currentUser,
    setCreatePostModalOpen,
    setNotificationsModalOpen,
    unreadNotificationsCount,
    setEditProfileModalOpen,
    setIsAuthModalOpen,
    logout,
  } = useApp();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#17131A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto h-14 flex items-center justify-between gap-4">
        {/* Zone 1: RoseOne Brand Identity */}
        <div className="flex items-center gap-3">
          {/* Mobile drawer trigger */}
          <button
            onClick={() => setIsAndroidDrawerOpen(true)}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open RoseOne Android Menu"
          >
            <Menu className="w-5 h-5 text-[#E91E8C]" />
          </button>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('feed');
              setActiveTab('home');
            }}
            className="flex items-center shrink-0 cursor-pointer"
            aria-label="RoseOne Home"
          >
            <RoseOneLogo variant="horizontal" size="md" showTagline={false} />
          </a>
        </div>

        {/* Zone 2: Clean Nav Links (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              setActiveView('feed');
              setActiveTab('home');
            }}
            style={activeView === 'feed' && activeTab === 'home' ? { color: 'var(--brand-accent)' } : undefined}
            className={`whitespace-nowrap transition-colors hover:text-[#E91E8C] ${
              activeView === 'feed' && activeTab === 'home'
                ? 'font-bold'
                : ''
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => {
              setActiveView('feed');
              setActiveTab('explore');
            }}
            style={activeTab === 'explore' ? { color: 'var(--brand-accent)' } : undefined}
            className={`whitespace-nowrap transition-colors hover:text-[#E91E8C] ${
              activeTab === 'explore' ? 'font-bold' : ''
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => {
              setActiveView('feed');
              setActiveTab('market');
            }}
            style={activeTab === 'market' ? { color: 'var(--brand-accent)' } : undefined}
            className={`whitespace-nowrap transition-colors hover:text-[#E91E8C] ${
              activeTab === 'market' ? 'font-bold' : ''
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveView('communities')}
            style={activeView === 'communities' ? { color: 'var(--brand-accent)' } : undefined}
            className={`whitespace-nowrap transition-colors hover:text-[#E91E8C] ${
              activeView === 'communities' ? 'font-bold' : ''
            }`}
          >
            Communities
          </button>
          <button
            onClick={() => {
              setActiveView('feed');
              setActiveTab('messages');
            }}
            style={activeTab === 'messages' ? { color: 'var(--brand-accent)' } : undefined}
            className={`whitespace-nowrap transition-colors hover:text-[#E91E8C] ${
              activeTab === 'messages' ? 'font-bold' : ''
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveView('creator-hub')}
            style={activeView === 'creator-hub' ? { color: 'var(--brand-accent)' } : undefined}
            className={`whitespace-nowrap transition-colors hover:text-[#E91E8C] ${
              activeView === 'creator-hub' ? 'font-bold' : ''
            }`}
          >
            Creator Hub
          </button>
        </nav>

        {/* Zone 3: Device Preview Selector & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Notifications Button */}
          <button
            onClick={() => setNotificationsModalOpen(true)}
            className="relative min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E91E8C] ring-2 ring-white dark:ring-[#17131A]" />
            )}
          </button>

          {/* New Post button on desktop */}
          <button
            onClick={() => setCreatePostModalOpen(true)}
            className="hidden sm:flex min-h-[36px] px-3.5 py-1.5 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>

          {/* Profile Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="User account menu"
            >
              <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#1a151f] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-[#E91E8C] font-medium truncate">
                    @{currentUser.handle}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveView('feed');
                    setActiveTab('profile');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    setEditProfileModalOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('settings');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings & Privacy</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FCE7F3] dark:hover:bg-[#BE185D]/20 text-left hover:text-[#BE185D] transition-colors"
                >
                  <LogIn className="w-4 h-4 text-[#E91E8C]" />
                  <span>Sign In / Create Account</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
