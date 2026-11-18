/**
 * Kyrgyzstan reference data: 7 oblasts (regions) and major cities with real
 * WGS-84 coordinates. Region boundaries are loaded from
 * /data/kg-regions.geojson (geoBoundaries gbOpen, CC BY 4.0).
 */
export const KG_CITIES = [
  { id: 'bishkek', name: 'Bishkek', region: 'chuy', latitude: 42.8746, longitude: 74.5698, capital: true, pin: 'left' },
  { id: 'osh', name: 'Osh', region: 'osh', latitude: 40.5283, longitude: 72.7985 },
  { id: 'karakol', name: 'Karakol', region: 'issyk-kul', latitude: 42.4907, longitude: 78.3936 },
  { id: 'naryn', name: 'Naryn', region: 'naryn', latitude: 41.4287, longitude: 75.9911 },
  { id: 'talas', name: 'Talas', region: 'talas', latitude: 42.5228, longitude: 72.2427 },
  { id: 'tokmok', name: 'Tokmok', region: 'chuy', latitude: 42.8421, longitude: 75.3015, pin: 'right' },
  { id: 'jalal-abad', name: 'Jalal-Abad', region: 'jalal-abad', latitude: 40.9333, longitude: 73.0017 },
  { id: 'batken', name: 'Batken', region: 'batken', latitude: 40.0626, longitude: 70.8194, pin: 'right' },
  { id: 'isfana', name: 'Isfana', region: 'batken', latitude: 39.8389, longitude: 69.5276, pin: 'left' },
];

/** Regions in the same order as the original Weatherly app. */
export const KG_REGIONS = [
  { id: 'chuy', center: 'bishkek' },
  { id: 'talas', center: 'talas' },
  { id: 'issyk-kul', center: 'karakol' },
  { id: 'naryn', center: 'naryn' },
  { id: 'jalal-abad', center: 'jalal-abad' },
  { id: 'osh', center: 'osh' },
  { id: 'batken', center: 'batken' },
];

export const cityById = (id) => KG_CITIES.find((c) => c.id === id);
export const regionCenter = (regionId) => cityById(KG_REGIONS.find((r) => r.id === regionId)?.center);

export const KG_BOUNDS = [
  [39.15, 69.2],
  [43.3, 80.3],
];

/** Convert a KG city to the app's location shape. */
export function kgCityToLocation(city) {
  return {
    id: `kg-${city.id}`,
    kgId: city.id,
    name: city.name,
    country: 'Kyrgyzstan',
    countryCode: 'KG',
    admin1: null,
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

export const DEFAULT_LOCATION = kgCityToLocation(KG_CITIES[0]);
