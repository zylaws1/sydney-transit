import { useLanguage } from '../i18n/LanguageContext';
import type { Stop } from '../types';

interface StopFieldProps {
  label: string;
  value: Stop | null;
  onPress: () => void;
}

export function StopField({ label, value, onPress }: StopFieldProps) {
  const { t } = useLanguage();
  return (
    <div className="stop-picker">
      <span className="stop-picker-label">{label}</span>
      <button className={`stop-picker-chosen ${value ? '' : 'placeholder'}`} onClick={onPress}>
        {value ? value.name : t('tapToChoose')}
        <span className="stop-picker-change">{value ? t('changeLabel') : t('selectLabel')}</span>
      </button>
    </div>
  );
}
