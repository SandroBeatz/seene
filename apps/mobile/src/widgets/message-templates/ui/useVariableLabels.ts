import { useTranslation } from 'react-i18next';
import { MESSAGE_VARIABLES, type VariableLabels } from '@/entities/message-template';

export function useVariableLabels(): VariableLabels {
  const { t } = useTranslation();
  return Object.fromEntries(
    MESSAGE_VARIABLES.map((name) => [name, t(`menuHome.messages.variables.${name}`)]),
  ) as VariableLabels;
}
