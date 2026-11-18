import { Component, Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { WeatherProvider } from './context/WeatherContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { ErrorState, Skeleton } from './components/ui/States.jsx';

// Heavier pages (maps, charts, chat) are code-split.
const Forecast = lazy(() => import('./pages/Forecast.jsx'));
const KyrgyzstanMap = lazy(() => import('./pages/KyrgyzstanMap.jsx'));
const Radar = lazy(() => import('./pages/Radar.jsx'));
const AirQuality = lazy(() => import('./pages/AirQuality.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Assistant = lazy(() => import('./pages/Assistant.jsx'));
const Favorites = lazy(() => import('./pages/Favorites.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

/** Catches render errors in a page so the rest of the app keeps working. */
class PageBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[page error]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card">
          <ErrorState onRetry={() => this.setState({ error: null })} />
        </div>
      );
    }
    return this.props.children;
  }
}

const page = (el) => (
  <PageBoundary>
    <Suspense fallback={<Skeleton className="h-[60vh] rounded-3xl" />}>{el}</Suspense>
  </PageBoundary>
);

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <LocationProvider>
          <FavoritesProvider>
            <WeatherProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={page(<Dashboard />)} />
                    <Route path="forecast" element={page(<Forecast />)} />
                    <Route path="kyrgyzstan" element={page(<KyrgyzstanMap />)} />
                    <Route path="radar" element={page(<Radar />)} />
                    <Route path="air-quality" element={page(<AirQuality />)} />
                    <Route path="analytics" element={page(<Analytics />)} />
                    <Route path="assistant" element={page(<Assistant />)} />
                    <Route path="favorites" element={page(<Favorites />)} />
                    <Route path="settings" element={page(<Settings />)} />
                    <Route path="*" element={page(<NotFound />)} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </WeatherProvider>
          </FavoritesProvider>
        </LocationProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
