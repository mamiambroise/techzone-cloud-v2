import React from 'react';
import { useLocation } from 'react-router-dom';

// Titres des pages
const pageTitles = {
  '/': 'Tableau de bord',
  '/erps': 'Gestion des ERP',
  '/erps/create': 'Ajouter un ERP',
  '/mapping': 'Mapping',
  '/adapters': 'Adapters',
  '/settings': 'Parametres',
};

function Header({ onToggleSidebar }) {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.startsWith('/erps/edit/')) return 'Modifier l\'ERP';
    return pageTitles[location.pathname] || 'ERP Adapter';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Gauche: menu + titre */}
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-700 mr-4 lg:hidden"
        >
          ☰
        </button>
        <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
      </div>

      {/* Droite: actions */}
      <div className="flex items-center space-x-4">
        <a
          href="http://localhost:3000/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 hidden sm:block"
        >
          API Docs
        </a>
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium cursor-pointer">
          A
        </div>
      </div>
    </header>
  );
}

export default Header;
