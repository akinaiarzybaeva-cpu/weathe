import { Bell, Database, Globe2, Loader2, LocateFixed, MapPin, Palette, RotateCcw, Ruler } from 'lucide-react';
import { useI18n, useSettings } from '../context/SettingsContext.jsx';
import { useSelectedLocation } from '../context/LocationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFormat } from '../hooks/useFormat.js';
import { LANGUAGES } from '../i18n/translations.js';
import { PageHeader, Segmented, Toggle } from '../components/ui/States.jsx';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="card">
      <h2 className="card-title mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-500 dark:text-brand-300" /> {title}
      </h2>
      <div className="divide-y divide-black/5 dark:divide-white/5">{children}</div>
    </section>
  );
}

function Row({ label, desc, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </label>
        {desc && <p className="muted mt-0.5 text-xs">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { t } = useI18n();
  const { settings, update, reset } = useSettings();
  const { location, locate, locating } = useSelectedLocation();
  const { notify } = useToast();
  const f = useFormat();

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        actions={
          <button
            type="button"
            className="btn-soft"
            onClick={() => {
              reset();
              notify(t('settings.resetDone'), 'success');
            }}
          >
            <RotateCcw className="h-4 w-4" /> {t('settings.reset')}
          </button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={Palette} title={t('settings.appearance')}>
          <Row label={t('settings.theme')}>
            <Segmented
              value={settings.theme}
              onChange={(theme) => update({ theme })}
              label={t('settings.theme')}
              options={[
                { value: 'light', label: t('settings.light') },
                { value: 'dark', label: t('settings.dark') },
                { value: 'system', label: t('settings.system') },
              ]}
            />
          </Row>
          <Row label={t('settings.animatedBg')} desc={t('settings.animatedBgDesc')} htmlFor="animated-bg">
            <Toggle id="animated-bg" checked={settings.animatedBg} onChange={(animatedBg) => update({ animatedBg })} label={t('settings.animatedBg')} />
          </Row>
        </Section>

        <Section icon={Globe2} title={t('settings.language')}>
          <Row label={t('settings.language')}>
            <Segmented value={settings.language} onChange={(language) => update({ language })} label={t('settings.language')} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} />
          </Row>
        </Section>

        <Section icon={Ruler} title={t('settings.units')}>
          <Row label={t('settings.temperatureUnit')}>
            <Segmented
              value={settings.tempUnit}
              onChange={(tempUnit) => update({ tempUnit })}
              label={t('settings.temperatureUnit')}
              options={[
                { value: 'c', label: t('settings.celsius') },
                { value: 'f', label: t('settings.fahrenheit') },
              ]}
            />
          </Row>
          <Row label={t('settings.windUnit')}>
            <Segmented
              value={settings.windUnit}
              onChange={(windUnit) => update({ windUnit })}
              label={t('settings.windUnit')}
              options={['kmh', 'ms', 'mph', 'kn'].map((u) => ({ value: u, label: t(`settings.${u}`) }))}
            />
          </Row>
          <Row label={t('settings.pressureUnit')}>
            <Segmented
              value={settings.pressureUnit}
              onChange={(pressureUnit) => update({ pressureUnit })}
              label={t('settings.pressureUnit')}
              options={[
                { value: 'hpa', label: t('settings.hpa') },
                { value: 'mmhg', label: t('settings.mmhg') },
              ]}
            />
          </Row>
        </Section>

        <Section icon={MapPin} title={t('settings.location')}>
          <Row label={t('settings.autoLocate')} desc={t('settings.autoLocateDesc')} htmlFor="auto-locate">
            <Toggle
              id="auto-locate"
              checked={settings.autoLocate}
              onChange={(autoLocate) => {
                update({ autoLocate });
                if (autoLocate) locate();
              }}
              label={t('settings.autoLocate')}
            />
          </Row>
          <Row label={`${f.placeName(location)}${location.country ? `, ${location.country}` : ''}`} desc={`${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`}>
            <button type="button" className="btn-soft" onClick={() => locate()} disabled={locating}>
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              {locating ? t('settings.locating') : t('settings.detectNow')}
            </button>
          </Row>
        </Section>

        <Section icon={Bell} title={t('settings.notifications')}>
          <Row label={t('settings.alerts')} desc={t('settings.alertsDesc')} htmlFor="alerts">
            <Toggle id="alerts" checked={settings.alertsEnabled} onChange={(alertsEnabled) => update({ alertsEnabled })} label={t('settings.alerts')} />
          </Row>
        </Section>

        <Section icon={Database} title={t('settings.about')}>
          <div className="space-y-3 text-sm">
            <p>{t('settings.aboutText')}</p>
            <p className="muted text-xs font-bold uppercase tracking-wider">{t('settings.sources')}</p>
            <ul className="muted space-y-1 text-xs">
              <li>
                <a className="hover:text-brand-500" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                  Open-Meteo
                </a> · CAMS · ERA5
              </li>
              <li>
                <a className="hover:text-brand-500" href="https://www.rainviewer.com/api.html" target="_blank" rel="noreferrer">
                  RainViewer
                </a>
              </li>
              <li>
                <a className="hover:text-brand-500" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                  OpenStreetMap
                </a> · CARTO
              </li>
              <li>geoBoundaries (CC BY 4.0)</li>
              <li>BigDataCloud</li>
              <li>Anthropic Claude</li>
            </ul>
          </div>
        </Section>
      </div>
    </div>
  );
}
