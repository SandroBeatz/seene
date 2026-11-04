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

export const variablesOf = (kind: MessageKind): readonly MessageVariable[] =>
  kind === 'recall' ? NO_VISIT_VARIABLES : VISIT_VARIABLES;
