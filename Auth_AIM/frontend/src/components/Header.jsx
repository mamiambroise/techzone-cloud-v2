import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (!user) return 'Utilisateur';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email || 'Utilisateur';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-700 mr-4 lg:hidden"
        >
          ☰
        </button>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">Application</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">v1.0.0</span>
          <span className="text-xs text-gray-400 hidden sm:inline">|</span>
          <span className="text-xs text-gray-500 hidden sm:inline">ERP</span>
          <span className="text-xs text-gray-400 hidden md:inline">|</span>
          <span className="text-xs text-gray-500 hidden md:inline">Environnement: Dev</span>
          <span className="text-xs text-gray-400 hidden lg:inline">|</span>
          <span className="text-xs text-gray-500 hidden lg:inline">Tenant: Default</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none w-40"
          />
        </div>

        <button className="relative text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <div className="flex items-center space-x-3 ml-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {getInitials()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{getDisplayName()}</p>
            <p className="text-xs text-gray-500">{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-600 hover:text-red-800 ml-2"
            title="Deconnexion"
          >
            Deconnexion
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
