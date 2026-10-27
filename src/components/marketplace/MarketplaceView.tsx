import React, { useState } from 'react';
import {
  Search,
  Plus,
  ShoppingBag,
  MapPin,
  Bookmark,
  Share2,
  Tag,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCategory, ProductCondition, MarketplaceListing } from '../../types';
import { Avatar } from '../ui/Avatar';

const CATEGORIES: ProductCategory[] = [
  'All',
  'Electronics',
  'Phones',
  'Fashion',
  'Shoes',
  'Home & Living',
  'Vehicles',
  'Property',
  'Beauty',
  'Health',
  'Food',
  'Services',
  'Sports',
  'Books',
  'Gaming',
  'Art & Collectibles',
  'Other',
];

const CONDITIONS: (ProductCondition | 'All')[] = ['All', 'New', 'Like New', 'Good', 'Fair'];

export const MarketplaceView: React.FC = () => {
  const {
    marketplaceListings,
    currentUser,
    setCreateListingModalOpen,
    setActiveListing,
    toggleSaveListing,
    contactSeller,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [selectedCondition, setSelectedCondition] = useState<ProductCondition | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [viewTab, setViewTab] = useState<'all' | 'saved' | 'my-listings'>('all');

  // Filter listings
  const filteredListings = marketplaceListings.filter((item) => {
    // View Tab filter
    if (viewTab === 'saved' && !item.isSaved) return false;
    if (viewTab === 'my-listings' && item.seller.id !== currentUser.id) return false;

    // Category filter
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

    // Condition filter
    if (selectedCondition !== 'All' && item.condition !== selectedCondition) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      const matchSeller = (item.seller?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchSeller) return false;
    }

    return true;
  });

  // Sort listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return b.createdTimestamp - a.createdTimestamp; // newest first
  });

  const handleShare = (listing: MarketplaceListing, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/market/${listing.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Listing link copied to clipboard!', 'success');
    }
  };

  const handleToggleSave = (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaveListing(listingId);
  };

  const handleContactSeller = (listing: MarketplaceListing, e: React.MouseEvent) => {
    e.stopPropagation();
    contactSeller(listing);
  };

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Marketplace Header Card */}
      <div className="bg-white dark:bg-[#17131A] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        {/* Top Header Row with Compact Create Listing Button */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#BE185D] to-[#E91E8C] text-white flex items-center justify-center shadow-xs shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  Marketplace
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Buy, sell, and discover pre-loved goods & creative services within RoseOne.
                </p>
              </div>
            </div>
          </div>

          {/* Compact Professional Create Listing Button */}
          <button
            onClick={() => setCreateListingModalOpen(true)}
            className="h-9 px-3.5 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap active:scale-95"
            title="Create a new listing"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Listing</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Marketplace by item, brand, or location..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
          />
        </div>

        {/* Expanded Category Pills (Horizontal scrolling) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 mt-1 scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[32px] px-3.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#E91E8C] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Tab Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        {/* View Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'saved', label: 'Saved' },
            { id: 'my-listings', label: 'My Listings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewTab(tab.id as any)}
              className={`min-h-[30px] px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewTab === tab.id
                  ? 'bg-white dark:bg-[#17131A] text-[#BE185D] dark:text-[#FCE7F3] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Condition & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Condition selector */}
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#E91E8C]"
          >
            <option value="All">All Conditions</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#E91E8C]"
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {sortedListings.length === 0 ? (
        <div className="p-10 sm:p-14 text-center bg-white dark:bg-[#17131A] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {viewTab === 'saved'
              ? 'No saved listings'
              : viewTab === 'my-listings'
              ? 'You have not listed any items yet'
              : searchQuery || selectedCategory !== 'All'
              ? 'No matching listings found'
              : 'No items on Rose Marketplace yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {viewTab === 'saved'
              ? 'Tap the bookmark icon on any product to keep it saved here.'
              : viewTab === 'my-listings'
              ? 'Tap "Create Listing" to post products or services for community members.'
              : searchQuery || selectedCategory !== 'All'
              ? 'Try modifying your search keywords or switching category filters.'
              : 'Be the first to list an item or service. Real listings appear here instantly for the community.'}
          </p>
          <button
            onClick={() => setCreateListingModalOpen(true)}
            className="mt-4 h-9 px-4 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Listing</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          {sortedListings.map((item) => {
            const isOwner = item.seller.id === currentUser.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveListing(item)}
                className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:border-[#E91E8C]/60 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                {/* Product Image */}
                <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-tr from-[#BE185D]/10 to-[#E91E8C]/10">
                      <Tag className="w-8 h-8 text-[#E91E8C] opacity-50 mb-1" />
                      <span className="text-[10px] text-slate-400">Rose Marketplace</span>
                    </div>
                  )}

                  {/* Save button floating */}
                  <button
                    onClick={(e) => handleToggleSave(item.id, e)}
                    className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                    title="Save item"
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${item.isSaved ? 'fill-[#E91E8C] text-[#E91E8C]' : ''}`}
                    />
                  </button>

                  {/* Condition tag */}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white">
                    {item.condition}
                  </span>

                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                        Sold
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-sm sm:text-base font-extrabold text-[#E91E8C]">
                        ${item.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[80px]">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#E91E8C] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Seller & Action Footer */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar src={item.seller?.avatar} name={item.seller?.name || 'Seller'} size="xs" />
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                          {(item.seller?.name || 'Seller').split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <MapPin className="w-3 h-3 text-[#E91E8C]" />
                        <span className="truncate max-w-[80px]">{item.location}</span>
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    {!isOwner && (
                      <button
                        onClick={(e) => handleContactSeller(item, e)}
                        className="w-full h-7 text-[11px] font-semibold rounded-lg bg-[#FCE7F3] dark:bg-[#BE185D]/20 hover:bg-[#E91E8C] hover:text-white text-[#BE185D] dark:text-[#FCE7F3] flex items-center justify-center gap-1 transition-colors"
                        title={`Message ${item.seller.name}`}
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Message Seller</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
