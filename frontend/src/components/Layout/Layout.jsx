import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getInitials, stringToColor } from '../../utils/formatters';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⬡' },
  { to: '/groups', label: 'Groups', icon: '◎' },
  { to: '/expenses', label: 'Expenses', icon: '◈' },
];

export default function Layout() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#1B2838] text-[#E8E0D0]" style={{borderRight: '2px solid #FFB000'}}>
        <div className="px-6 py-5" style={{borderBottom: '2px solid #FFB000'}}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">S</span>
            <span className="font-bold text-lg tracking-wider" style={{fontFamily: "'VT323', monospace", textShadow: '0 0 5px rgba(51,255,0,0.3)'}}>SPLITTR</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#33FF00] text-[#1B2838]' : 'text-[#E8E0D0] hover:bg-[#33FF00] hover:text-[#1B2838]'
                }`
              }
              style={({isActive}) => ({
                borderRadius: 0,
                boxShadow: isActive ? '0 0 10px rgba(51,255,0,0.3)' : 'none'
              })}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4" style={{borderTop: '2px solid #FFB000'}}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#1B2838] flex-shrink-0"
              style={{ backgroundColor: '#33FF00', borderRadius: 0 }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E8E0D0] truncate">{user?.name}</p>
              <p className="text-xs text-[#E8E0D0] truncate opacity-60">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-[#E8E0D0] hover:text-[#33FF00] transition-colors text-lg" title="Logout">⇤</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-[#1B2838] border-b" style={{borderBottom: '2px solid #FFB000'}} className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">S</span>
            <span className="font-bold" style={{fontFamily: "'VT323', monospace", color: '#33FF00', textShadow: '0 0 5px rgba(51,255,0,0.3)'}}>SPLITTR</span>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-[#33FF00] hover:text-[#1B2838]" style={{color: '#E8E0D0'}}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </header>

        {menuOpen && (
          <div className="md:hidden bg-[#1B2838] text-[#E8E0D0] px-3 py-4 space-y-1" style={{borderBottom: '2px solid #FFB000'}}>
            {NAV.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#33FF00] text-[#1B2838]' : 'text-[#E8E0D0]'
                  }`
                }
              >
                <span>{icon}</span>{label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-[#E8E0D0]">
              <span>⇤</span> Logout
            </button>
          </div>
        )}

        <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
