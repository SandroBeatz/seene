import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMessageTemplates,
  resetMessageTemplate,
  saveMessageTemplate,
} from '../api/message-template.api';
import { DEFAULT_TEMPLATES } from '../config/defaults';
import type { MessageKind, MessageLanguage, MessageTemplate } from './types';

export const messageTemplatesOptions = (userId: string) =>
  queryOptions({
    queryKey: ['message-templates', userId],
    queryFn: () => getMessageTemplates(userId),
    enabled: !!userId,
  });

export function useMessageTemplatesQuery(userId: string) {
  return useQuery(messageTemplatesOptions(userId));
}

/** The master's own wording, else the standard one. */
export function templateBody(
  templates: readonly MessageTemplate[] | undefined,
  kind: MessageKind,
  language: MessageLanguage,
): string {
  return (
    templates?.find((row) => row.kind === kind && row.language === language)?.body ??
    DEFAULT_TEMPLATES[language][kind]
  );
}

export function useSaveMessageTemplateMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: MessageKind; language: MessageLanguage; body: string }) =>
      // The standard text needs no row: it follows any later change to the standard.
      input.body === DEFAULT_TEMPLATES[input.language][input.kind]
        ? resetMessageTemplate(userId, input.kind, input.language)
        : saveMessageTemplate(userId, input.kind, input.language, input.body),
    onSettled: () => qc.invalidateQueries(messageTemplatesOptions(userId)),
  });
}
