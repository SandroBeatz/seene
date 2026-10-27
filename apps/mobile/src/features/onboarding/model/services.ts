/**
 * Step-3 service list logic, pure. The draft holds every candidate service — the
 * starter templates of the picked professions plus the master's own — each with a
 * `selected` flag; only selected ones are written.
 */
import { SERVICE_TEMPLATES, type ServiceTemplate } from '@/entities/service';
import type { OnboardingServiceInput } from '@/entities/master';
import {
  DEFAULT_SERVICE_COLOR,
  SERVICE_COLORS,
  type ServiceColorKey,
} from '@/shared/config/palettes';
import {
  SPECIALIZATION_KEYS,
  type SpecializationKey,
} from '@/shared/config/specializations';
import type { AppLocale } from '@/shared/lib/i18n';

export interface DraftService {
  id: string;
  /** Set for services that came from the catalog. */
  templateId?: string;
  /**
   * The master's own name. Empty for an untouched catalog service: its name then
   * comes from the catalog in the current language (see `serviceName`), so
   * switching the app language re-translates it.
   */
  name: string;
  description: string;
  /** Minutes. */
  duration: number;
  /** null = no price yet ("Добавить цену"); 0 = free. */
  price: number | null;
  color: ServiceColorKey;
  specialization: SpecializationKey;
  /** Category name, or null for "Без категории". */
  category: string | null;
  active: boolean;
  online: boolean;
  selected: boolean;
}

export const DEFAULT_COLOR_KEY: ServiceColorKey = 'rose';

const TEMPLATES_BY_ID = new Map(
  Object.values(SERVICE_TEMPLATES)
    .flat()
    .map((template) => [template.id, template]),
);

/** The catalog name of a template service in `locale`, if it is one. */
export function templateName(service: Pick<DraftService, 'templateId'>, locale: AppLocale) {
  return service.templateId ? TEMPLATES_BY_ID.get(service.templateId)?.name[locale] : undefined;
}

/** What the master sees and what gets saved: their own name, else the catalog's. */
export function serviceName(service: DraftService, locale: AppLocale): string {
  return service.name.trim() || templateName(service, locale) || '';
}

/** Keep the name translatable while it still equals the catalog's (sheet save). */
export function withStoredName(service: DraftService, locale: AppLocale): DraftService {
  return service.name.trim() === templateName(service, locale) ? { ...service, name: '' } : service;
}

/** Drafts saved before names were derived: drop names equal to a catalog name. */
export function forgetCatalogNames(services: readonly DraftService[]): DraftService[] {
  return services.map((service) => {
    const template = service.templateId ? TEMPLATES_BY_ID.get(service.templateId) : undefined;
    return template && Object.values(template.name).includes(service.name)
      ? { ...service, name: '' }
      : service;
  });
}

export function fromTemplate(
  template: ServiceTemplate,
  specialization: SpecializationKey,
): DraftService {
  return {
    id: template.id,
    templateId: template.id,
    name: '',
    description: '',
    duration: template.duration,
    price: null,
    color: DEFAULT_COLOR_KEY,
    specialization,
    category: null,
    active: true,
    online: true,
    selected: !!template.suggested,
  };
}

/**
 * Bring the list in line with the picked professions: add the templates of newly
 * picked ones (keeping every edit already made), drop untouched templates of
 * professions no longer picked. The master's own services always stay.
 */
export function syncWithProfessions(
  services: readonly DraftService[],
  specializations: readonly SpecializationKey[],
): DraftService[] {
  const picked = new Set(specializations);
  const kept = services.filter((s) => !s.templateId || picked.has(s.specialization));
  const known = new Set(kept.map((s) => s.templateId).filter(Boolean));
  const added = specializations.flatMap((key) =>
    SERVICE_TEMPLATES[key]
      .filter((template) => !known.has(template.id))
      .map((template) => fromTemplate(template, key)),
  );
  return [...kept, ...added];
}

export interface ServiceGroup {
  specialization: SpecializationKey;
  services: DraftService[];
}

/** Grouped by profession, in the catalog order (the step-3 sections). */
export function groupByProfession(services: readonly DraftService[]): ServiceGroup[] {
  return SPECIALIZATION_KEYS.map((key) => ({
    specialization: key,
    services: services.filter((s) => s.specialization === key),
  })).filter((group) => group.services.length > 0);
}

export function toServiceInput(service: DraftService, locale: AppLocale): OnboardingServiceInput {
  return {
    name: serviceName(service, locale),
    duration: service.duration,
    price: service.price,
    description: service.description.trim() || null,
    color: SERVICE_COLORS[service.color] ?? DEFAULT_SERVICE_COLOR,
    specialization: service.specialization,
    category: service.category,
    is_active: service.active,
    show_online: service.online,
  };
}
