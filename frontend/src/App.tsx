import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SessionBanner } from './components/SessionBanner';
import { CustomCursor } from './components/CustomCursor';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { UploadPage } from './pages/UploadPage';
import { ViewerPage } from './pages/ViewerPage';
import { QAPage } from './pages/QAPage';
import { ExportPage } from './pages/ExportPage';
import { apiClient, IndianLanguage, VisualStyle, UserProfile } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'landing' | 'auth' | 'upload' | 'viewer' | 'qa' | 'export'>('landing');
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

  const handleTabChange = (tab: 'landing' | 'auth' | 'upload' | 'viewer' | 'qa' | 'export') => {
    // If user clicks a studio tab without being authenticated, prompt authentication
    if (['upload', 'viewer', 'qa', 'export'].includes(tab) && !user) {
      setAuthMode('login');
      setActiveTab('auth');
      return;
    }
    setActiveTab(tab);
  };

  const handleEnterStudio = () => {
    if (user) {
      setActiveTab('upload');
    } else {
      setAuthMode('register');
      setActiveTab('auth');
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setActiveTab('upload');
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
    setActiveTab('landing');
  };

  const handleUploadSuccess = (docName: string, lang: IndianLanguage, style: VisualStyle) => {
    setDocumentName(docName);
    setSelectedLanguage(lang);
    setSelectedStyle(style);
    setActiveTab('viewer');
  };

  const handleResetSession = async () => {
    if (window.confirm('Reset current session? All generated visuals and conversation history will be cleared.')) {
      await apiClient.session.delete();
      setDocumentName(undefined);
      setActiveTab('upload');
      setSessionBannerMsg(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* Custom Kinetic Cursor */}
      <CustomCursor />

      {/* Atmospheric Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-orange-100/60 via-pink-100/30 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-t from-orange-100/40 to-transparent blur-3xl pointer-events-none -z-10" />

      {sessionBannerMsg && (
        <SessionBanner
          message={sessionBannerMsg}
          onDismiss={() => {
            setSessionBannerMsg(null);
            setActiveTab('upload');
          }}
        />
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        documentName={documentName}
        onNewSession={documentName ? handleResetSession : undefined}
        user={user}
        onSignInClick={() => {
          setAuthMode('login');
          setActiveTab('auth');
        }}
        onRegisterClick={() => {
          setAuthMode('register');
          setActiveTab('auth');
        }}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'landing' && (
          <LandingPage
            onEnterStudio={handleEnterStudio}
            onSignIn={() => {
              setAuthMode('login');
              setActiveTab('auth');
            }}
            onRegister={() => {
              setAuthMode('register');
              setActiveTab('auth');
            }}
          />
        )}

        {activeTab === 'auth' && (
          <AuthPage
            initialMode={authMode}
            onSuccess={handleAuthSuccess}
            onBackToHome={() => setActiveTab('landing')}
          />
        )}

        {activeTab === 'upload' && (
          <UploadPage onSuccess={handleUploadSuccess} />
        )}

        {activeTab === 'viewer' && (
          <ViewerPage
            currentLanguage={selectedLanguage}
            currentStyle={selectedStyle}
            onStyleChange={(newStyle) => setSelectedStyle(newStyle)}
          />
        )}

        {activeTab === 'qa' && (
          <QAPage
            currentLanguage={selectedLanguage}
            currentStyle={selectedStyle}
          />
        )}

        {activeTab === 'export' && (
          <ExportPage />
        )}
      </main>

      {/* Modern Light Studio Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-6 sm:px-12 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-800 font-bold tracking-tight">PolicyVision Studio</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 hidden md:inline">IRDAI Compliant Insurance Visual Synthesis • 150 DPI</span>
        </div>
        <div className="flex items-center space-x-6 text-[11px] text-slate-500">
          <span>8 Indic Languages</span>
          <span>Verified Grounding</span>
          <span>&copy; 2026 PolicyVision AI</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
