import { Link } from 'react-router-dom';
import { CloudOff } from 'lucide-react';
import { useI18n } from '../context/SettingsContext.jsx';
import { EmptyState } from '../components/ui/States.jsx';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="card">
      <EmptyState
        icon={CloudOff}
        title={t('notFound.title')}
        hint={t('notFound.body')}
        action={
          <Link to="/" className="btn-primary">
            {t('notFound.home')}
          </Link>
        }
      />
    </div>
  );
}
