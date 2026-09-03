import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import './AdminLayout.css';

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) +
          ' ' +
          now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`admin-main ${sidebarOpen ? 'admin-main-open' : 'admin-main-closed'}`}>
        <Topbar />
        <main className="admin-content">
          <Outlet />
        </main>
        <footer className="admin-footer">
          <div className="admin-footer-left">
            Techzone Cloud Admin v1.2.0 · © 2026 Techzone IT Solution · Tous droits réservés
          </div>
          <div className="admin-footer-right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.375rem', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="admin-footer-time">{time}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;