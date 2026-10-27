import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Lock,
  Globe,
  Users,
  Sparkles,
  Bot,
  Settings,
  HelpCircle,
  Hash,
  Calendar,
  Megaphone,
  Upload,
  Image as ImageIcon,
  Copy,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Save,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Community, CommunityRule } from '../../types';

interface CreateCommunityWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'community' | 'group';
}

const CATEGORIES = [
  'Technology',
  'Design & Creative',
  'Photography & Film',
  'Fashion & Lifestyle',
  'Gaming & Esports',
  'Startups & Business',
  'Web & Software',
  'Book Club & Literature',
  'Health & Wellness',
  'Music & Audio',
  'Local & City',
  'General',
];

const PRESET_AVATARS = [
  { label: 'Tech & Code', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80' },
  { label: 'Creative Studio', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80' },
  { label: 'Film & Photo', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&auto=format&fit=crop&q=80' },
  { label: 'Lifestyle & Bloom', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&auto=format&fit=crop&q=80' },
  { label: 'Gaming & Neon', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80' },
  { label: 'Minimalist Wave', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80' },
];

const PRESET_COVERS = [
  { label: 'Rose Gradient Flow', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Modern Workstation', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Moody Cinematic Dark', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Abstract Pastel Waves', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Creative Studio Loft', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80' },
];

const DEFAULT_RULE_PRESETS = [
  {
    title: 'Be Kind & Courteous',
    description: 'We are all in this together to create a welcoming environment. Let us treat everyone with respect.',
  },
  {
    title: 'No Hate Speech or Bullying',
    description: 'Bullying of any kind is not allowed, and degrading comments about race, religion, or identity will result in removal.',
  },
  {
    title: 'No Promotions or Spam',
    description: 'Give more than you take. Self-promotion, spam, and irrelevant commercial links are not allowed.',
  },
  {
    title: 'Respect Everyone’s Privacy',
    description: 'Being part of this group requires mutual trust. What is shared in the group should stay in the group.',
  },
];

export const CreateCommunityWizard: React.FC<CreateCommunityWizardProps> = ({
  isOpen,
  onClose,
  initialType = 'community',
}) => {
  const {
    currentUser,
    createCommunityDetailed,
    showToast,
    allUsers,
    setActiveCommunityId,
    setActiveView,
  } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Step 1: Basic Information
  const [spaceType, setSpaceType] = useState<'community' | 'group'>(initialType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0].url);
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [badge, setBadge] = useState('');

  // Step 2: Privacy & Visibility
  const [isPrivate, setIsPrivate] = useState(false);
  const [discoverability, setDiscoverability] = useState<'visible' | 'hidden'>('visible');
  const [whoCanJoin, setWhoCanJoin] = useState<'anyone' | 'approval_required' | 'invite_only'>('anyone');
  const [requireAdminApprovalForJoin, setRequireAdminApprovalForJoin] = useState(false);

  // Step 3: Roles & Permissions
  const [selectedModeratorIds, setSelectedModeratorIds] = useState<string[]>([]);
  const [memberCanPost, setMemberCanPost] = useState(true);
  const [memberCanCreatePolls, setMemberCanCreatePolls] = useState(true);
  const [memberCanUploadMedia, setMemberCanUploadMedia] = useState(true);
  const [memberCanInviteOthers, setMemberCanInviteOthers] = useState(true);
  const [postingApproval, setPostingApproval] = useState<'instant' | 'admin_review'>('instant');

  // Step 4: Membership & Safety
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([
    'Why are you excited to join this space?',
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [rules, setRules] = useState<CommunityRule[]>([
    {
      id: 'r_init_1',
      title: 'Be Kind & Respectful',
      description: 'Foster welcoming discussions and constructive exchange.',
    },
    {
      id: 'r_init_2',
      title: 'No Spam or Self-Promotion',
      description: 'Keep all content genuine and aligned with our shared focus.',
    },
  ]);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [autoFilterSpam, setAutoFilterSpam] = useState(true);
  const [blockExternalLinks, setBlockExternalLinks] = useState(false);
  const [minAccountAgeDays, setMinAccountAgeDays] = useState(0);

  // Step 5: Content & Engagement
  const [channels, setChannels] = useState<string[]>([
    'general',
    'announcements',
    'showcase',
    'q-and-a',
  ]);
  const [newChannelInput, setNewChannelInput] = useState('');
  const [topics, setTopics] = useState<string[]>(['Discussion', 'Showcase']);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [welcomeAnnouncementTitle, setWelcomeAnnouncementTitle] = useState('Welcome to our new space! 🌸');
  const [welcomeAnnouncementContent, setWelcomeAnnouncementContent] = useState(
    'Introduce yourself below, check out the guidelines, and dive into our discussion channels!'
  );
  const [includeWelcomeAnnouncement, setIncludeWelcomeAnnouncement] = useState(true);
  const [includeKickoffEvent, setIncludeKickoffEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('Community Launch & AMA');
  const [eventDate, setEventDate] = useState('Next Friday');
  const [eventTime, setEventTime] = useState('5:00 PM UTC');
  const [eventLocation, setEventLocation] = useState('Rose Audio Room #1');

  // Step 6: AI Management
  const [aiEnabled, setAiEnabled] = useState(false);
  const [explicitAdminApproved, setExplicitAdminApproved] = useState(false);
  const [aiBotName, setAiBotName] = useState('RoseBot');
  const [aiPersonality, setAiPersonality] = useState<'welcoming' | 'moderator' | 'concierge' | 'creative'>('welcoming');
  const [aiAutoWelcome, setAiAutoWelcome] = useState(true);
  const [aiAutoSummaries, setAiAutoSummaries] = useState(true);
  const [aiAnswerWithDocs, setAiAnswerWithDocs] = useState(true);

  // Step 7: Advanced Settings
  const [notifyOnNewPost, setNotifyOnNewPost] = useState(true);
  const [notifyOnMemberJoin, setNotifyOnMemberJoin] = useState(false);
  const [emailDigest, setEmailDigest] = useState<'daily' | 'weekly' | 'never'>('weekly');
  const [chatPermissions, setChatPermissions] = useState<'members' | 'admins_only' | 'disabled'>('members');
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);

  // Load draft if available
  useEffect(() => {
    try {
      const draft = localStorage.getItem('rose_community_draft');
      if (draft && !name) {
        const d = JSON.parse(draft);
        if (d.name) setName(d.name);
        if (d.description) setDescription(d.description);
        if (d.spaceType) setSpaceType(d.spaceType);
        if (d.category) setCategory(d.category);
        if (d.avatar) setAvatar(d.avatar);
        if (d.coverImage) setCoverImage(d.coverImage);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  if (!isOpen) return null;

  const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'your-space';
  const inviteLink = `https://rosesocial.net/c/${generatedSlug}?inv=rose_${Math.random().toString(36).substring(2, 6)}`;

  // Save Draft handler
  const handleSaveDraft = () => {
    try {
      const draftData = {
        name,
        description,
        spaceType,
        category,
        avatar,
        coverImage,
        isPrivate,
        channels,
        rules,
      };
      localStorage.setItem('rose_community_draft', JSON.stringify(draftData));
      showToast('Draft saved successfully to this browser!', 'success');
    } catch (e) {
      showToast('Unable to save draft', 'error');
    }
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!name.trim()) {
        showToast('Please enter a name for your group or community', 'error');
        return false;
      }
      if (!description.trim()) {
        showToast('Please provide a brief description', 'error');
        return false;
      }
    }
    if (step === 4) {
      if (rules.length === 0) {
        showToast('Please add at least one community rule', 'error');
        return false;
      }
    }
    if (step === 5) {
      if (channels.length === 0) {
        showToast('Please add at least one discussion channel', 'error');
        return false;
      }
    }
    if (step === 6) {
      if (aiEnabled && !explicitAdminApproved) {
        showToast('Admin explicit approval checkbox is required to enable the AI assistant', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleCreate = () => {
    if (!validateStep(1) || !validateStep(currentStep)) return;

    const moderatorsList = allUsers.filter((u) => selectedModeratorIds.includes(u.id));

    const finalData: Partial<Community> & { name: string; description: string } = {
      type: spaceType,
      name: name.trim(),
      slug: generatedSlug,
      description: description.trim(),
      category,
      badge: badge.trim() || (spaceType === 'group' ? 'Member Group' : 'Public Space'),
      avatar: avatar || PRESET_AVATARS[0].url,
      coverImage: coverImage || PRESET_COVERS[0].url,
      isPrivate,
      discoverability,
      whoCanJoin: whoCanJoin,
      requireAdminApprovalForJoin,
      inviteLink,
      moderators: moderatorsList,
      memberPermissions: {
        canPost: memberCanPost,
        canCreatePolls: memberCanCreatePolls,
        canUploadMedia: memberCanUploadMedia,
        canInviteOthers: memberCanInviteOthers,
      },
      postingApproval,
      membershipQuestions: screeningQuestions.filter((q) => q.trim().length > 0),
      rules,
      spamPrevention: {
        autoFilterSpam,
        blockExternalLinks,
        minAccountAgeDays,
      },
      channels: channels.length > 0 ? channels : ['general', 'announcements'],
      activeChannel: channels[0] || 'general',
      topics: topics.filter((t) => t.trim().length > 0),
      announcements: includeWelcomeAnnouncement && welcomeAnnouncementTitle.trim()
        ? [
            {
              id: `ann_${Date.now()}`,
              title: welcomeAnnouncementTitle.trim(),
              content: welcomeAnnouncementContent.trim(),
              createdAt: 'Just now',
              authorName: currentUser.name,
              authorAvatar: currentUser.avatar,
              isPinned: true,
            },
          ]
        : [],
      events: includeKickoffEvent && eventTitle.trim()
        ? [
            {
              id: `evt_${Date.now()}`,
              title: eventTitle.trim(),
              date: eventDate,
              time: eventTime,
              location: eventLocation,
              attendeesCount: 1,
              isAttending: true,
            },
          ]
        : [],
      aiAssistant: {
        enabled: aiEnabled && explicitAdminApproved,
        explicitAdminApproved: aiEnabled && explicitAdminApproved,
        botName: aiBotName.trim() || 'RoseBot',
        personality: aiPersonality,
        autoWelcomeNewMembers: aiAutoWelcome,
        autoSummaries: aiAutoSummaries,
        answerQuestionsWithDocs: aiAnswerWithDocs,
      },
      notificationsSettings: {
        notifyOnNewPost,
        notifyOnMemberJoin,
        emailDigest,
      },
      chatPermissions,
      allowMemberInvites,
    };

    const created = createCommunityDetailed(finalData);
    // Clear draft on creation
    try {
      localStorage.removeItem('rose_community_draft');
    } catch (e) {
      console.warn(e);
    }
    onClose();
    if (created && created.id) {
      setActiveCommunityId(created.id);
      setActiveView('communities');
    }
  };

  const stepsList = [
    { num: 1, title: 'Basic Info', desc: 'Name, imagery & type' },
    { num: 2, title: 'Privacy & Access', desc: 'Visibility & joins' },
    { num: 3, title: 'Roles & Rights', desc: 'Admins & posting' },
    { num: 4, title: 'Safety & Rules', desc: 'Rules & anti-spam' },
    { num: 5, title: 'Engagement', desc: 'Channels & topics' },
    { num: 6, title: 'AI Assistant', desc: 'Admin-approved bot' },
    { num: 7, title: 'Review & Finish', desc: 'Confirm settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-[#161218] rounded-3xl w-full max-w-4xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Wizard Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-[#161218]/80 backdrop-blur-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#BE185D] to-[#E91E8C] text-white flex items-center justify-center shadow-md shadow-[#E91E8C]/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Create {spaceType === 'group' ? 'New Group' : 'New Community'}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3]">
                  Step {currentStep} of {totalSteps}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Setup a modern space inspired by Facebook Groups & X Communities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              title="Save draft for later"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {stepsList.map((step) => {
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => {
                    if (isPassed || validateStep(currentStep)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-[#E91E8C] text-white shadow-xs'
                      : isPassed
                      ? 'bg-[#FCE7F3] dark:bg-[#BE185D]/20 text-[#BE185D] dark:text-[#FCE7F3]'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isCurrent
                        ? 'bg-white text-[#E91E8C]'
                        : isPassed
                        ? 'bg-[#BE185D] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : step.num}
                  </span>
                  <span className="whitespace-nowrap">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Space Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSpaceType('community')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      spaceType === 'community'
                        ? 'border-[#E91E8C] bg-[#FCE7F3]/20 dark:bg-[#BE185D]/10 ring-2 ring-[#E91E8C]/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className="w-5 h-5 text-[#E91E8C]" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Public Community Hub
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ideal for broad interest groups, creators, and public discourse with multiple channels and topic discovery.
                    </p>
                  </div>

                  <div
                    onClick={() => setSpaceType('group')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      spaceType === 'group'
                        ? 'border-[#E91E8C] bg-[#FCE7F3]/20 dark:bg-[#BE185D]/10 ring-2 ring-[#E91E8C]/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users className="w-5 h-5 text-[#BE185D]" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Focused Group
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Inspired by Facebook Groups: tighter member community, screening questions, and shared member-first feeds.
                    </p>
                  </div>
                </div>
              </div>

              {/* Space Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    {spaceType === 'group' ? 'Group Name' : 'Community Name'} <span className="text-[#E91E8C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mobile & Web Architects"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    URL preview: <span className="font-mono text-[#BE185D]">rosesocial.net/c/{generatedSlug}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Primary Category <span className="text-[#E91E8C]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Helps members discover your space across categories.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Description & Purpose <span className="text-[#E91E8C]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the mission, values, and what members will gain from joining..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                  <span>Keep it clear and welcoming.</span>
                  <span>{description.length} characters</span>
                </div>
              </div>

              {/* Visual Branding: Avatar & Cover Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Avatar */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                    <span>Profile Icon / Avatar</span>
                    <span className="text-[10px] text-slate-400">Presets or Image URL</span>
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={avatar}
                      alt="Avatar preview"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#E91E8C] shadow-sm shrink-0"
                    />
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="Paste image URL..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_AVATARS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(p.url)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          avatar === p.url
                            ? 'border-[#E91E8C] bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/30 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover Banner */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                    <span>Cover Photo / Banner</span>
                    <span className="text-[10px] text-slate-400">Presets or Image URL</span>
                  </label>
                  <div className="relative h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-2">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="Paste banner image URL..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C] mb-1.5"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COVERS.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverImage(c.url)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          coverImage === c.url
                            ? 'border-[#E91E8C] bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/30 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Privacy & Visibility */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Privacy Classification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setIsPrivate(false);
                      setWhoCanJoin('anyone');
                      setRequireAdminApprovalForJoin(false);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      !isPrivate
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Public Space
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Anyone on RoseOne can see who is in the space and read posts and announcements.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setIsPrivate(true);
                      setWhoCanJoin('approval_required');
                      setRequireAdminApprovalForJoin(true);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isPrivate
                        ? 'border-[#E91E8C] bg-[#FCE7F3]/30 dark:bg-[#BE185D]/10 ring-2 ring-[#E91E8C]/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lock className="w-5 h-5 text-[#E91E8C]" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Private Space
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Only approved members can see who belongs to the space and access posts, channels, and files.
                    </p>
                  </div>
                </div>
              </div>

              {/* Discoverability */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Discoverability & Search
                </h4>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="discoverability"
                      checked={discoverability === 'visible'}
                      onChange={() => setDiscoverability('visible')}
                      className="mt-0.5 accent-[#E91E8C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Visible (Recommended)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Anyone can find this space in search, directory, and category recommendations.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="discoverability"
                      checked={discoverability === 'hidden'}
                      onChange={() => setDiscoverability('hidden')}
                      className="mt-0.5 accent-[#E91E8C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        Hidden / Secret
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Only members and people with a direct invite link can see that this space exists.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Who Can Join */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Membership Approval Policy
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setWhoCanJoin('anyone');
                      setRequireAdminApprovalForJoin(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      whoCanJoin === 'anyone'
                        ? 'border-[#E91E8C] bg-white dark:bg-[#1a151e] shadow-xs ring-1 ring-[#E91E8C]'
                        : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Open Join
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Users can join immediately with one tap.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWhoCanJoin('approval_required');
                      setRequireAdminApprovalForJoin(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      whoCanJoin === 'approval_required'
                        ? 'border-[#E91E8C] bg-white dark:bg-[#1a151e] shadow-xs ring-1 ring-[#E91E8C]'
                        : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Admin Approval
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Admins review answers before granting access.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWhoCanJoin('invite_only');
                      setRequireAdminApprovalForJoin(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      whoCanJoin === 'invite_only'
                        ? 'border-[#E91E8C] bg-white dark:bg-[#1a151e] shadow-xs ring-1 ring-[#E91E8C]'
                        : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Invite Only
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Requires private invite link from an admin.
                    </span>
                  </button>
                </div>
              </div>

              {/* Invite Link preview */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Shareable Invite Link
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
                    {inviteLink}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteLink);
                    showToast('Invite link copied to clipboard!', 'success');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#E91E8C] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#BE185D] transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Roles & Permissions */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Owner Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FCE7F3]/40 to-transparent dark:from-[#BE185D]/10 border border-[#E91E8C]/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E91E8C] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {currentUser.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#BE185D] dark:text-[#FCE7F3] uppercase tracking-wider block">
                      Primary Creator & Space Owner
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentUser.name} (@{currentUser.handle})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Full administrative control, billing ownership & role delegation.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E91E8C] text-white">
                  Owner
                </span>
              </div>

              {/* Moderator Delegation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Assign Initial Moderators
                </label>
                <div className="space-y-2">
                  {allUsers
                    .filter((u) => u.id !== currentUser.id)
                    .map((user) => {
                      const isSelected = selectedModeratorIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedModeratorIds((prev) =>
                              isSelected ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                            );
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-[#E91E8C] bg-[#FCE7F3]/20 dark:bg-[#BE185D]/10'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                              {user.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                {user.name}
                              </h5>
                              <p className="text-[11px] text-slate-400">@{user.handle}</p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                              isSelected
                                ? 'bg-[#E91E8C] text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isSelected ? 'Moderator ✓' : '+ Add Mod'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Member Capabilities */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Member Posting Rights & Privileges
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Can publish posts in feed
                    </span>
                    <input
                      type="checkbox"
                      checked={memberCanPost}
                      onChange={(e) => setMemberCanPost(e.target.checked)}
                      className="w-4 h-4 accent-[#E91E8C] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Can create polls
                    </span>
                    <input
                      type="checkbox"
                      checked={memberCanCreatePolls}
                      onChange={(e) => setMemberCanCreatePolls(e.target.checked)}
                      className="w-4 h-4 accent-[#E91E8C] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Can upload photos & media
                    </span>
                    <input
                      type="checkbox"
                      checked={memberCanUploadMedia}
                      onChange={(e) => setMemberCanUploadMedia(e.target.checked)}
                      className="w-4 h-4 accent-[#E91E8C] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Can invite new members
                    </span>
                    <input
                      type="checkbox"
                      checked={memberCanInviteOthers}
                      onChange={(e) => setMemberCanInviteOthers(e.target.checked)}
                      className="w-4 h-4 accent-[#E91E8C] rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Posting Approval Mode */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Post Approval Workflow
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPostingApproval('instant')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      postingApproval === 'instant'
                        ? 'border-[#E91E8C] bg-white dark:bg-[#1a151e] shadow-xs ring-1 ring-[#E91E8C]'
                        : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                    }`}
                  >
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Instant Publishing
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Posts go live immediately without waiting for review.
                    </p>
                  </div>

                  <div
                    onClick={() => setPostingApproval('admin_review')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      postingApproval === 'admin_review'
                        ? 'border-[#E91E8C] bg-white dark:bg-[#1a151e] shadow-xs ring-1 ring-[#E91E8C]'
                        : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                    }`}
                  >
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Requires Admin Review
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      All member posts must be approved by an admin or moderator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Membership & Safety */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Screening Questions (Facebook Groups style) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Membership Screening Questions
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Applicants must answer these questions when requesting to join.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {screeningQuestions.length} / 4
                  </span>
                </div>

                <div className="space-y-2">
                  {screeningQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-slate-800 dark:text-slate-200 font-medium">
                        {q}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setScreeningQuestions((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {screeningQuestions.length < 4 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="e.g. What brings you to this community?"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                    />
                    <button
                      type="button"
                      disabled={!newQuestionText.trim()}
                      onClick={() => {
                        if (!newQuestionText.trim()) return;
                        setScreeningQuestions((prev) => [...prev, newQuestionText.trim()]);
                        setNewQuestionText('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#E91E8C] disabled:opacity-50 text-white font-bold text-xs"
                    >
                      Add Question
                    </button>
                  </div>
                )}
              </div>

              {/* Community Rules Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Community Rules & Code of Conduct
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {rules.length} active rules
                  </span>
                </div>

                {/* Rules List */}
                <div className="space-y-2 mb-3">
                  {rules.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className="p-3 rounded-2xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#FCE7F3] dark:bg-[#BE185D]/30 text-[#BE185D] dark:text-[#FCE7F3] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {rule.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Rule Form */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    + Add Custom Rule
                  </h5>
                  <input
                    type="text"
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    placeholder="Rule title (e.g. Constructive Feedback Only)"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                  <textarea
                    rows={2}
                    value={newRuleDesc}
                    onChange={(e) => setNewRuleDesc(e.target.value)}
                    placeholder="Explain the rationale behind this rule..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                  <div className="flex justify-between items-center pt-1">
                    <div className="flex flex-wrap gap-1">
                      {DEFAULT_RULE_PRESETS.slice(0, 2).map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setNewRuleTitle(preset.title);
                            setNewRuleDesc(preset.description);
                          }}
                          className="text-[10px] text-slate-500 hover:text-[#BE185D] underline"
                        >
                          Use "{preset.title}"
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!newRuleTitle.trim()}
                      onClick={() => {
                        if (!newRuleTitle.trim()) return;
                        setRules((prev) => [
                          ...prev,
                          {
                            id: `r_${Date.now()}`,
                            title: newRuleTitle.trim(),
                            description: newRuleDesc.trim(),
                          },
                        ]);
                        setNewRuleTitle('');
                        setNewRuleDesc('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#E91E8C] disabled:opacity-50 text-white font-bold text-xs"
                    >
                      Add Rule
                    </button>
                  </div>
                </div>
              </div>

              {/* Spam Prevention & Automated Safety */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#E91E8C]" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Spam Prevention & Auto-Moderation
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Auto-filter known spam patterns & phishing
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Automatically quarantines posts matching safety heuristics
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoFilterSpam}
                      onChange={(e) => setAutoFilterSpam(e.target.checked)}
                      className="w-4 h-4 accent-[#E91E8C] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Block unverified external links
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Disallows outside URLs from new accounts
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={blockExternalLinks}
                      onChange={(e) => setBlockExternalLinks(e.target.checked)}
                      className="w-4 h-4 accent-[#E91E8C] rounded"
                    />
                  </label>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Minimum account age requirement
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Prevents burner accounts from posting immediately
                      </span>
                    </div>
                    <select
                      value={minAccountAgeDays}
                      onChange={(e) => setMinAccountAgeDays(Number(e.target.value))}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value={0}>No minimum</option>
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Content & Engagement */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Channels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                      Discussion Channels
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Organize conversations into dedicated rooms or topics.
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {channels.length} channels
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {channels.map((ch) => (
                    <div
                      key={ch}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs"
                    >
                      <Hash className="w-3.5 h-3.5 text-[#E91E8C]" />
                      <span>{ch}</span>
                      {channels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChannels((prev) => prev.filter((c) => c !== ch))}
                          className="text-slate-400 hover:text-rose-500 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={newChannelInput}
                      onChange={(e) =>
                        setNewChannelInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                      }
                      placeholder="e.g. introductions, resources, code-help"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!newChannelInput.trim()}
                    onClick={() => {
                      if (!newChannelInput.trim() || channels.includes(newChannelInput.trim())) return;
                      setChannels((prev) => [...prev, newChannelInput.trim()]);
                      setNewChannelInput('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#E91E8C] disabled:opacity-50 text-white font-bold text-xs"
                  >
                    Add Channel
                  </button>
                </div>
              </div>

              {/* Topics / Tags */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                  Discovery Topics & Badges
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {topics.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FCE7F3] dark:bg-[#BE185D]/20 text-[#BE185D] dark:text-[#FCE7F3] text-xs font-semibold"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setTopics((prev) => prev.filter((item) => item !== t))}
                        className="hover:opacity-75"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    placeholder="Add topic (e.g. React, Photography, Careers)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                  />
                  <button
                    type="button"
                    disabled={!newTopicInput.trim()}
                    onClick={() => {
                      if (!newTopicInput.trim()) return;
                      setTopics((prev) => [...prev, newTopicInput.trim()]);
                      setNewTopicInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-xs font-bold"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Initial Pinned Welcome Announcement */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#E91E8C]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Publish Initial Pinned Welcome Announcement
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeWelcomeAnnouncement}
                    onChange={(e) => setIncludeWelcomeAnnouncement(e.target.checked)}
                    className="w-4 h-4 accent-[#E91E8C] rounded"
                  />
                </label>

                {includeWelcomeAnnouncement && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      value={welcomeAnnouncementTitle}
                      onChange={(e) => setWelcomeAnnouncementTitle(e.target.value)}
                      placeholder="Announcement title..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white"
                    />
                    <textarea
                      rows={2}
                      value={welcomeAnnouncementContent}
                      onChange={(e) => setWelcomeAnnouncementContent(e.target.value)}
                      placeholder="Announcement message..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Optional Kickoff Event */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#E91E8C]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Schedule Community Kickoff Event
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeKickoffEvent}
                    onChange={(e) => setIncludeKickoffEvent(e.target.checked)}
                    className="w-4 h-4 accent-[#E91E8C] rounded"
                  />
                </label>

                {includeKickoffEvent && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Event Title
                      </label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Date & Time
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          placeholder="Date"
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e]"
                        />
                        <input
                          type="text"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="Time"
                          className="w-28 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: AI Management */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#FCE7F3]/40 to-transparent dark:from-[#BE185D]/10 border border-[#E91E8C]/20 flex items-start gap-3">
                <Bot className="w-6 h-6 text-[#E91E8C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Optional AI Community Assistant
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    RoseOne gives admins the choice to deploy an integrated AI guide to welcome joiners, answer rule questions, and compile discussion recaps.
                  </p>
                  <p className="text-[11px] text-[#BE185D] dark:text-[#FCE7F3] font-semibold mt-1">
                    Strict Policy: AI is completely disabled unless you provide explicit admin authorization below.
                  </p>
                </div>
              </div>

              {/* AI Enable Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Enable AI Assistant in this space
                  </span>
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => {
                      setAiEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setExplicitAdminApproved(false);
                      }
                    }}
                    className="w-4 h-4 accent-[#E91E8C] rounded"
                  />
                </label>

                {aiEnabled && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    {/* Explicit Consent Requirement */}
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={explicitAdminApproved}
                          onChange={(e) => setExplicitAdminApproved(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#E91E8C] rounded"
                        />
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          I explicitly approve and authorize this AI assistant to interact with members in this space under administrator supervision.
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Assistant Name
                        </label>
                        <input
                          type="text"
                          value={aiBotName}
                          onChange={(e) => setAiBotName(e.target.value)}
                          placeholder="e.g. RoseBot, ArchitectAI"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Assistant Persona
                        </label>
                        <select
                          value={aiPersonality}
                          onChange={(e) => setAiPersonality(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e] text-slate-900 dark:text-white"
                        >
                          <option value="welcoming">Welcoming Host</option>
                          <option value="moderator">Helpful Moderator</option>
                          <option value="concierge">Concierge Guide</option>
                          <option value="creative">Creative Spark</option>
                        </select>
                      </div>
                    </div>

                    {/* AI Capability Toggles */}
                    <div className="space-y-2 text-xs pt-1">
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Auto-welcome new members with custom intro
                        </span>
                        <input
                          type="checkbox"
                          checked={aiAutoWelcome}
                          onChange={(e) => setAiAutoWelcome(e.target.checked)}
                          className="w-4 h-4 accent-[#E91E8C] rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Generate weekly discussion summaries
                        </span>
                        <input
                          type="checkbox"
                          checked={aiAutoSummaries}
                          onChange={(e) => setAiAutoSummaries(e.target.checked)}
                          className="w-4 h-4 accent-[#E91E8C] rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a151e] border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Answer community FAQ & rules questions
                        </span>
                        <input
                          type="checkbox"
                          checked={aiAnswerWithDocs}
                          onChange={(e) => setAiAnswerWithDocs(e.target.checked)}
                          className="w-4 h-4 accent-[#E91E8C] rounded"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: Review & Advanced Settings */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Space Live Preview Card */}
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-[#1a151e]">
                <div className="relative h-28 sm:h-36 w-full">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
                    {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    <span>{isPrivate ? 'Private' : 'Public'}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3.5 -mt-10 sm:-mt-12 mb-3">
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white dark:border-[#1a151e] shadow-md shrink-0"
                    />
                    <div className="pt-7 sm:pt-9 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                          {name || 'Untitled Space'}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/30 dark:text-[#FCE7F3]">
                          {category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Created by {currentUser.name} · 1 member
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Configured Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Privacy
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Join Policy
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {whoCanJoin.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Channels
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {channels.length} active
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    AI Assistant
                  </span>
                  <span
                    className={`font-bold ${
                      aiEnabled && explicitAdminApproved ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {aiEnabled && explicitAdminApproved ? `${aiBotName} (Active)` : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Advanced Notification & Chat Defaults */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Default Communication & Member Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Group Chat Access
                    </label>
                    <select
                      value={chatPermissions}
                      onChange={(e) => setChatPermissions(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e]"
                    >
                      <option value="members">All Members Can Chat</option>
                      <option value="admins_only">Admins & Mods Only</option>
                      <option value="disabled">Chat Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Email & Push Digest
                    </label>
                    <select
                      value={emailDigest}
                      onChange={(e) => setEmailDigest(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a151e]"
                    >
                      <option value="daily">Daily Summary</option>
                      <option value="weekly">Weekly Highlights</option>
                      <option value="never">No Automated Digest</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-white/90 dark:bg-[#161218]/90 backdrop-blur-sm flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-[#E91E8C]/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#BE185D] to-[#E91E8C] hover:from-[#9D174D] hover:to-[#BE185D] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-md shadow-[#E91E8C]/30"
              >
                <Check className="w-4 h-4" />
                <span>Create {spaceType === 'group' ? 'Group' : 'Community'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
