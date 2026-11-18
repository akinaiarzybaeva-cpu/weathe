import { Star } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useI18n } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useFormat } from '../../hooks/useFormat.js';

export default function FavoriteButton({ location, className = 'icon-btn-solid' }) {
  const { isFavorite, toggle } = useFavorites();
  const { t } = useI18n();
  const { notify } = useToast();
  const { placeName } = useFormat();
  const fav = isFavorite(location);

  return (
    <button
      type="button"
      className={className}
      aria-pressed={fav}
      aria-label={fav ? t('favorites.remove') : t('favorites.add')}
      title={fav ? t('favorites.remove') : t('favorites.add')}
      onClick={(e) => {
        e.stopPropagation();
        const added = toggle(location);
        notify(t(added ? 'favorites.added' : 'favorites.removed', { city: placeName(location) }), added ? 'success' : 'info');
      }}
    >
      <Star className={`h-[18px] w-[18px] transition ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
    </button>
  );
}
