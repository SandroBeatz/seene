/** The note sheet's texts and quick chips in the app language (`note.*`). */
import { useTranslation } from 'react-i18next';

const CHIPS = ['allergy', 'favouriteShade', 'sensitiveSkin', 'runsLate'] as const;

export function useNoteSheetText() {
  const { t, i18n } = useTranslation();
  return {
    locale: i18n.language,
    chips: CHIPS.map((chip) => t(`note.chips.${chip}`)),
    labels: {
      title: t('note.title'),
      titleNew: t('note.titleNew'),
      field: t('note.field'),
      placeholder: t('note.placeholder'),
      private: t('note.private'),
      delete: t('note.delete'),
      save: t('common.save'),
      close: t('common.close'),
    },
  };
}
