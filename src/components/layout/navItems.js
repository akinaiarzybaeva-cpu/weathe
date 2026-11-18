import { BarChart3, Bot, CalendarDays, LayoutDashboard, Map, Radar, Settings, Star, Wind } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard, mobile: true },
  { to: '/forecast', key: 'forecast', icon: CalendarDays, mobile: true },
  { to: '/kyrgyzstan', key: 'kyrgyzstan', icon: Map, mobile: true },
  { to: '/radar', key: 'radar', icon: Radar },
  { to: '/air-quality', key: 'airQuality', icon: Wind },
  { to: '/analytics', key: 'analytics', icon: BarChart3 },
  { to: '/assistant', key: 'assistant', icon: Bot, mobile: true },
  { to: '/favorites', key: 'favorites', icon: Star },
  { to: '/settings', key: 'settings', icon: Settings },
];
