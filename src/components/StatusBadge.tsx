import { useLanguage } from '../i18n/LanguageContext';
import { delayMinutes, getRunStatus } from '../utils';

interface StatusBadgeProps {
  scheduled: string;
  estimated: string;
  cancelled?: boolean;
}

const LABEL_KEYS: Record<string, string> = {
  cancelled: 'statusCancelled',
  delayed: 'statusDelayed',
  'on-time': 'statusOnTime',
};

export function StatusBadge({ scheduled, estimated, cancelled }: StatusBadgeProps) {
  const { t } = useLanguage();
  const status = getRunStatus(scheduled, estimated, cancelled);
  const minutes = status === 'delayed' ? delayMinutes(scheduled, estimated) : 0;

  return (
    <span className={`status-badge status-${status}`}>
      {t(LABEL_KEYS[status])}
      {status === 'delayed' && ` ${t('delayedSuffix', { n: minutes })}`}
    </span>
  );
}
