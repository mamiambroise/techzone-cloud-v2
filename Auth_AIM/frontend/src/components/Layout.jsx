import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center text-sm text-gray-500">
          Techzone Cloud v1.0.0 — IAM & Governance
        </footer>
      </div>
    </div>
  );
}

export default Layout;
