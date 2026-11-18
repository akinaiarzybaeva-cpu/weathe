import { memo } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useWeather } from '../../context/WeatherContext.jsx';
import { sceneFor } from '../../lib/weatherCodes.js';

const CLOUDS = [
  { top: '6%', width: 420, dur: 95, delay: -20 },
  { top: '18%', width: 300, dur: 120, delay: -70 },
  { top: '32%', width: 520, dur: 150, delay: -40 },
];

/** Full-screen animated backdrop that follows the current real weather. */
function WeatherBackground() {
  const { settings } = useSettings();
  const { forecast } = useWeather();
  const cur = forecast.data?.current;
  const scene = cur ? sceneFor(cur.weather_code, cur.is_day === 1) : 'cloudy';
  const animated = settings.animatedBg;

  const night = scene.endsWith('-night');
  const showClouds = ['partly', 'partly-night', 'cloudy', 'rain', 'snow', 'storm'].includes(scene);

  return (
    <div className={`wx-bg wx-${scene}`} aria-hidden="true">
      {animated && (
        <>
          {scene === 'clear' && <div className="wx-sun" />}
          {scene === 'partly' && <div className="wx-sun" style={{ opacity: 0.6 }} />}
          {night && <div className="wx-stars" />}
          {showClouds &&
            CLOUDS.map((c, i) => (
              <div
                key={i}
                className="wx-cloud"
                style={{ top: c.top, width: c.width, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
              />
            ))}
          {(scene === 'rain' || scene === 'storm') && (
            <>
              <div className="wx-rain-layer back" />
              <div className="wx-rain-layer" />
            </>
          )}
          {scene === 'storm' && <div className="wx-flash" />}
          {scene === 'snow' && (
            <>
              <div className="wx-snow-layer back" />
              <div className="wx-snow-layer" />
            </>
          )}
          {scene === 'fog' && (
            <>
              <div className="wx-fog-layer" style={{ top: '20%' }} />
              <div className="wx-fog-layer" style={{ top: '55%', animationDelay: '-12s' }} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default memo(WeatherBackground);
