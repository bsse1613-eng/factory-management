import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  DollarSign, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userProfile: Profile | null;
}

const Layout: React.FC<LayoutProps> = ({ children, userProfile }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Purchases (Raw Material)', path: '/purchases', icon: Package },
    { name: 'Sales & Delivery', path: '/deliveries', icon: Truck },
    { name: 'Expenses', path: '/expenses', icon: DollarSign },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold tracking-wider">ALANKAR <span className="text-blue-400">AGRO</span></h1>
                <p className="text-xs text-slate-400 mt-1">
                    {userProfile?.role === 'owner' ? 'Administrator' : `${userProfile?.branch} Branch`}
                </p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
                <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 text-red-400 hover:text-red-300 hover:bg-slate-800 w-full px-4 py-3 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm lg:hidden flex items-center justify-between p-4 z-10">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
                <Menu size={24} />
            </button>
            <span className="font-semibold text-gray-800">Factory Manager</span>
            <div className="w-6"></div> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
