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

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading App</h1>
            <p className="text-gray-700 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/factory-management/';
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if supabase is properly configured
        if (!supabase) {
          console.warn('Supabase not configured, showing auth with demo option');
          setLoading(false);
          return;
        }

        // Check initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        console.log('Initial session check:', session?.user?.id);
        setSession(session);
        
        if (session) {
          console.log('Session found, fetching profile for:', session.user.id);
          await fetchProfile(session.user.id);
        } else {
          console.log('No initial session, showing auth screen');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error during auth initialization:', err);
        setInitError(err.message);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (only if supabase is configured)
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
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
      subscription = data.subscription;
    } catch (err) {
      console.warn('Could not set up auth subscription:', err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userProfile?.id]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error);
        // Profile doesn't exist - create a default one
        try {
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
        } catch (err) {
          console.error('Could not fetch user:', err);
          setLoading(false);
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

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-orange-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">{initError}</p>
          <p className="text-sm text-gray-600 mb-6">
            You can still use the demo mode to test the application.
          </p>
          <button
            onClick={() => {
              setInitError(null);
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!session || !userProfile) {
    return <Auth onLogin={() => window.location.reload()} onDemoLogin={handleDemoLogin} />;
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;