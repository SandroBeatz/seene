/** Templates hold variables as `{client_name}`; the master sees and types them as `[Имя клиента]`. */
import { DateTime } from 'luxon';
import { MESSAGE_VARIABLES, type MessageLanguage, type MessageVariable } from '../model/types';

const TOKEN = /\{([a-z_]+)\}/g;
const isVariable = (name: string): name is MessageVariable =>
  (MESSAGE_VARIABLES as readonly string[]).includes(name);

export type MessageValues = Partial<Record<MessageVariable, string | null>>;

export const usesVariable = (body: string, variable: MessageVariable) =>
  body.includes(`{${variable}}`);

/**
 * The text for the client. A line with a value we don't have goes as a whole: "Адрес: ." is
 * worse than no address. Text in braces that isn't a variable stays as typed.
 */
export function renderTemplate(body: string, values: MessageValues): string {
  return body
    .split('\n')
    .flatMap((line) => {
      let missing = false;
      const text = line.replace(TOKEN, (match, name: string) => {
        if (!isVariable(name)) return match;
        const value = values[name];
        if (!value) missing = true;
        return value ?? '';
      });
      return missing ? [] : [text];
    })
    .join('\n')
    .trim();
}

export type TemplateSegment = { text: string; variable?: MessageVariable };

/** For showing a template: plain text and the variables in between. */
export function templateSegments(body: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  let end = 0;
  for (const match of body.matchAll(TOKEN)) {
    const name = match[1];
    if (!isVariable(name)) continue;
    if (match.index > end) segments.push({ text: body.slice(end, match.index) });
    segments.push({ text: name, variable: name });
    end = match.index + match[0].length;
  }
  if (end < body.length) segments.push({ text: body.slice(end) });
  return segments;
}

export type VariableLabels = Record<MessageVariable, string>;

export const labelToken = (label: string) => `[${label}]`;

export function toEditable(body: string, labels: VariableLabels): string {
  return body.replace(TOKEN, (match, name: string) =>
    isVariable(name) ? labelToken(labels[name]) : match,
  );
}

export function fromEditable(text: string, labels: VariableLabels): string {
  return MESSAGE_VARIABLES.reduce(
    (body, variable) => body.split(labelToken(labels[variable])).join(`{${variable}}`),
    text,
  );
}

const JOIN: Record<MessageLanguage, string> = { ru: 'в', en: 'at', fr: 'à' };

/** "5 ноября в 16:00", in the client's language and the master's zone and clock. */
export function messageDateTime(
  utcIso: string,
  options: { zone: string; timeFormat: 12 | 24; language: MessageLanguage },
): string {
  const local = DateTime.fromISO(utcIso, { zone: 'utc' })
    .setZone(options.zone)
    .setLocale(options.language);
  const date = local.toFormat(options.language === 'en' ? 'MMMM d' : 'd MMMM');
  const time = local.toFormat(options.timeFormat === 12 ? 'h:mm a' : 'HH:mm');
  return `${date} ${JOIN[options.language]} ${time}`;
}

/** The master's fixed language, else the client's, else the master's own. */
export function messageLanguageFor(
  setting: string | null | undefined,
  clientLanguage: string | null | undefined,
  fallback: MessageLanguage,
): MessageLanguage {
  const known = (value: string | null | undefined): value is MessageLanguage =>
    value === 'ru' || value === 'en' || value === 'fr';
  if (known(setting)) return setting;
  return known(clientLanguage) ? clientLanguage : fallback;
}

/** A page of the site in that language: English has no prefix (`bookingLinkUrl` on the web). */
export function sitePath(siteUrl: string, language: MessageLanguage, path: string): string {
  return `${siteUrl}${language === 'en' ? '' : `/${language}`}/${path}`;
}
