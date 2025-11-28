import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { Profile } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Deliveries from './pages/Deliveries';
import Expenses from './pages/Expenses';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      if (session) {
        console.log('Session found, fetching profile for:', session.user.id);
        fetchProfile(session.user.id);
      } else {
        console.log('No initial session');
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error getting initial session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
      setSession(session);
      if (session) {
        console.log('Session active, fetching profile for:', session.user.id);
        fetchProfile(session.user.id);
      } else {
        // If we are not in demo mode (check manually), clear profile
        if (userProfile?.id !== 'demo') {
            setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [userProfile?.id]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Profile doesn't exist - create a default one
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const defaultProfile: Profile = {
            id: user.id,
            email: user.email || '',
            role: 'employee',
            branch: null,
            full_name: user.user_metadata?.full_name || 'User'
          };
          setUserProfile(defaultProfile);
        }
      } else if (data) {
        setUserProfile(data as Profile);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Manually set a session and profile for the demo user
    const demoProfile: Profile = {
      id: 'demo',
      email: 'visitor@factory.com',
      role: 'owner',
      branch: null,
      full_name: 'Visitor Admin'
    };
    setUserProfile(demoProfile);
    setSession({ user: { id: 'demo' } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !userProfile) {
    return <Auth onLogin={() => window.location.reload()} onDemoLogin={handleDemoLogin} />;
  }

  return (
    <Router>
      <Layout userProfile={userProfile}>
        <Routes>
          <Route path="/" element={<Dashboard userProfile={userProfile} />} />
          <Route path="/purchases" element={<Purchases userProfile={userProfile} />} />
          <Route path="/deliveries" element={<Deliveries userProfile={userProfile} />} />
          <Route path="/expenses" element={<Expenses userProfile={userProfile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;