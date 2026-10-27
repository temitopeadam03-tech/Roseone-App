import React, { useState } from 'react';
import {
  X,
  Upload,
  Type,
  Image as ImageIcon,
  Video,
  Globe,
  Users,
  Star,
  Check,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const BG_PRESETS = [
  { id: 'rose', name: 'Signature Rose', class: 'bg-gradient-to-tr from-[#BE185D] to-[#E91E8C]' },
  { id: 'midnight', name: 'Midnight', class: 'bg-gradient-to-tr from-[#17131A] via-[#3B0764] to-[#701A75]' },
  { id: 'sunset', name: 'Sunset Glow', class: 'bg-gradient-to-tr from-[#F43F5E] to-[#F59E0B]' },
  { id: 'berry', name: 'Velvet Berry', class: 'bg-gradient-to-tr from-[#831843] to-[#DB2777]' },
  { id: 'electric', name: 'Electric Pink', class: 'bg-gradient-to-tr from-[#9D174D] via-[#EC4899] to-[#F472B6]' },
];

export const CreateStoryModal: React.FC = () => {
  const { createStoryModalOpen, setCreateStoryModalOpen, createStory, uploadMedia, showToast } = useApp();

  const [mode, setMode] = useState<'media' | 'text'>('media');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_PRESETS[0]);
  const [audience, setAudience] = useState<'everyone' | 'followers' | 'close-friends'>('everyone');
  const [isPreviewing, setIsPreviewing] = useState(false);

  if (!createStoryModalOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('File size must be under 20MB', 'error');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'photo');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (mode === 'media') {
      if (!mediaPreview) {
        showToast('Please select a photo or video to share', 'error');
        return;
      }
      let finalUrl = mediaPreview;
      if (mediaPreview.startsWith('data:')) {
        try {
          finalUrl = await uploadMedia(mediaPreview);
        } catch {
          finalUrl = mediaPreview;
        }
      }
      createStory(
        mediaType,
        finalUrl,
        caption.trim() || undefined,
        undefined,
        undefined,
        audience,
        mediaType === 'photo' ? finalUrl : undefined
      );
    } else {
      if (!textContent.trim()) {
        showToast('Please write some text for your story', 'error');
        return;
      }
      createStory('text', '', undefined, textContent.trim(), selectedBg.class, audience);
    }

    // Reset and close
    setMediaPreview(null);
    setCaption('');
    setTextContent('');
    setIsPreviewing(false);
    setCreateStoryModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Story</h3>
            <p className="text-[11px] text-slate-400">Available to viewers for 24 hours</p>
          </div>
          <button
            onClick={() => setCreateStoryModalOpen(false)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Type Selector */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={() => {
              setMode('media');
              setIsPreviewing(false);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mode === 'media'
                ? 'border-[#E91E8C] text-[#E91E8C] bg-white dark:bg-[#17131A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo / Video</span>
          </button>
          <button
            onClick={() => {
              setMode('text');
              setIsPreviewing(false);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              mode === 'text'
                ? 'border-[#E91E8C] text-[#E91E8C] bg-white dark:bg-[#17131A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text Story</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[60vh]">
          {mode === 'media' ? (
            <>
              {mediaPreview ? (
                <div className="relative h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex items-center justify-center group">
                  {mediaType === 'video' ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Story preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => setMediaPreview(null)}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs font-semibold bg-black/70 hover:bg-black text-white rounded-lg backdrop-blur-xs transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="h-60 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#E91E8C] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/30">
                  <Upload className="w-8 h-8 text-[#E91E8C] mb-2" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Upload Photo or Video
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Supports JPG, PNG, MP4 up to 20MB
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Story Caption Overlay
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add an optional caption..."
                  maxLength={120}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
              </div>
            </>
          ) : (
            <>
              {/* Text Story Creator */}
              <div
                className={`relative h-60 rounded-2xl p-5 flex items-center justify-center text-center text-white shadow-inner transition-all ${selectedBg.class}`}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your story here..."
                  maxLength={180}
                  rows={4}
                  className="w-full bg-transparent text-white placeholder-white/60 font-bold text-base sm:text-lg focus:outline-none resize-none text-center"
                />
              </div>

              {/* Background presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Background Style
                </label>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {BG_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedBg(preset)}
                      className={`w-8 h-8 rounded-full ${preset.class} shrink-0 border-2 transition-transform ${
                        selectedBg.id === preset.id ? 'scale-110 border-white ring-2 ring-[#E91E8C]' : 'border-transparent'
                      }`}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Audience selection */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Audience
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'everyone', label: 'Everyone', icon: <Globe className="w-3 h-3" /> },
                { id: 'followers', label: 'Followers', icon: <Users className="w-3 h-3" /> },
                { id: 'close-friends', label: 'Close Friends', icon: <Star className="w-3 h-3 text-amber-500" /> },
              ].map((aud) => (
                <button
                  key={aud.id}
                  onClick={() => setAudience(aud.id as any)}
                  className={`min-h-[34px] p-1.5 text-[11px] font-semibold rounded-xl border flex items-center justify-center gap-1 transition-all ${
                    audience === aud.id
                      ? 'border-[#E91E8C] bg-[#FCE7F3]/40 dark:bg-[#BE185D]/20 text-[#BE185D] dark:text-[#FCE7F3]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {aud.icon}
                  <span className="truncate">{aud.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex gap-2.5 shrink-0">
          <button
            onClick={() => setCreateStoryModalOpen(false)}
            className="flex-1 min-h-[42px] py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={mode === 'media' ? !mediaPreview : !textContent.trim()}
            className="flex-1 min-h-[42px] py-2 text-xs font-bold rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] disabled:opacity-50 text-white shadow-md shadow-[#E91E8C]/20 transition-all"
          >
            Share Story
          </button>
        </div>
      </div>
    </div>
  );
};
