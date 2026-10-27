import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Shield,
  Lock,
  Bell,
  Palette,
  HardDrive,
  Eye,
  Sliders,
  Sparkles,
  Globe,
  FileText,
  Trash2,
  Check,
  ChevronRight,
  Smartphone,
  LogOut,
  X,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AndroidSettingsSection } from '../../types';
import { Avatar } from '../ui/Avatar';

export const AndroidSettingsView: React.FC = () => {
  const {
    activeSettingsSection,
    pushSettingsSection,
    popSettingsSection,
    settings,
    updateSettings,
    currentUser,
    updateCurrentUser,
    blockedUserIds,
    unblockUser,
    showToast,
    setActiveView,
    setIsSplashScreenActive,
  } = useApp();

  const [newMutedWord, setNewMutedWord] = useState('');
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const renderSectionContent = () => {
    switch (activeSettingsSection) {
      case 'account':
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-3">
                ACCOUNT CREDENTIALS
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Username Handle
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium text-xs">@</span>
                    <input
                      type="text"
                      value={currentUser.handle}
                      onChange={(e) => updateCurrentUser({ handle: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Primary Email
                  </label>
                  <input
                    type="email"
                    value={settings.account.email}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        account: { ...prev.account, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Phone Number (SMS Recovery)
                  </label>
                  <input
                    type="tel"
                    value={settings.account.phone}
                    placeholder="+1 (555) 000-0000"
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        account: { ...prev.account, phone: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Backup Recovery Email
                  </label>
                  <input
                    type="email"
                    value={settings.account.recoveryEmail}
                    placeholder="recovery@email.com"
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        account: { ...prev.account, recoveryEmail: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                </div>
              </div>
            </div>

            {/* Active Devices & Sessions */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-3">
                CURRENT SESSION
              </h3>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#17131A] rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-[#E91E8C]" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Active Device Session
                    </p>
                    <p className="text-[11px] text-slate-500">RoseOne Web / Android Client</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                  Active
                </span>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-3">
                AVATAR PHOTO
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar src={currentUser.avatar} name={currentUser.name} size="lg" />
                  <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              updateCurrentUser({ avatar: reader.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </p>
                  <label className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] cursor-pointer hover:opacity-90">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              updateCurrentUser({ avatar: reader.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                PROFILE DETAILS
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={currentUser.name}
                  onChange={(e) => updateCurrentUser({ name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={currentUser.bio}
                  maxLength={160}
                  onChange={(e) => updateCurrentUser({ bio: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Website Link
                  </label>
                  <input
                    type="url"
                    value={currentUser.website || ''}
                    placeholder="https://..."
                    onChange={(e) => updateCurrentUser({ website: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={currentUser.location || ''}
                    placeholder="City, Country"
                    onChange={(e) => updateCurrentUser({ location: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Private Account
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Only approved followers can view your posts and media stories.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.isPrivateAccount}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, isPrivateAccount: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Show Activity Status
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Allow contacts to see when you are active on RoseOne.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showActivityStatus}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, showActivityStatus: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Read Receipts
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Send double-check marks when you read direct messages.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.readReceipts}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, readReceipts: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Require verification code upon sign-in.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.account.twoFactorEnabled}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      account: { ...prev.account, twoFactorEnabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <button
                  onClick={() => showToast('Password reset link sent to your email', 'info')}
                  className="w-full min-h-[40px] flex items-center justify-between px-3 py-1.5 bg-white dark:bg-[#17131A] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <span>Change Password</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Android Push Notifications
                  </h4>
                  <p className="text-[11px] text-slate-500">Master push toggle</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.pushEnabled}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, pushEnabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2.5">
                {[
                  { key: 'mentions', label: 'Mentions & Replies' },
                  { key: 'reactions', label: 'Likes & Reactions' },
                  { key: 'directMessages', label: 'Direct Messages' },
                  { key: 'communityUpdates', label: 'Community Announcements' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-0.5">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={(settings.notifications as any)[item.key]}
                      onChange={(e) =>
                        updateSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [item.key]: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#E91E8C] rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'appearance': {
        const palettes = [
          { name: 'Rose Pink', color: '#E91E8C' },
          { name: 'Ocean Blue', color: '#3182CE' },
          { name: 'Lavender', color: '#8B5CF6' },
          { name: 'Emerald', color: '#10A779' },
          { name: 'Sunshine', color: '#D69E16' },
          { name: 'Coral', color: '#F06464' },
          { name: 'Berry', color: '#BE185D' },
          { name: 'Turquoise', color: '#0D9488' },
          { name: 'Orange', color: '#EA7A24' },
          { name: 'Midnight', color: '#5964B8' },
          { name: 'Chocolate', color: '#8B5E3C' },
          { name: 'Monochrome', color: '#292929' },
        ];
        const accent = settings.appearance.accentColor || '#E91E8C';
        const updateAccent = (color: string) => updateSettings((prev) => ({
          ...prev,
          appearance: { ...prev.appearance, accentColor: color },
        }));
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">APPEARANCE MODE</h3>
                <p className="text-[11px] text-slate-500 mt-1">Choose how RoseOne looks on this device.</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'system', label: 'System' },
                ].map((t) => (
                  <button key={t.id} onClick={() => updateSettings((prev) => ({
                    ...prev, appearance: { ...prev.appearance, theme: t.id as any },
                  }))} className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    settings.appearance.theme === t.id
                      ? 'border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] text-[var(--brand-accent)]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    <span>{t.label}</span>
                    {settings.appearance.theme === t.id && <Check className="w-3.5 h-3.5 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">MY COLOURS · THEME STUDIO</h3>
                <p className="text-[11px] text-slate-500 mt-1">Choose an accent to personalize buttons, active tabs, links and highlights across RoseOne. Your choice is saved on this device.</p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {palettes.map((palette) => (
                  <button key={palette.name} type="button" title={palette.name}
                    aria-label={`Use ${palette.name} theme`}
                    aria-pressed={accent.toLowerCase() === palette.color.toLowerCase()}
                    onClick={() => updateAccent(palette.color)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2 border transition-all ${
                      accent.toLowerCase() === palette.color.toLowerCase()
                        ? 'border-[var(--brand-accent)] bg-[var(--brand-accent-soft)] ring-1 ring-[var(--brand-accent)]'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                    }`}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: palette.color }}>
                      {accent.toLowerCase() === palette.color.toLowerCase() && <Check className="w-4 h-4 text-white" />}
                    </span>
                    <span className="text-[10px] leading-tight text-center text-slate-600 dark:text-slate-300">{palette.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                <div className="min-w-0">
                  <label htmlFor="roseone-custom-accent" className="text-xs font-semibold text-slate-800 dark:text-slate-100">Custom colour</label>
                  <p className="text-[11px] text-slate-500">Pick any supported accent colour.</p>
                </div>
                <input id="roseone-custom-accent" type="color" value={accent}
                  onChange={(e) => updateAccent(e.target.value)}
                  aria-label="Choose a custom RoseOne accent colour"
                  className="w-11 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer" />
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#17131A] p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>R</span>
                  <div className="flex-1"><p className="text-xs font-bold text-slate-900 dark:text-white">RoseOne preview</p><p className="text-[10px] text-slate-500">Your selected accent</p></div>
                  <span className="text-[10px] font-semibold" style={{ color: accent }}>{accent.toUpperCase()}</span>
                </div>
                <button type="button" className="w-full py-2 rounded-lg text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: accent }}>Primary action preview</button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSplashScreenActive(true);
                    showToast('Playing RoseOne splash screen with your theme', 'info');
                  }}
                  className="flex-1 min-h-[40px] rounded-xl border border-[var(--brand-accent)] text-[var(--brand-accent)] bg-[var(--brand-accent-soft)] text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview Splash Screen</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings((prev) => ({
                    ...prev, appearance: { ...prev.appearance, accentColor: '#E91E8C', theme: 'system' },
                  }))}
                  className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  Reset Default
                </button>
              </div>
            </div>
          </div>
        );
      }

      case 'data-storage':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    High-Quality Media Uploads
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Upload full-resolution photos without compression.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataAndStorage.highQualityUploads}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      dataAndStorage: {
                        ...prev.dataAndStorage,
                        highQualityUploads: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    App Cache Cleaner
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Clear locally cached images and temporary files.
                  </p>
                </div>
                <button
                  onClick={() => showToast('App cache cleared: 0 MB freed', 'success')}
                  className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-[#BE185D] dark:text-[#FCE7F3] bg-[#FCE7F3] dark:bg-[#BE185D]/30 rounded-xl"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        );

      case 'accessibility':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Text Scaling
                  </label>
                  <span className="text-xs font-bold text-[#E91E8C] tabular-nums">
                    {settings.accessibility.fontScale}%
                  </span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={130}
                  step={5}
                  value={settings.accessibility.fontScale}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      accessibility: {
                        ...prev.accessibility,
                        fontScale: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#E91E8C]"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Reduce Motion
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Disable spring physics and parallax effects.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.accessibility.reduceMotion}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      accessibility: {
                        ...prev.accessibility,
                        reduceMotion: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">
                  MUTED KEYWORDS
                </h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMutedWord}
                    onChange={(e) => setNewMutedWord(e.target.value)}
                    placeholder="Enter word to mute..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      if (newMutedWord.trim()) {
                        updateSettings((prev) => ({
                          ...prev,
                          contentPreferences: {
                            ...prev.contentPreferences,
                            mutedWords: [...prev.contentPreferences.mutedWords, newMutedWord.trim()],
                          },
                        }));
                        setNewMutedWord('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#E91E8C] text-white text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {settings.contentPreferences.mutedWords.length === 0 ? (
                    <span className="text-xs text-slate-400">No keywords currently muted.</span>
                  ) : (
                    settings.contentPreferences.mutedWords.map((w, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
                      >
                        <span>{w}</span>
                        <button
                          onClick={() =>
                            updateSettings((prev) => ({
                              ...prev,
                              contentPreferences: {
                                ...prev.contentPreferences,
                                mutedWords: prev.contentPreferences.mutedWords.filter((_, i) => i !== idx),
                              },
                            }))
                          }
                        >
                          <X className="w-3.5 h-3.5 hover:text-rose-500" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  BLOCKED USERS ({blockedUserIds.length})
                </h4>
                {blockedUserIds.length === 0 ? (
                  <p className="text-xs text-slate-400">No accounts currently blocked.</p>
                ) : (
                  <div className="space-y-1.5">
                    {blockedUserIds.map((uid) => (
                      <div
                        key={uid}
                        className="flex items-center justify-between p-2 bg-white dark:bg-[#17131A] rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {uid}
                        </span>
                        <button
                          onClick={() => unblockUser(uid)}
                          className="text-xs text-[#BE185D] dark:text-[#FCE7F3] font-bold"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Enable Rose AI Assistant
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Provides caption drafting and tone polishing tools.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.aiPreferences.assistantEnabled}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      aiPreferences: {
                        ...prev.aiPreferences,
                        assistantEnabled: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 accent-[#E91E8C] rounded"
                />
              </div>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Language
              </label>
              {['English (US)', 'Español', 'Français', 'Deutsch'].map((lang) => (
                <button
                  key={lang}
                  onClick={() =>
                    updateSettings((prev) => ({
                      ...prev,
                      language: { ...prev.language, current: lang },
                    }))
                  }
                  className={`w-full min-h-[40px] flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-medium text-left ${
                    settings.language.current === lang
                      ? 'border-[#E91E8C] bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{lang}</span>
                  {settings.language.current === lang && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 'help-legal':
        return (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                LEGAL & STANDARDS
              </h3>
              {[
                { label: 'Community Guidelines', action: () => showToast('Displaying Rose Community Guidelines', 'info') },
                { label: 'Privacy Policy', action: () => showToast('Displaying Privacy Policy', 'info') },
                { label: 'Terms of Service', action: () => showToast('Displaying Terms of Service', 'info') },
              ].map((doc, i) => (
                <button
                  key={i}
                  onClick={doc.action}
                  className="w-full min-h-[40px] flex items-center justify-between px-3 py-2 bg-white dark:bg-[#17131A] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <span>{doc.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-2.5">
              <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                ACCOUNT REMOVAL
              </h3>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Permanently delete your account and associated social content from RoseOne.
              </p>
              <button
                onClick={() => setDeleteConfirmationOpen(true)}
                className="w-full min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Rose Account
              </button>
            </div>
          </div>
        );

      default:
        // Overview of 12 sections
        return (
          <div className="space-y-2">
            {[
              { id: 'account', label: 'Account & Credentials', desc: 'Username, email, phone' },
              { id: 'profile', label: 'Profile Customization', desc: 'Avatar, bio, display name, links' },
              { id: 'privacy', label: 'Privacy & Visibility', desc: 'Private account, activity status' },
              { id: 'security', label: 'Security & 2FA', desc: 'Two-factor auth, passwords' },
              { id: 'notifications', label: 'Notifications', desc: 'Push channels, mentions, sounds' },
              { id: 'appearance', label: 'Appearance & Theme', desc: 'Light, dark, pink accents' },
              { id: 'data-storage', label: 'Data & Storage', desc: 'Media quality, cache cleaner' },
              { id: 'accessibility', label: 'Accessibility', desc: 'Text scaling, reduce motion' },
              { id: 'content', label: 'Content Preferences', desc: 'Muted words, blocked users' },
              { id: 'ai', label: 'AI Preferences', desc: 'Rose AI assistant toggles' },
              { id: 'language', label: 'Language & Region', desc: 'App localization, time format' },
              { id: 'help-legal', label: 'Help, Legal & Account', desc: 'Guidelines, terms, account removal' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => pushSettingsSection(section.id as AndroidSettingsSection)}
                className="w-full min-h-[50px] flex items-center justify-between p-3 bg-white dark:bg-[#17131A] hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-colors text-left shadow-xs"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {section.label}
                  </h4>
                  <p className="text-[11px] text-slate-500">{section.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSettingsSection) {
      case 'account': return 'Account Credentials';
      case 'profile': return 'Profile Settings';
      case 'privacy': return 'Privacy';
      case 'security': return 'Security';
      case 'notifications': return 'Notifications';
      case 'appearance': return 'Appearance';
      case 'data-storage': return 'Data & Storage';
      case 'accessibility': return 'Accessibility';
      case 'content': return 'Content';
      case 'ai': return 'AI Preferences';
      case 'language': return 'Language';
      case 'help-legal': return 'Help & Legal';
      default: return 'Settings';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#17131A]">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-3 py-2.5 bg-white/95 dark:bg-[#17131A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={popSettingsSection}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              {getSectionTitle()}
            </h1>
            <p className="text-[10px] text-[#E91E8C] font-semibold">RoseOne</p>
          </div>
        </div>

        {activeSettingsSection !== 'overview' && (
          <button
            onClick={() => {
              showToast('Changes saved', 'success');
              popSettingsSection();
            }}
            className="min-h-[34px] px-3 py-1 bg-[#E91E8C] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Done
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-xl w-full mx-auto pb-12">
        {renderSectionContent()}
      </div>

      {deleteConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#17131A] rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-600 mb-1.5">Delete RoseOne Account?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              This will wipe your profile and remove any posts and messages. Proceed with deletion?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirmationOpen(false)}
                className="flex-1 min-h-[38px] py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmationOpen(false);
                  showToast('Account reset to default state', 'info');
                  setActiveView('feed');
                }}
                className="flex-1 min-h-[38px] py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
