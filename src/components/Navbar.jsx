import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  if (!isAuthenticated) {
    return null; // Don't show navbar on login/signup page
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
                Renty
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActivePage('/dashboard')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Search Tenants
              </Link>
              <Link
                to="/add-tenant"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActivePage('/add-tenant')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Add Tenant
              </Link>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    L
                  </span>
                </div>
              )}
              
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email}
                </div>
                <div className="text-xs text-gray-500">
                  Landlord
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/dashboard"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActivePage('/dashboard')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            Dashboard
          </Link>
          
          <Link
            to="/your-profile"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActivePage('/your-profile')
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            Your Profile
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
