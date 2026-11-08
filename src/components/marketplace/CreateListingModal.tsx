import React, { useState } from 'react';
import {
  X,
  Upload,
  DollarSign,
  MapPin,
  Tag,
  Sparkles,
  Trash2,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCategory, ProductCondition, MarketplaceStore } from '../../types';
import { api } from '../../lib/api';

const CATEGORIES: ProductCategory[] = [
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

const CONDITIONS: ProductCondition[] = ['New', 'Like New', 'Good', 'Fair'];
const SUBCATEGORIES: Record<string, string[]> = {
  Electronics: ['Phones', 'Laptops', 'Tablets', 'TVs & Audio', 'Cameras', 'Accessories'],
  Phones: ['Android Phones', 'iPhones', 'Feature Phones', 'Phone Accessories'],
  Fashion: ['Men’s Clothing', 'Women’s Clothing', 'Bags', 'Watches', 'Accessories'],
  Shoes: ['Sneakers', 'Formal Shoes', 'Sandals', 'Boots', 'Kids’ Shoes'],
  'Home & Living': ['Furniture', 'Kitchen', 'Decor', 'Bedding', 'Lighting'],
  Vehicles: ['Cars', 'Motorcycles', 'Commercial Vehicles', 'Vehicle Parts'],
  Property: ['Houses for Sale', 'Houses for Rent', 'Apartments', 'Land', 'Commercial Property'],
  Beauty: ['Skincare', 'Haircare', 'Makeup', 'Beauty Tools'],
  Health: ['Fitness & Wellness', 'Personal Care', 'Health Equipment'],
  Food: ['Packaged Food', 'Pantry', 'Eligible Groceries'],
  Services: ['Repairs', 'Cleaning', 'Photography', 'Design', 'Other Services'],
  Sports: ['Gym Equipment', 'Sportswear', 'Bicycles', 'Outdoor Gear'],
  Books: ['Textbooks', 'Novels', 'Learning Materials', 'Stationery'],
  Gaming: ['Consoles', 'Games', 'Controllers', 'Gaming PCs'],
  'Art & Collectibles': ['Art', 'Musical Instruments', 'Collectibles', 'Crafts'],
  Other: ['Other Items'],
};

export const CreateListingModal: React.FC = () => {
  const {
    createListingModalOpen,
    setCreateListingModalOpen,
    createListing,
    currentUser,
    showToast,
    uploadMedia,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<ProductCategory>('Electronics');
  const [subcategory, setSubcategory] = useState('Phones');
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<MarketplaceStore[]>([]);
  React.useEffect(() => { api.getStores().then((items) => setStores(items.filter((item) => item.ownerId === currentUser.id))).catch(() => setStores([])); }, [currentUser.id]);
  const [condition, setCondition] = useState<ProductCondition>('Like New');
  const [location, setLocation] = useState(currentUser.location || '');
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  if (!createListingModalOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 6) {
      showToast('Maximum 6 photos per listing', 'error');
      e.target.value = '';
      return;
    }
    if (files.some((file) => file.size > 8 * 1024 * 1024)) {
      showToast('Each photo must be under 8MB', 'error');
      e.target.value = '';
      return;
    }
    setIsUploadingImages(true);
    try {
      const uploaded = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read one of the selected photos.'));
        reader.onload = async () => {
          if (typeof reader.result !== 'string') return reject(new Error('Invalid photo file.'));
          try { resolve(await uploadMedia(reader.result, file.name)); }
          catch (error) { reject(error); }
        };
        reader.readAsDataURL(file);
      })));
      setImages((prev) => [...prev, ...uploaded]);
    } catch (error: any) {
      showToast(error?.message || 'Photo upload failed. Please retry.', 'error');
    } finally {
      setIsUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter an item title', 'error');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('Please enter a valid price', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Please add a description for your item', 'error');
      return;
    }

    createListing({
      title: title.trim(),
      description: description.trim(),
      price: numPrice,
      category,
      subcategory: subcategory || undefined,
      storeId: storeId || undefined,
      condition,
      location: location.trim() || 'Online / Pickup',
      images,
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setPrice('');
    setImages([]);
    setSubcategory('');
    setStoreId('');
    setCreateListingModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#17131A] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FCE7F3] dark:bg-[#BE185D]/25 text-[#BE185D] dark:text-[#FCE7F3] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Marketplace Listing
              </h3>
              <p className="text-[11px] text-slate-400">List an item or service on Gistupp</p>
            </div>
          </div>
          <button
            onClick={() => setCreateListingModalOpen(false)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Images Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Photos ({images.length}/6)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group"
                >
                  <img src={img} alt="Product" className="w-full h-full object-contain bg-slate-100 dark:bg-slate-900" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E91E8C] text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {images.length < 6 && (
                <label className="h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#E91E8C] flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/30">
                  <Upload className="w-5 h-5 text-[#E91E8C] mb-1" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Add Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sony Alpha A7 IV Camera"
                maxLength={90}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price (NGN) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₦
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
              </div>
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => { const next = e.target.value as ProductCategory; setCategory(next); setSubcategory((SUBCATEGORIES[next] || ['Other'])[0]); }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subcategory</label>
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]">
                {(SUBCATEGORIES[category] || ['Other']).map((sub) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {stores.length > 0 && <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store (optional)</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]">
              <option value="">Personal marketplace listing</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Choose one of your stores to publish this product on its storefront.</p>
          </div>}

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location / Area
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#E91E8C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State or Online Delivery"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about condition, reason for selling, accessories included, and pickup/delivery terms..."
              rows={4}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E91E8C] resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex gap-2.5">
            <button
              type="button"
              onClick={() => setCreateListingModalOpen(false)}
              className="flex-1 min-h-[42px] py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[42px] py-2 text-xs font-bold rounded-xl bg-[#E91E8C] hover:bg-[#BE185D] text-white shadow-md shadow-[#E91E8C]/20 transition-all"
            >
              Publish Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
