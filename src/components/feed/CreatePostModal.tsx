import React, { useState } from 'react';
import {
  X,
  Image,
  BarChart2,
  Sparkles,
  Trash2,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const CreatePostModal: React.FC = () => {
  const {
    createPostModalOpen,
    setCreatePostModalOpen,
    createPost,
    currentUser,
    communities,
    uploadMedia,
    showToast,
  } = useApp();

  const [content, setContent] = useState('');
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!createPostModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        showToast('Image must be under 15MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const raw = reader.result;
          try {
            const url = await uploadMedia(raw, file.name);
            setMediaList((prev) => [...prev, url]);
          } catch {
            setMediaList((prev) => [...prev, raw]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleGenerateAiCaption = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const suggestions = [
        "Exploring clean tactile mobile architecture on RoseOne. What do you think of this interaction flow?",
        "Refining our design system with high-contrast typography and subtle pink accents. Simple, warm, and intentional.",
        "Zero mock placeholders in production: every button connects to a real state change. Here's our latest update!",
      ];
      const randomCaption = suggestions[Math.floor(Math.random() * suggestions.length)];
      setContent((prev) => (prev ? `${prev}\n\n${randomCaption}` : randomCaption));
      setIsAiLoading(false);
      showToast('Rose AI generated caption suggestion!', 'success');
    }, 600);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaList.length === 0 && !pollQuestion) {
      showToast('Please add text, photo, or a poll', 'error');
      return;
    }

    const pollData =
      showPollBuilder && pollQuestion && pollOptions.filter((o) => o.trim()).length >= 2
        ? {
            question: pollQuestion,
            options: pollOptions.filter((o) => o.trim()),
          }
        : undefined;

    createPost(
      content.trim(),
      mediaList,
      pollData,
      tags,
      selectedCommunityId || undefined
    );

    setContent('');
    setMediaList([]);
    setShowPollBuilder(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setCreatePostModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#17131A] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Post
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className="text-[11px] font-semibold text-[#BE185D] dark:text-[#FCE7F3] bg-[#FCE7F3]/40 dark:bg-[#BE185D]/20 px-2 py-0.5 rounded-lg border-none focus:outline-none cursor-pointer"
                >
                  <option value="">Public to Feed</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      in {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCreatePostModalOpen(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, photos, or questions with RoseOne..."
            className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
          />

          {/* Media previews */}
          {mediaList.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {mediaList.map((url, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-800">
                  <img src={url} alt={`Upload ${i}`} className="w-full h-32 object-cover" />
                  <button
                    onClick={() => setMediaList(mediaList.filter((_, idx) => idx !== i))}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Poll Builder */}
          {showPollBuilder && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Poll Question
                </span>
                <button
                  onClick={() => setShowPollBuilder(false)}
                  className="text-xs text-rose-500 font-semibold"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
              />
              <div className="space-y-1.5">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[i] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => handleRemovePollOption(i)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="text-xs font-bold text-[#E91E8C] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add hashtag (e.g. Design, Mobile)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs font-semibold rounded-xl"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] flex items-center gap-1"
                  >
                    #{t}
                    <button
                      onClick={() => setTags(tags.filter((item) => item !== t))}
                      className="hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">
              <Image className="w-5 h-5 text-[#E91E8C]" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowPollBuilder(!showPollBuilder)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-500"
            >
              <BarChart2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              disabled={isAiLoading}
              onClick={handleGenerateAiCaption}
              className="min-h-[40px] px-2.5 flex items-center gap-1 rounded-xl text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Drafting...' : 'Rose AI'}</span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="min-h-[38px] px-5 py-1.5 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Publish Post
          </button>
        </div>
      </div>
    </div>
  );
};
