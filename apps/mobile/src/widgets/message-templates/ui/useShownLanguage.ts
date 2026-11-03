import { useTranslation } from 'react-i18next';
import { useMasterSettingsQuery } from '@/entities/master';
import { messageLanguageFor, type MessageLanguage } from '@/entities/message-template';
import { useUserId } from '@/entities/session';

/** The language the screen shows and edits: the fixed one, else the master's own. */
export function useShownLanguage(): MessageLanguage {
  const { i18n } = useTranslation();
  const settings = useMasterSettingsQuery(useUserId() ?? '');
  return messageLanguageFor(settings.data?.message_language, i18n.language, 'en');
}
