import React, { useState, useEffect } from 'react';
import { Navbar, PublicPage } from './components/Navbar';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { SessionBanner } from './components/SessionBanner';
import { CustomCursor } from './components/CustomCursor';
import { ToastProvider } from './components/SerkoToast';
import { CommandPalette } from './components/CommandPalette';
import { ClauseCitationDrawer } from './components/ClauseCitationDrawer';
import { LandingPage } from './pages/LandingPage';
import { PlatformPage } from './pages/PlatformPage';
import { ForTeamsPage } from './pages/ForTeamsPage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';
import { UploadPage } from './pages/UploadPage';
import { ViewerPage } from './pages/ViewerPage';
import { QAPage } from './pages/QAPage';
import { ExportPage } from './pages/ExportPage';
import { apiClient, IndianLanguage, VisualStyle, UserProfile } from './api/client';

type StudioTab = 'upload' | 'viewer' | 'qa' | 'export';
type AppView = PublicPage | 'auth' | StudioTab;

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('pv_user') || sessionStorage.getItem('pv_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [documentName, setDocumentName] = useState<string | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguage>('en');
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>('professional_infographic');
  const [sessionBannerMsg, setSessionBannerMsg] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCitationDrawerOpen, setIsCitationDrawerOpen] = useState(false);

  useEffect(() => {
    // Global ⌘K / Ctrl+K keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Register session expiry interceptor (Req 11.4, 11.5)
    apiClient.onSessionExpired = () => {
      setSessionBannerMsg(
        'SESSION INACTIVITY PURGE: The 4-hour active threshold expired. Session artifacts were safely cleared from memory.'
      );
    };

    // Check existing session
    apiClient.session.get().then((res) => {
      if (res.success && res.data?.policy_document?.filename) {
        setDocumentName(res.data.policy_document.filename);
        if (res.data.selected_language) {
          setSelectedLanguage(res.data.selected_language);
        }
        if (res.data.selected_style) {
          setSelectedStyle(res.data.selected_style);
        }
      }
    }).catch(() => {});
  }, []);

  const isPublicView = ['home', 'platform', 'for_teams', 'about'].includes(currentView);
  const isStudioView = ['upload', 'viewer', 'qa', 'export'].includes(currentView);

  const handleEnterStudio = () => {
    if (user) {
      setCurrentView('upload');
    } else {
      setAuthMode('register');
      setCurrentView('auth');
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setCurrentView('upload');
  };

  const handleSignOut = async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem('pv_token');
    localStorage.removeItem('pv_user');
    sessionStorage.removeItem('pv_token');
    sessionStorage.removeItem('pv_user');
    setCurrentView('home');
  };

  const handleUploadSuccess = (docName: string, lang: IndianLanguage, style: VisualStyle) => {
    setDocumentName(docName);
    setSelectedLanguage(lang);
    setSelectedStyle(style);
    setCurrentView('viewer');
  };

  const handleResetSession = async () => {
    if (window.confirm('Reset current session? All generated visuals and conversation history will be cleared.')) {
      await apiClient.session.delete();
      setDocumentName(undefined);
      setCurrentView('upload');
      setSessionBannerMsg(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#000000] selection:bg-[#CF69E0]/25 relative overflow-x-hidden">
      {/* Custom Kinetic Cursor */}
      <CustomCursor />

      {/* Session Notification Banner */}
      {sessionBannerMsg && (
        <SessionBanner
          message={sessionBannerMsg}
          onDismiss={() => {
            setSessionBannerMsg(null);
            setCurrentView('upload');
          }}
        />
      )}

      {/* 1. Public Multi-Page Navigation Bar */}
      {isPublicView && (
        <Navbar
          currentPage={currentView as PublicPage}
          onNavigatePage={(page) => setCurrentView(page)}
          onEnterStudio={handleEnterStudio}
          user={user}
          onSignInClick={() => {
            setAuthMode('login');
            setCurrentView('auth');
          }}
          onRegisterClick={() => {
            setAuthMode('register');
            setCurrentView('auth');
          }}
          onSignOut={handleSignOut}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      )}

      {/* 2. Inside UI Dedicated Workspace Header (AgentOps Serko workbench header) */}
      {isStudioView && (
        <WorkspaceHeader
          activeTab={currentView as StudioTab}
          setActiveTab={(tab) => setCurrentView(tab)}
          documentName={documentName}
          onNewSession={documentName ? handleResetSession : undefined}
          user={user}
          onBackToWebsite={() => setCurrentView('home')}
          onSignOut={handleSignOut}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      )}

      {/* Main Viewport Content */}
      <main className="flex-1">
        {/* PUBLIC MULTI-PAGE VIEWS */}
        {currentView === 'home' && (
          <LandingPage
            onEnterStudio={handleEnterStudio}
            onSignIn={() => {
              setAuthMode('login');
              setCurrentView('auth');
            }}
            onRegister={() => {
              setAuthMode('register');
              setCurrentView('auth');
            }}
            onOpenCitationDrawer={() => setIsCitationDrawerOpen(true)}
          />
        )}

        {currentView === 'platform' && (
          <PlatformPage
            onEnterStudio={handleEnterStudio}
            onSignIn={() => {
              setAuthMode('login');
              setCurrentView('auth');
            }}
            onRegister={() => {
              setAuthMode('register');
              setCurrentView('auth');
            }}
          />
        )}

        {currentView === 'for_teams' && (
          <ForTeamsPage
            onEnterStudio={handleEnterStudio}
            onSignIn={() => {
              setAuthMode('login');
              setCurrentView('auth');
            }}
            onRegister={() => {
              setAuthMode('register');
              setCurrentView('auth');
            }}
          />
        )}

        {currentView === 'about' && (
          <AboutPage
            onEnterStudio={handleEnterStudio}
            onSignIn={() => {
              setAuthMode('login');
              setCurrentView('auth');
            }}
            onRegister={() => {
              setAuthMode('register');
              setCurrentView('auth');
            }}
          />
        )}

        {/* AUTHENTICATION VIEW */}
        {currentView === 'auth' && (
          <AuthPage
            initialMode={authMode}
            onSuccess={handleAuthSuccess}
            onBackToHome={() => setCurrentView('home')}
          />
        )}

        {/* INSIDE WORKSPACE SCREENS */}
        {currentView === 'upload' && (
          <UploadPage onSuccess={handleUploadSuccess} />
        )}

        {currentView === 'viewer' && (
          <ViewerPage
            currentLanguage={selectedLanguage}
            currentStyle={selectedStyle}
            onStyleChange={(newStyle) => setSelectedStyle(newStyle)}
            onOpenCitationDrawer={() => setIsCitationDrawerOpen(true)}
          />
        )}

        {currentView === 'qa' && (
          <QAPage
            currentLanguage={selectedLanguage}
            currentStyle={selectedStyle}
          />
        )}

        {currentView === 'export' && (
          <ExportPage />
        )}
      </main>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => setCurrentView(view as AppView)}
        onSelectLanguage={(lang) => setSelectedLanguage(lang)}
        onOpenCitationDrawer={() => setIsCitationDrawerOpen(true)}
        onOpenDiffModal={() => {
          setCurrentView('home');
          setTimeout(() => {
            const el = document.getElementById('before-after-diff');
            el?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Global IRDAI Clause Citation Drawer */}
      <ClauseCitationDrawer
        isOpen={isCitationDrawerOpen}
        onClose={() => setIsCitationDrawerOpen(false)}
      />

      {/* Inside UI Studio Footer (Shown when inside workbench) */}
      {isStudioView && (
        <footer className="border-t border-[#E5E7EB] bg-[#F6F6F6] py-4 px-6 sm:px-12 text-[#71717A] text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-[#158142]"></span>
            <span className="text-[#000000] font-bold tracking-tight">PolicyVision Studio</span>
            <span className="text-[#D4D4D8]">|</span>
            <span className="text-[#71717A] hidden md:inline">Generative Insurance Explainer Synthesis · 1024×1024 150 DPI</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px] text-[#71717A]">
            <span>8 Indic Languages</span>
            <span>Deterministic Grounding</span>
            <span>&copy; 2026 PolicyVision AI</span>
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
