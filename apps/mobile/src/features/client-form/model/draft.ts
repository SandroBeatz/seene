/**
 * The "Новый клиент" / "Редактировать" form as plain state, and its check before
 * saving. Phones are typed as the master sees them and saved as canonical digits;
 * a messenger the master added must be valid or removed. Pure; unit-tested.
 */
import {
  isValidBirthday,
  normalizeInstagram,
  normalizeTelegram,
  type Client,
  type ClientCardDto,
} from '@/entities/client';
import { isAvatarColorKey, type AvatarColorKey } from '@/shared/config/palettes';
import {
  formatPhone,
  nationalDisplay,
  phoneCountry,
  resolvePhoneInput,
  type CountryCode,
} from '@/shared/lib/phone';

export type Messenger = 'whatsapp' | 'telegram' | 'instagram';
export const MESSENGERS: readonly Messenger[] = ['whatsapp', 'telegram', 'instagram'];

export interface ClientDraft {
  firstName: string;
  lastName: string;
  avatarColor: AvatarColorKey;
  /** The national part as typed ("555 123 456"), shown after the dial code. */
  phone: string;
  phoneCountry: CountryCode;
  /** null = not on the card; a string = the field is shown. */
  messengers: Record<Messenger, string | null>;
  birthday: { day: number; month: number } | null;
  notes: string;
  vip: boolean;
}

export type DraftError = 'name' | 'phone' | Messenger | 'birthday';

export function emptyDraft(country: CountryCode, avatarColor: AvatarColorKey): ClientDraft {
  return {
    firstName: '',
    lastName: '',
    avatarColor,
    phone: '',
    phoneCountry: country,
    messengers: { whatsapp: null, telegram: null, instagram: null },
    birthday: null,
    notes: '',
    vip: false,
  };
}

export function draftFromClient(
  client: Client,
  fallbackCountry: CountryCode,
  avatarColor: AvatarColorKey,
): ClientDraft {
  return {
    firstName: client.first_name,
    lastName: client.last_name ?? '',
    avatarColor: isAvatarColorKey(client.avatar_color) ? client.avatar_color : avatarColor,
    phone: client.phone ? nationalDisplay(client.phone) : '',
    phoneCountry: phoneCountry(client.phone) ?? fallbackCountry,
    messengers: {
      whatsapp: client.whatsapp ? formatPhone(client.whatsapp) : null,
      telegram: client.telegram ? `@${client.telegram}` : null,
      instagram: client.instagram ? `@${client.instagram}` : null,
    },
    birthday:
      client.birth_day && client.birth_month
        ? { day: client.birth_day, month: client.birth_month }
        : null,
    notes: client.notes ?? '',
    vip: client.is_favorite,
  };
}

/** The draft with a phone book contact's name, phone and birthday filled in. */
export function withCard(draft: ClientDraft, card: ClientCardDto): ClientDraft {
  return {
    ...draft,
    firstName: card.first_name,
    lastName: card.last_name ?? '',
    phone: card.phone ? nationalDisplay(card.phone) : draft.phone,
    phoneCountry: phoneCountry(card.phone) ?? draft.phoneCountry,
    birthday:
      card.birth_day && card.birth_month
        ? { day: card.birth_day, month: card.birth_month }
        : draft.birthday,
  };
}

/** WhatsApp starts as the client's phone, the way people usually have it. */
export function whatsappSeed(draft: ClientDraft): string {
  const phone = resolvePhoneInput(draft.phone, draft.phoneCountry).canonical;
  return phone ? formatPhone(phone) : '';
}

const blankToNull = (value: string) => value.trim() || null;

/** The card to save, or the first field that stops it. */
export function cardFromDraft(
  draft: ClientDraft,
): { ok: true; card: ClientCardDto } | { ok: false; error: DraftError } {
  const firstName = draft.firstName.trim();
  if (!firstName) return { ok: false, error: 'name' };

  let phone: string | null = null;
  if (draft.phone.trim()) {
    phone = resolvePhoneInput(draft.phone, draft.phoneCountry).canonical || null;
    if (!phone) return { ok: false, error: 'phone' };
  }

  let whatsapp: string | null = null;
  const wa = draft.messengers.whatsapp?.trim();
  if (wa) {
    whatsapp = resolvePhoneInput(wa, draft.phoneCountry).canonical || null;
    if (!whatsapp) return { ok: false, error: 'whatsapp' };
  }

  let telegram: string | null = null;
  const tg = draft.messengers.telegram?.trim();
  if (tg) {
    telegram = normalizeTelegram(tg);
    if (!telegram) return { ok: false, error: 'telegram' };
  }

  let instagram: string | null = null;
  const ig = draft.messengers.instagram?.trim();
  if (ig) {
    instagram = normalizeInstagram(ig);
    if (!instagram) return { ok: false, error: 'instagram' };
  }

  if (draft.birthday && !isValidBirthday(draft.birthday.day, draft.birthday.month)) {
    return { ok: false, error: 'birthday' };
  }

  return {
    ok: true,
    card: {
      first_name: firstName,
      last_name: blankToNull(draft.lastName),
      phone,
      avatar_color: draft.avatarColor,
      whatsapp,
      telegram,
      instagram,
      birth_day: draft.birthday?.day ?? null,
      birth_month: draft.birthday?.month ?? null,
      notes: blankToNull(draft.notes),
      is_favorite: draft.vip,
    },
  };
}

/** Initials for the big avatar: first letters of the first and last name. */
export function draftInitials(draft: Pick<ClientDraft, 'firstName' | 'lastName'>): string {
  return `${draft.firstName.trim()[0] ?? ''}${draft.lastName.trim()[0] ?? ''}`.toUpperCase();
}
