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
    <nav className="bg-black border-b border-white/[0.06]">
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
            {user ? (
              <>
                {/* Dashboard Button */}
                <button
                  onClick={() => handleNavigate('/dashboard')}
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 font-normal"
                >
                  Dashboard
                </button>

                {/* Leaderboard Button */}
                <button
                  onClick={() => handleNavigate('/leaderboard')}
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 font-normal"
                >
                  Leaderboard
                </button>

                {/* Payments Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('payments')}
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 font-normal"
                  >
                    Payments
                  </button>
                  {activeDropdown === 'payments' && (
                    <div className="absolute right-0 mt-2 w-48 bg-black border border-white/[0.1] rounded-xl py-1.5 z-50">
                      <button
                        onClick={() => handleNavigate('/payments')}
                        className="w-full text-left px-4 py-2.5 text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200 font-light rounded-lg mx-1 my-0.5"
                      >
                        Payment History
                      </button>
                      <button
                        onClick={() => handleNavigate('/payments/methods')}
                        className="w-full text-left px-4 py-2.5 text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200 font-light rounded-lg mx-1 my-0.5"
                      >
                        Payment Methods
                      </button>
                    </div>
                  )}
                </div>

                {/* Account Dropdown */}
                <div className="relative pl-3">
                  <button
                    onClick={() => toggleDropdown('account')}
                    className="p-1 hover:bg-white/[0.06] rounded-full transition-all duration-200"
                  >
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.email}
                        className="w-8 h-8 rounded-full object-cover border border-white/[0.1]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-white/[0.1]">
                        <span className="text-xs font-medium text-white">
                          {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>
                  {activeDropdown === 'account' && (
                    <div className="absolute right-0 mt-2 w-56 bg-black border border-white/[0.1] rounded-xl py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-white/[0.06] mx-1">
                        <p className="text-xs text-gray-500 font-light">Signed in as</p>
                        <p className="text-sm text-gray-300 truncate font-light">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleNavigate('/account/settings')}
                        className="w-full text-left px-4 py-2.5 text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200 font-light rounded-lg mx-1 my-0.5"
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => handleNavigate(user.username ? `/profile/${user.username}` : '/account/profile')}
                        className="w-full text-left px-4 py-2.5 text-gray-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200 font-light rounded-lg mx-1 my-0.5"
                      >
                        Profile
                      </button>
                      <div className="border-t border-white/[0.06] my-1.5 mx-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-white/[0.06] hover:text-red-300 transition-all duration-200 font-light rounded-lg mx-1 my-0.5"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Sign Up Button */}
                <button
                  onClick={() => handleNavigate('/signup')}
                  className="px-4 py-2 text-gray-200 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 font-normal"
                >
                  Sign Up
                </button>

                {/* Log In Button */}
                <button
                  onClick={() => handleNavigate('/login')}
                  className="px-4 py-2 text-gray-200 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-200 font-normal"
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
