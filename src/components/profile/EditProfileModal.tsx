import React, { useState } from 'react';
import { X, Upload, Camera, Shield, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const EditProfileModal: React.FC = () => {
  const {
    currentUser,
    updateCurrentUser,
    editProfileModalOpen,
    setEditProfileModalOpen,
    uploadMedia,
    showToast,
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [handle, setHandle] = useState(currentUser.handle);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [banner, setBanner] = useState(currentUser.banner);
  const [isPrivate, setIsPrivate] = useState(!!currentUser.isPrivate);
  const [isUploading, setIsUploading] = useState(false);

  if (!editProfileModalOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('Avatar image must be under 10MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const raw = reader.result;
        setIsUploading(true);
        try {
          const url = await uploadMedia(raw, file.name);
          setAvatar(url);
          showToast('Avatar updated', 'success');
        } catch {
          setAvatar(raw);
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      showToast('Banner image must be under 12MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const raw = reader.result;
        setIsUploading(true);
        try {
          const url = await uploadMedia(raw, file.name);
          setBanner(url);
          showToast('Header banner updated', 'success');
        } catch {
          setBanner(raw);
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      name: name.trim() || currentUser.name,
      handle: handle.trim().toLowerCase().replace(/\s+/g, '') || currentUser.handle,
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      avatar,
      banner,
      isPrivate,
    });
    setEditProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-lg p-5 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Edit Public Profile
          </h3>
          <button
            onClick={() => setEditProfileModalOpen(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Banner & Avatar Customization */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Profile Header & Avatar
            </label>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-28 bg-slate-100 dark:bg-slate-800">
              <img
                src={banner}
                alt="Banner preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80';
                }}
              />
              <label
                className="absolute inset-0 bg-black/30 hover:bg-black/45 transition-colors flex items-center justify-center cursor-pointer gap-1.5 text-white text-xs font-semibold"
                title="Change banner image"
              >
                <Camera className="w-4 h-4" />
                <span>Change Banner</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Avatar Pill */}
            <div className="flex items-center gap-3 pt-1">
              <div className="relative group cursor-pointer">
                <Avatar src={avatar} name={name} size="lg" className="w-14 h-14 ring-2 ring-[#E91E8C]" />
                <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Avatar Photo</p>
                <p className="text-slate-400 text-[11px]">Square PNG or JPG recommended</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Username Handle
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">@</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              maxLength={160}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Website Link
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              />
            </div>
          </div>

          {/* Privacy Switch */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#E91E8C]" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Private Account
                </p>
                <p className="text-[11px] text-slate-500">
                  Require follow requests before new members view your posts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isPrivate ? 'bg-[#E91E8C]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isPrivate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditProfileModalOpen(false)}
              className="flex-1 min-h-[44px] py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D] shadow-xs disabled:opacity-60 transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
