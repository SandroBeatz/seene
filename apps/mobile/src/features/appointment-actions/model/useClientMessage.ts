/**
 * The text of a message to a client: the master's template in the right language, with the
 * visit's details and, when the template asks for it, a fresh personal link. Never fails: without
 * the link or the saved wording the master still gets a message to send.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  addressLine,
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import {
  createBookingLink,
  messageDateTime,
  messageLanguageFor,
  messageTemplatesOptions,
  renderTemplate,
  sitePath,
  templateBody,
  usesVariable,
  type MessageKind,
  type MessageTemplate,
} from '@/entities/message-template';
import { useUserId } from '@/entities/session';
import { SITE_URL } from '@/shared/config/site';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { deviceTimeZone } from '@/shared/lib/time-zone';

export interface ClientMessageInput {
  kind: MessageKind;
  clientName: string;
  clientLanguage: string | null | undefined;
  visit?: { id: string; startAt: string; services: string; price: string };
}

export function useClientMessage() {
  const { i18n } = useTranslation();
  const userId = useUserId() ?? '';
  const queryClient = useQueryClient();
  const profile = useMasterProfileQuery(userId).data;
  const settings = useMasterSettingsQuery(userId).data;

  return async function composeMessage(input: ClientMessageInput): Promise<string> {
    const own = settings?.language ?? i18n.language;
    const language = messageLanguageFor(
      settings?.message_language,
      input.clientLanguage,
      isSupportedLocale(own) ? own : 'en',
    );

    let templates: MessageTemplate[] = [];
    try {
      templates = await queryClient.ensureQueryData(messageTemplatesOptions(userId));
    } catch {
      // The standard wording then.
    }
    const body = templateBody(templates, input.kind, language);

    let bookingLink: string | null = null;
    if (input.visit && usesVariable(body, 'booking_link')) {
      try {
        const token = await createBookingLink(input.visit.id);
        bookingLink = token ? sitePath(SITE_URL, language, `c/${token}`) : null;
      } catch {
        // Its line goes; the rest of the message is still worth sending.
      }
    }

    const { visit } = input;
    return renderTemplate(body, {
      client_name: input.clientName,
      date_time: visit
        ? messageDateTime(visit.startAt, {
            zone: parseStoredSchedule(profile?.schedule)?.timezone ?? deviceTimeZone(),
            timeFormat: settings?.time_format === 12 ? 12 : 24,
            language,
          })
        : null,
      service: visit?.services,
      price: visit?.price,
      address: profile ? addressLine(profile) : null,
      master: profile?.first_name,
      booking_link: bookingLink,
      online_link: profile ? sitePath(SITE_URL, language, profile.username) : null,
    });
  };
}
