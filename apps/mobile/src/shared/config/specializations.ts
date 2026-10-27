/**
 * The 14 profession keys, in the design's order (onboarding step 2 tiles). Stored on
 * `master_profile.specializations` (text[]) and `service.specialization`; the DB
 * enforces the same list (`public.specialization_keys()`). Display names come from
 * i18n (`onboarding.specializations.<key>`) — never hardcode the label.
 *
 * Lives in shared/config, not an entity: it is the vocabulary that both the master
 * (professions) and the service (its section) entities speak.
 */
import lashesPhoto from '@/shared/assets/img/professions/lashes.jpg';
import browsPhoto from '@/shared/assets/img/professions/brows.jpg';
import manicurePhoto from '@/shared/assets/img/professions/manicure.jpg';
import pedicurePhoto from '@/shared/assets/img/professions/pedicure.jpg';
import hairPhoto from '@/shared/assets/img/professions/hair.jpg';
import barbersPhoto from '@/shared/assets/img/professions/barbers.jpg';
import makeupPhoto from '@/shared/assets/img/professions/makeup.jpg';
import skincarePhoto from '@/shared/assets/img/professions/skincare.jpg';
import hairRemovalPhoto from '@/shared/assets/img/professions/hair_removal.jpg';
import massagePhoto from '@/shared/assets/img/professions/massage.jpg';
import permanentMakeupPhoto from '@/shared/assets/img/professions/permanent_makeup.jpg';
import tattooPhoto from '@/shared/assets/img/professions/tattoo.jpg';
import piercingPhoto from '@/shared/assets/img/professions/piercing.jpg';
import petGroomingPhoto from '@/shared/assets/img/professions/pet_grooming.jpg';

export const SPECIALIZATION_KEYS = [
  'lashes',
  'brows',
  'manicure',
  'pedicure',
  'hair',
  'barbers',
  'makeup',
  'skincare',
  'hair_removal',
  'massage',
  'permanent_makeup',
  'tattoo',
  'piercing',
  'pet_grooming',
] as const;

export type SpecializationKey = (typeof SPECIALIZATION_KEYS)[number];

export function isSpecializationKey(value: string): value is SpecializationKey {
  return (SPECIALIZATION_KEYS as readonly string[]).includes(value);
}

/** Tile photo per profession (600×600, `seene-images-ready/app`); Metro asset ids. */
export const SPECIALIZATION_IMAGES: Record<SpecializationKey, number> = {
  lashes: lashesPhoto,
  brows: browsPhoto,
  manicure: manicurePhoto,
  pedicure: pedicurePhoto,
  hair: hairPhoto,
  barbers: barbersPhoto,
  makeup: makeupPhoto,
  skincare: skincarePhoto,
  hair_removal: hairRemovalPhoto,
  massage: massagePhoto,
  permanent_makeup: permanentMakeupPhoto,
  tattoo: tattooPhoto,
  piercing: piercingPhoto,
  pet_grooming: petGroomingPhoto,
};
