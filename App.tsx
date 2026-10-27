import React from 'react';
import { useApp, AppProvider } from './context/AppContext';
import { TopHeader } from './components/layout/TopHeader';
import { AndroidNavBar } from './components/layout/AndroidStatusBar';
import { AndroidBottomTabs } from './components/layout/AndroidBottomTabs';
import { AndroidDrawerMenu } from './components/layout/AndroidDrawerMenu';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { DesktopRightPanel } from './components/layout/DesktopRightPanel';
import { FeedView } from './components/feed/FeedView';
import { ExploreView } from './components/explore/ExploreView';
import { MessagesView } from './components/messages/MessagesView';
import { ProfileView } from './components/profile/ProfileView';
import { CommunitiesView } from './components/communities/CommunitiesView';
import { CreatorHubView } from './components/creator/CreatorHubView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { AndroidSettingsView } from './components/settings/AndroidSettingsView';
import { SavedView } from './components/saved/SavedView';
import { CreatePostModal } from './components/feed/CreatePostModal';
import { CreateStoryModal } from './components/feed/CreateStoryModal';
import { StoryViewerModal } from './components/feed/StoryViewerModal';
import { ReshareModal } from './components/feed/ReshareModal';
import { AiAssistantModal } from './components/ai/AiAssistantModal';
import { ReportModal } from './components/safety/ReportModal';
import { ModerationDashboardModal } from './components/safety/ModerationDashboardModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { NotificationsModal } from './components/notifications/NotificationsModal';
import { AuthModal } from './components/auth/AuthModal';
import { CreateListingModal } from './components/marketplace/CreateListingModal';
import { ListingDetailModal } from './components/marketplace/ListingDetailModal';
import { CreateCommunityWizard } from './components/communities/CreateCommunityWizard';
import { ToastNotification } from './components/ui/ToastNotification';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SplashScreen } from './components/ui/SplashScreen';

const MainContent: React.FC = () => {
  const {
    activeView,
    activeTab,
    setActiveView,
    setActiveTab,
    isCreateCommunityOpen,
    setIsCreateCommunityOpen,
    createCommunityInitialType,
  } = useApp();

  React.useEffect(() => {
    const handleHome = () => {
      setActiveTab('home');
      setActiveView('feed');
    };
    window.addEventListener('rose_navigate_home', handleHome);
    return () => window.removeEventListener('rose_navigate_home', handleHome);
  }, [setActiveTab, setActiveView]);

  // Route to the active view wrapped safely in ErrorBoundary
  const renderCurrentView = () => {
    let viewNode: React.ReactNode;

    if (activeView === 'settings') {
      viewNode = <AndroidSettingsView />;
    } else if (activeView === 'communities') {
      viewNode = <CommunitiesView />;
    } else if (activeView === 'creator-hub') {
      viewNode = <CreatorHubView />;
    } else if (activeView === 'saved') {
      viewNode = <SavedView />;
    } else if (activeView === 'reels') {
      viewNode = <ExploreView />;
    } else if (activeView === 'marketplace') {
      viewNode = <MarketplaceView />;
    } else {
      switch (activeTab) {
        case 'home':
          viewNode = <FeedView />;
          break;
        case 'explore':
          viewNode = <ExploreView />;
          break;
        case 'messages':
          viewNode = <MessagesView />;
          break;
        case 'market':
          viewNode = <MarketplaceView />;
          break;
        case 'profile':
          viewNode = <ProfileView />;
          break;
        default:
          viewNode = <FeedView />;
          break;
      }
    }

    return (
      <ErrorBoundary
        fallbackTitle="Error displaying section"
        onReset={() => {
          setActiveView('feed');
          setActiveTab('home');
        }}
      >
        {viewNode}
      </ErrorBoundary>
    );
  };

  const isWideFullView =
    activeTab === 'market' ||
    activeView === 'marketplace' ||
    activeTab === 'messages' ||
    activeView === 'communities' ||
    activeView === 'creator-hub' ||
    activeView === 'settings' ||
    activeView === 'saved';

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#120e14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar (Wordmark, links, notifications, account switcher, CTA, profile) */}
      <TopHeader />

      {/* Global Navigation Drawer for Mobile */}
      <AndroidDrawerMenu />

      {/* Modals & Dialogs */}
      <CreatePostModal />
      <CreateStoryModal />
      <StoryViewerModal />
      <ReshareModal />
      <AiAssistantModal />
      <ReportModal />
      <ModerationDashboardModal />
      <EditProfileModal />
      <UserProfileModal />
      <NotificationsModal />
      <AuthModal />
      <CreateListingModal />
      <ListingDetailModal />
      <CreateCommunityWizard
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
        initialType={createCommunityInitialType}
      />
      <ToastNotification />

      {/* Fully-Responsive Main Container */}
      <main className="flex-1 w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
        {/* Mobile & Tablet Viewport (Screen width < 1024px): Naturally responsive layout */}
        <div className={`block lg:hidden mx-auto pb-24 w-full transition-all ${isWideFullView ? 'max-w-4xl' : 'max-w-2xl'}`}>
          {renderCurrentView()}

          {/* Fixed Bottom Navigation Tabs for mobile & tablet */}
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#17131A]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-2xl mx-auto">
              <AndroidBottomTabs />
              <AndroidNavBar />
            </div>
          </div>
        </div>

        {/* Desktop Viewport (Screen width >= 1024px): Full-width spacious responsive workspace */}
        <div className="hidden lg:flex justify-center gap-6 xl:gap-8 items-start w-full max-w-[1520px] mx-auto">
          {/* Left Navigation Sidebar */}
          <DesktopSidebar />

          {/* Main Content Workspace */}
          {isWideFullView ? (
            /* Expansive full-width view for Marketplace, Messages, Communities, Settings */
            <div className="flex-1 min-w-0 max-w-6xl xl:max-w-7xl">
              {renderCurrentView()}
            </div>
          ) : (
            /* 3-Column balanced layout for Home Feed & Explore */
            <>
              <div className="flex-1 max-w-[620px] xl:max-w-[660px] shrink-0 min-w-0">
                {renderCurrentView()}
              </div>
              <DesktopRightPanel />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="RoseOne is recovering">
      <AppProvider>
        <SplashScreen />
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

