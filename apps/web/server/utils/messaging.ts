/**
 * Messages to clients: one-time codes and service messages about a booking.
 *
 * Everything goes through sendMessage(), so the provider can be swapped without
 * touching the routes. Until a provider is wired (WhatsApp Cloud API, Telegram
 * Gateway), the "log" provider writes the message to the server log: the full
 * text only in dev or where NUXT_OTP_EXPOSE_CODE=true, otherwise just the
 * template and a masked number.
 *
 * WhatsApp sends business-initiated messages only from approved templates, so
 * a message is a template name plus parameters; renderMessage() gives the text
 * that matches the template, for the log and for providers that take free text.
 */

export type MessageChannel = 'whatsapp' | 'telegram'
export type MessageLocale = 'en' | 'fr' | 'ru'

export type ServiceMessage =
  | { template: 'code'; code: string }
  | {
      template: 'booking_confirmed' | 'booking_pending'
      master: string
      /** "Friday, 24 October, 11:30" (ru: "пятница, 24 октября, 11:30") in the master's zone */
      when: string
      /** Personal link to cancel or move the booking */
      link: string
    }

export interface MessageRecipient {
  /** Canonical digits, no '+' */
  phone: string
  channel: MessageChannel
}

const TEXTS: Record<MessageLocale, Record<ServiceMessage['template'], string>> = {
  en: {
    code: 'Your Seene code: {code}. Do not share it with anyone.',
    booking_confirmed:
      'You are booked with {master} on {when}. To cancel or move the visit: {link}',
    booking_pending:
      'Your request to {master} for {when} has been sent; the master will confirm it. To cancel: {link}'
  },
  fr: {
    code: 'Votre code Seene : {code}. Ne le communiquez à personne.',
    booking_confirmed:
      'Votre rendez-vous avec {master} est confirmé : {when}. Pour annuler ou déplacer : {link}',
    booking_pending:
      'Votre demande à {master} pour {when} est envoyée ; elle sera confirmée par le professionnel. Pour annuler : {link}'
  },
  ru: {
    code: 'Код Seene: {code}. Никому его не сообщайте.',
    booking_confirmed: 'Вы записаны к {master}: {when}. Отменить или перенести: {link}',
    booking_pending:
      'Заявка к {master} на {when} отправлена, мастер её подтвердит. Отменить: {link}'
  }
}

/** A supported message language, English for anything else. */
export function messageLocale(value: unknown): MessageLocale {
  return value === 'fr' || value === 'ru' ? value : 'en'
}

export function renderMessage(message: ServiceMessage, locale: MessageLocale) {
  const template = (TEXTS[locale] ?? TEXTS.en)[message.template]
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (message as Record<string, unknown>)[key]
    return typeof value === 'string' ? value : match
  })
}

interface MessageProvider {
  send(to: MessageRecipient, message: ServiceMessage, locale: MessageLocale): Promise<void>
}

const logProvider: MessageProvider = {
  async send(to, message, locale) {
    if (import.meta.dev || useRuntimeConfig().otpExposeCode) {
      console.info(`[messaging] ${to.channel} → ${to.phone}: ${renderMessage(message, locale)}`)
      return
    }
    console.info(`[messaging] ${to.channel} → …${to.phone.slice(-4)}: ${message.template}`)
  }
}

function provider(): MessageProvider {
  return logProvider
}

/** Sends one message. Throws when the provider fails; the caller decides if that matters. */
export function sendMessage(
  to: MessageRecipient,
  message: ServiceMessage,
  locale: MessageLocale = 'en'
) {
  return provider().send(to, message, locale)
}

/** "Friday, 24 October, 11:30" — the visit time mid-sentence, in the master's zone. */
export function formatVisitTime(
  startAt: string,
  { locale, timezone, hour12 }: { locale: MessageLocale; timezone: string; hour12: boolean }
) {
  const at = new Date(startAt)
  const day = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone
  }).format(at)
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: timezone
  }).format(at)
  return `${day}, ${time}`
}
