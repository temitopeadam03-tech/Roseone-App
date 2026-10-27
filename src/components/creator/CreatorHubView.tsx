import React, { useState } from 'react';
import {
  Package,
  Plus,
  Star,
  BarChart3,
  Sparkles,
  ShoppingBag,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CreatorHubView: React.FC = () => {
  const { products, addProduct, analytics, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'analytics' | 'catalog' | 'campaigns'>('analytics');
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  // New product form
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState(25);
  const [prodCategory, setProdCategory] = useState('Digital Asset');
  const [prodDesc, setProdDesc] = useState('');

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodDesc.trim()) {
      showToast('Please fill all product fields', 'error');
      return;
    }
    addProduct({
      title: prodTitle.trim(),
      description: prodDesc.trim(),
      price: Number(prodPrice),
      category: prodCategory,
      image: '',
      stockStatus: 'digital',
    });
    setAddProductModalOpen(false);
    setProdTitle('');
    setProdDesc('');
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Header Hub Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#BE185D] via-[#E91E8C] to-[#E91E8C] rounded-3xl text-white shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>RoseOne Creator Hub</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold mt-1">Creator Performance & Store</h1>
            <p className="text-xs text-white/90 mt-0.5 max-w-lg">
              Manage your digital offerings, audience metrics, and publication campaigns.
            </p>
          </div>

          <button
            onClick={() => setAddProductModalOpen(true)}
            className="min-h-[38px] px-3.5 py-1.5 bg-white text-[#BE185D] font-bold text-xs rounded-xl shadow-xs hover:bg-white/90 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/20">
          {[
            { id: 'analytics', label: 'Analytics & Reach', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'catalog', label: 'Store & Products', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
            { id: 'campaigns', label: 'Campaigns', icon: <Calendar className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#BE185D] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-3">
          {/* Real KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              {
                label: 'Post Impressions',
                value: (analytics?.impressions30d ?? 0).toLocaleString(),
                desc: 'calculated from your posts',
              },
              {
                label: 'Reach',
                value: (analytics?.reach30d ?? 0).toLocaleString(),
                desc: 'unique accounts reached',
              },
              {
                label: 'Profile Visits',
                value: (analytics?.profileVisits30d ?? 0).toLocaleString(),
                desc: 'total profile views',
              },
              {
                label: 'Engagement Rate',
                value: `${analytics?.engagementRate ?? 0}%`,
                desc: 'interactions per view',
              },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
              >
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {kpi.label}
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {kpi.value}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">{kpi.desc}</span>
              </div>
            ))}
          </div>

          {/* Growth Box */}
          <div className="p-4 bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Performance Insights
            </h3>
            <p className="text-xs text-slate-500">
              {analytics.impressions30d === 0
                ? 'Your reach analytics will populate dynamically as you publish posts and interact with followers.'
                : `Your content has generated ${analytics.impressions30d} impressions across RoseOne.`}
            </p>
          </div>
        </div>
      )}

      {/* Products & Store Tab */}
      {activeTab === 'catalog' && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No products in catalog
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add your first digital item or service to showcase to your RoseOne audience.
              </p>
              <button
                onClick={() => setAddProductModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#E91E8C] tracking-wide uppercase px-2 py-0.5 rounded-md bg-[#FCE7F3] dark:bg-[#BE185D]/20">
                        {prod.category}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        ${prod.price}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {prod.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Available in store</span>
                    <button
                      onClick={() =>
                        showToast(`Storefront preview: "${prod.title}"`, 'info')
                      }
                      className="text-xs font-bold text-[#E91E8C] hover:underline"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="p-8 text-center bg-white dark:bg-[#17131A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No scheduled campaigns
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Plan scheduled announcements, live community events, and product launches here.
          </p>
          <button
            onClick={() => showToast('Campaign manager: schedule your next launch with RoseOne tools', 'info')}
            className="mt-3.5 px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      )}

      {/* Add Product Modal */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#17131A] rounded-2xl w-full max-w-sm p-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Add Store Item or Service
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Product / Service Name
                </label>
                <input
                  type="text"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="e.g. Design Coaching 1-on-1"
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                  >
                    <option value="Digital Asset">Digital Asset</option>
                    <option value="Coaching">Coaching</option>
                    <option value="Template">Template</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Describe what buyers will receive..."
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17131A] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddProductModalOpen(false)}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-[#E91E8C] text-white hover:bg-[#BE185D]"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
