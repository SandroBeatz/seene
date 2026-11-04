/** The standard texts (design AppMenuMessages). The database holds only what a master changed. */
import type { MessageKind, MessageLanguage, MessageVariable } from '../model/types';

export const DEFAULT_TEMPLATES: Record<MessageLanguage, Record<MessageKind, string>> = {
  ru: {
    confirmation:
      '{client_name}, ваша запись подтверждена.\nЖдём вас {date_time} на: {service}.\nСтоимость: {price}.\nАдрес: {address}.\nПодробнее: {booking_link}',
    reminder:
      '{client_name}, здравствуйте! Напоминаем о записи.\nЖдём вас {date_time} на: {service}.\nПодробнее: {booking_link}',
    recall:
      '{client_name}, здравствуйте! Напоминаем о себе, чтобы вы успели выбрать удобное время.\nСвободные окошки: {online_link}',
    cancellation: '{client_name}, ваша запись отменена.\n{date_time} — {service}.',
    reschedule:
      '{client_name}, ваша запись перенесена.\nЖдём вас {date_time} на: {service}.\nПодробнее: {booking_link}',
    day_off:
      '{client_name}, здравствуйте! Меня не будет {off_period}, поэтому вашу запись {date_time} нужно перенести.\nВыберите удобное время: {online_link}',
    thanks:
      '{client_name}, спасибо, что пришли! Будем рады видеть вас снова.\nЗаписаться: {online_link}',
    missed:
      '{client_name}, мы не дождались вас {date_time}. Запишемся на другое время?\nСвободные окошки: {online_link}',
  },
  en: {
    confirmation:
      '{client_name}, your booking is confirmed.\nSee you {date_time} for: {service}.\nPrice: {price}.\nAddress: {address}.\nDetails: {booking_link}',
    reminder:
      'Hello {client_name}! A reminder about your booking.\nSee you {date_time} for: {service}.\nDetails: {booking_link}',
    recall:
      'Hello {client_name}! Just a reminder, so you can pick a time that suits you.\nOpen slots: {online_link}',
    cancellation: '{client_name}, your booking is cancelled.\n{date_time} — {service}.',
    reschedule:
      '{client_name}, your booking has moved.\nSee you {date_time} for: {service}.\nDetails: {booking_link}',
    day_off:
      'Hello {client_name}! I am away {off_period}, so your booking {date_time} needs to move.\nPick a time that suits you: {online_link}',
    thanks:
      '{client_name}, thank you for coming! We would love to see you again.\nBook here: {online_link}',
    missed:
      '{client_name}, we missed you {date_time}. Shall we find another time?\nOpen slots: {online_link}',
  },
  fr: {
    confirmation:
      '{client_name}, votre rendez-vous est confirmé.\nÀ bientôt, {date_time}, pour : {service}.\nPrix : {price}.\nAdresse : {address}.\nDétails : {booking_link}',
    reminder:
      'Bonjour {client_name} ! Un rappel de votre rendez-vous.\nÀ bientôt, {date_time}, pour : {service}.\nDétails : {booking_link}',
    recall:
      'Bonjour {client_name} ! Un petit rappel pour que vous puissiez choisir un créneau qui vous convient.\nCréneaux libres : {online_link}',
    cancellation: '{client_name}, votre rendez-vous est annulé.\n{date_time} — {service}.',
    reschedule:
      '{client_name}, votre rendez-vous a été déplacé.\nÀ bientôt, {date_time}, pour : {service}.\nDétails : {booking_link}',
    day_off:
      'Bonjour {client_name} ! Je ne serai pas là {off_period}, votre rendez-vous {date_time} doit donc être déplacé.\nChoisissez un autre créneau : {online_link}',
    thanks:
      '{client_name}, merci de votre visite ! Au plaisir de vous revoir.\nRéserver : {online_link}',
    missed:
      '{client_name}, nous vous avons attendu {date_time}. On trouve un autre créneau ?\nCréneaux libres : {online_link}',
  },
};

const VISIT_VARIABLES: readonly MessageVariable[] = [
  'client_name',
  'date_time',
  'service',
  'price',
  'address',
  'master',
  'booking_link',
];

/** "Пора записаться" has no visit behind it: only what is known without one. */
const NO_VISIT_VARIABLES: readonly MessageVariable[] = [
  'client_name',
  'address',
  'master',
  'online_link',
];

export const variablesOf = (kind: MessageKind): readonly MessageVariable[] => {
  if (kind === 'recall') return NO_VISIT_VARIABLES;
  if (kind === 'day_off') return [...VISIT_VARIABLES, 'off_period', 'online_link'];
  return kind === 'thanks' || kind === 'missed'
    ? [...VISIT_VARIABLES, 'online_link']
    : VISIT_VARIABLES;
};
