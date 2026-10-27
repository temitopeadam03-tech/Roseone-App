import React, { useState } from 'react';
import {
  X,
  MapPin,
  Tag,
  Clock,
  Bookmark,
  Share2,
  Flag,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

export const ListingDetailModal: React.FC = () => {
  const {
    activeListing,
    setActiveListing,
    currentUser,
    contactSeller,
    toggleSaveListing,
    markListingStatus,
    deleteListing,
    openUserProfile,
    setReportingTarget,
    showToast,
  } = useApp();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!activeListing) return null;

  const isOwner = activeListing.seller.id === currentUser.id;
  const images = activeListing.images && activeListing.images.length > 0
    ? activeListing.images
    : [];

  const handleShare = () => {
    const url = `${window.location.origin}/market/${activeListing.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Marketplace listing link copied to clipboard!', 'success');
    }
  };

  const handleNextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header with Title and Close */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#E91E8C] bg-[#FCE7F3] dark:bg-[#BE185D]/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {activeListing.category}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeListing.status === 'sold'
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              }`}
            >
              {activeListing.status === 'sold' ? 'Sold' : 'Available'}
            </span>
          </div>

          <button
            onClick={() => setActiveListing(null)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Images Section */}
          {images.length > 0 ? (
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 flex items-center justify-center group">
              <img
                src={images[currentImageIndex]}
                alt={activeListing.title}
                className="w-full h-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentImageIndex ? 'bg-[#E91E8C] w-4' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-44 rounded-2xl bg-gradient-to-tr from-[#BE185D]/20 to-[#E91E8C]/20 border border-dashed border-[#E91E8C]/30 flex flex-col items-center justify-center text-slate-400">
              <Tag className="w-8 h-8 text-[#E91E8C] mb-1 opacity-60" />
              <span className="text-xs">No photos attached</span>
            </div>
          )}

          {/* Pricing & Title */}
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#E91E8C]">
                ${activeListing.price.toLocaleString()}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Condition: {activeListing.condition}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1.5">
              {activeListing.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E91E8C]" />
                <span>{activeListing.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Listed {activeListing.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div
              onClick={() => {
                setActiveListing(null);
                openUserProfile(activeListing.seller);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Avatar
                src={activeListing.seller.avatar}
                name={activeListing.seller.name}
                size="md"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#E91E8C] transition-colors">
                    {activeListing.seller.name}
                  </span>
                  {activeListing.seller.verified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-[#E91E8C] fill-[#E91E8C]/20" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">@{activeListing.seller.handle}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveListing(null);
                openUserProfile(activeListing.seller);
              }}
              className="text-xs font-semibold text-[#BE185D] dark:text-[#FCE7F3] hover:underline"
            >
              View Profile
            </button>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
              Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/70 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              {activeListing.description}
            </p>
          </div>

          {/* Safety Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              RoseOne Safety Tip: Inspect items in public spaces. Never send wire transfers or advance gift card payments before verifying goods.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#17131A] flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleSaveListing(activeListing.id)}
              className={`min-h-[42px] px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                activeListing.isSaved
                  ? 'border-[#E91E8C] text-[#E91E8C] bg-[#FCE7F3]/40'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Save listing"
            >
              <Bookmark className={`w-4 h-4 ${activeListing.isSaved ? 'fill-[#E91E8C]' : ''}`} />
              <span className="hidden sm:inline">{activeListing.isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#E91E8C] flex items-center gap-1.5 text-xs font-semibold transition-colors"
              title="Share listing"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {!isOwner && (
              <button
                onClick={() => {
                  setReportingTarget({
                    isOpen: true,
                    type: 'post', // maps to report flow
                    id: activeListing.id,
                    name: `Listing: ${activeListing.title}`,
                  });
                  setActiveListing(null);
                }}
                className="min-h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Report listing"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">Report</span>
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          {isOwner ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  markListingStatus(
                    activeListing.id,
                    activeListing.status === 'sold' ? 'available' : 'sold'
                  )
                }
                className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {activeListing.status === 'sold' ? 'Mark Available' : 'Mark as Sold'}
              </button>
              <button
                onClick={() => deleteListing(activeListing.id)}
                className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                contactSeller(activeListing);
                setActiveListing(null);
              }}
              className="flex-1 max-w-[220px] min-h-[42px] px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#E91E8C]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message Seller</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
