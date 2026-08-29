import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/erps', label: 'ERP Registry', icon: '🗄️' },
  { path: '/mapping', label: 'Mapping', icon: '📝' },
  { path: '/adapters', label: 'Adapters', icon: '🔌' },
  { path: '/settings', label: 'Parametres', icon: '⚙️' },
];

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white shadow-lg z-50 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
        {isOpen && (
          <div>
            <h1 className="text-lg font-bold text-blue-400">ERP ADAPTER</h1>
            <p className="text-xs text-gray-400">Plateforme de gestion</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white p-1 rounded"
          title={isOpen ? 'Replier' : 'Deplier'}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={item.label}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Profil utilisateur */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-gray-400">admin@erp.local</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
