import { NavLink } from 'react-router-dom';
import { CloudSun, X } from 'lucide-react';
import { useI18n } from '../../context/SettingsContext.jsx';
import { NAV_ITEMS } from './navItems.js';
import { ThemeSwitch } from './Header.jsx';

export function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
        <CloudSun className="h-5 w-5 text-white" />
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold tracking-tight">
          WEATHERLY <span className="text-brand-500 dark:text-brand-300">PRO</span>
        </p>
        <p className="muted text-[11px] font-semibold">{t('app.tagline')}</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-1" aria-label={t('nav.menu')}>
      {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Icon className="h-[18px] w-[18px]" />
          {t(`nav.${key}`)}
        </NavLink>
      ))}
    </nav>
  );
}

/** Desktop sidebar (lg+). */
export default function Sidebar() {
  return (
    <aside className="glass sticky top-4 z-30 m-4 mr-0 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col gap-8 rounded-[28px] p-4 lg:flex">
      <Brand />
      <NavList />
      <p className="muted mt-auto px-2 text-[11px] leading-relaxed">Open-Meteo · RainViewer · OpenStreetMap</p>
    </aside>
  );
}

/** Slide-in drawer for tablet/mobile. */
export function MobileDrawer({ open, onClose }) {
  const { t } = useI18n();
  return (
    <div className={`fixed inset-0 z-[1150] lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside
        className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto bg-[var(--bg)] p-4 shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menu')}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('header.closeMenu')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavList onNavigate={onClose} />
        <div className="mt-auto flex items-center justify-between gap-3 px-2">
          <span className="muted text-xs font-bold">{t('header.toggleTheme')}</span>
          <ThemeSwitch className="flex" />
        </div>
      </aside>
    </div>
  );
}
