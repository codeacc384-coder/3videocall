import React, { useState, useEffect } from 'react';
import { PortalRole, UserProfile } from './types/insurance';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Breadcrumbs } from './components/common/Breadcrumbs';
import { ToastContainer, ToastMessage } from './components/common/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { CustomerPortal } from './components/portals/CustomerPortal';
import { AdvisorPortal } from './components/portals/AdvisorPortal';
import { OfficerPortal } from './components/portals/OfficerPortal';
import { AdminPortal } from './components/portals/AdminPortal';
import { supabase } from './lib/supabase';
import { useProfile, toUserProfile } from './hooks/useProfile';

type AuthPage = 'login' | 'register';

export function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [currentRole, setCurrentRole] = useState<PortalRole>('customer');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { profile } = useProfile(userId);

  // Check session on mount — show login page until confirmed
  useEffect(() => {
    const syncAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;
      setSessionUser(authUser);
      setUserId(authUser?.id ?? null);

      const roleFromMeta = authUser?.user_metadata?.role as PortalRole | undefined;
      if (roleFromMeta) {
        setCurrentRole(roleFromMeta);
      }

      setSessionLoading(false);
    };

    syncAuthState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setSessionUser(authUser);
      setUserId(authUser?.id ?? null);

      const roleFromMeta = authUser?.user_metadata?.role as PortalRole | undefined;
      if (roleFromMeta) {
        setCurrentRole(roleFromMeta);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profile?.role) {
      setCurrentRole(profile.role);
    }
  }, [profile?.role]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleLogin = (role: PortalRole) => {
    setCurrentRole(role);
    setActiveTab('dashboard');
    addToast('success', 'Logged In Successfully', `Welcome to IndiaFirst Life ${role.toUpperCase()} Portal.`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setUserId(null);
    setCurrentRole('customer');
    setAuthPage('login');
    addToast('info', 'Logged Out', 'You have been safely signed out.');
  };

  const handleRoleChange = (newRole: PortalRole) => {
    setCurrentRole(newRole);
    setActiveTab('dashboard');
    addToast('info', 'Portal Switched', `Now viewing IndiaFirst Life ${newRole.toUpperCase()} Portal.`);
  };

  const handleExportData = () => {
    addToast('success', 'Data Exported', `Generated report for ${currentRole.toUpperCase()} - ${activeTab.toUpperCase()}.`);
  };

  const handleRefreshData = () => {
    addToast('info', 'Data Synchronized', 'Refreshed latest records from Supabase.');
  };

  // Show nothing while checking session (avoids flash of login page)
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-sm font-semibold animate-pulse">Loading IndiaFirst Portal...</div>
      </div>
    );
  }

  // Not logged in — show login or register
  if (!userId) {
    return (
      <>
        {authPage === 'login' ? (
          <LoginPage
            onLogin={handleLogin}
            onGoToRegister={() => setAuthPage('register')}
          />
        ) : (
          <RegisterPage
            onGoToLogin={() => setAuthPage('login')}
            onRegisterSuccess={() => {
              setAuthPage('login');
              addToast('success', 'Account Created', 'Registration successful! Please sign in.');
            }}
          />
        )}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // Build currentUser from real Supabase profile, fallback to generated avatar
  const currentUser: UserProfile = profile
    ? toUserProfile(profile)
    : {
        id: userId,
        name: sessionUser?.user_metadata?.full_name || sessionUser?.email || 'Loading...',
        email: sessionUser?.email || '',
        phone: sessionUser?.user_metadata?.phone || '',
        role: currentRole,
        designation: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionUser?.user_metadata?.full_name || sessionUser?.email || 'User')}&background=1d4ed8&color=fff&size=128`,
      };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'logout') handleLogout();
            else setActiveTab(tab);
          }}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Breadcrumbs
            currentRole={currentRole}
            activeTab={activeTab}
            onRefresh={handleRefreshData}
            onExport={handleExportData}
          />

          {currentRole === 'customer' && (
            <CustomerPortal
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchTerm={searchTerm}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}
          {currentRole === 'advisor' && (
            <AdvisorPortal
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchTerm={searchTerm}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}
          {currentRole === 'officer' && (
            <OfficerPortal
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchTerm={searchTerm}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}
          {currentRole === 'admin' && (
            <AdminPortal
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchTerm={searchTerm}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
