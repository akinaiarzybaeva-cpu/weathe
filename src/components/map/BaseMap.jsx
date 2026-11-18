import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * OpenStreetMap standard tiles. In dark mode only the basemap is
 * colour-inverted with CSS, so weather overlays keep their true colours.
 */
export function ThemedTiles() {
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      className="basemap-tiles"
      maxZoom={19}
    />
  );
}

/** Custom glass zoom / locate controls (the default Leaflet ones are hidden). */
export function MapControls({ onLocate, locateLabel, extra }) {
  const map = useMap();
  return (
    <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
      <button type="button" className="icon-btn-solid bg-white/80 dark:bg-ink-850/80" onClick={() => map.zoomIn()} aria-label="+">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" className="icon-btn-solid bg-white/80 dark:bg-ink-850/80" onClick={() => map.zoomOut()} aria-label="−">
        <Minus className="h-4 w-4" />
      </button>
      {onLocate && (
        <button type="button" className="icon-btn-solid bg-white/80 dark:bg-ink-850/80" onClick={() => onLocate(map)} aria-label={locateLabel} title={locateLabel}>
          <LocateFixed className="h-4 w-4" />
        </button>
      )}
      {extra}
    </div>
  );
}

/** Leaflet needs a size recalculation when its container changes size. */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export default function BaseMap({ children, className = '', ...props }) {
  return (
    <MapContainer className={`h-full w-full ${className}`} zoomControl={false} worldCopyJump {...props}>
      <ThemedTiles />
      <AutoResize />
      {children}
    </MapContainer>
  );
}
