import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MoreHorizontal, WifiOff } from 'lucide-react';
import Sidebar, { MobileDrawer } from './Sidebar.jsx';
import Header from './Header.jsx';
import WeatherBackground from '../weather/WeatherBackground.jsx';
import { NAV_ITEMS } from './navItems.js';
import { useI18n } from '../../context/SettingsContext.jsx';

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function BottomNav({ onMore }) {
  const { t } = useI18n();
  return (
    <nav
      className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[22px] px-1 py-1.5 shadow-glass dark:bg-ink-900/85 lg:hidden"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      aria-label={t('nav.menu')}
    >
      {NAV_ITEMS.filter((n) => n.mobile).map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-bold transition ${isActive ? 'text-brand-500 dark:text-brand-300' : 'muted'}`
          }
        >
          <Icon className="h-5 w-5" />
          <span className="w-full truncate text-center">{t(`nav.${key}`)}</span>
        </NavLink>
      ))}
      <button type="button" onClick={onMore} className="muted flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-bold">
        <MoreHorizontal className="h-5 w-5" />
        <span>{t('nav.more')}</span>
      </button>
    </nav>
  );
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const online = useOnline();
  const { t } = useI18n();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <WeatherBackground />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 px-3 pb-28 sm:px-5 lg:px-6 lg:pb-10">
          <Header onOpenMenu={() => setMenuOpen(true)} />
          {!online && (
            <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-300">
              <WifiOff className="h-4 w-4" /> {t('errors.offline')}
            </div>
          )}
          <main className="mx-auto max-w-[1400px]">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav onMore={() => setMenuOpen(true)} />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
