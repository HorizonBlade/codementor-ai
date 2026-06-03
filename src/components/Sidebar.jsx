import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, Home, BarChart3, Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getTranslation } from '../utils/translations';

const navItems = [
  { id: 'practice', icon: Home, path: '/' },
  { id: 'progress', icon: BarChart3, path: '/progress' },
  { id: 'settings', icon: Settings, path: '/settings' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const appLanguage = useAppStore((s) => s.appLanguage);

  const currentPath = location.pathname;

  const handleNav = (item) => {
    setCurrentPage(item.id);
    navigate(item.path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Brain size={28} />
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);
          const label = getTranslation(`nav.${item.id}`, appLanguage);
          return (
            <button
              key={item.id}
              className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav(item)}
              title={label}
            >
              <Icon size={22} />
              <span className="sidebar__tooltip">{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
