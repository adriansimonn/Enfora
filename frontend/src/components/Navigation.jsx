import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoText from '../assets/logos/logo_text_t.png';

export default function Navigation() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setActiveDropdown(null);
  };

  const handleLogout = () => {
    logout();
    setActiveDropdown(null);
    navigate('/');
  };

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img
              src={logoText}
              alt="Enfora"
              className="h-6 w-auto"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1" ref={dropdownRef}>
            {/* Dashboard Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('dashboard')}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-zinc-800/50 rounded-md transition-all duration-200 font-medium"
              >
                Dashboard
              </button>
              {activeDropdown === 'dashboard' && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={() => handleNavigate('/dashboard')}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    My Tasks
                  </button>
                  <button
                    onClick={() => handleNavigate('/dashboard')}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Analytics
                  </button>
                </div>
              )}
            </div>

            {/* Payments Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('payments')}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-zinc-800/50 rounded-md transition-all duration-200 font-medium"
              >
                Payments
              </button>
              {activeDropdown === 'payments' && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={() => handleNavigate('/payments')}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Payment History
                  </button>
                  <button
                    onClick={() => handleNavigate('/payments/methods')}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Payment Methods
                  </button>
                </div>
              )}
            </div>

            {/* Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('account')}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-zinc-800/50 rounded-md transition-all duration-200 font-medium"
              >
                Account
              </button>
              {activeDropdown === 'account' && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-50">
                  {user && (
                    <div className="px-4 py-2 border-b border-zinc-700">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm text-gray-300 truncate">{user.email}</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleNavigate('/account/settings')}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => handleNavigate('/account/profile')}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Profile
                  </button>
                  {user && (
                    <>
                      <div className="border-t border-zinc-700 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  )}
                  {!user && (
                    <button
                      onClick={() => handleNavigate('/login')}
                      className="w-full text-left px-4 py-2 text-blue-400 hover:bg-zinc-800 hover:text-blue-300 transition-colors"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
