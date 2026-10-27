/**
 * Starter services per profession, offered on onboarding step 3 ("Ваши услуги").
 * The master ticks what they do; each picked template becomes a real `service` row
 * in their language (`name[locale]`), with the template's duration and no price
 * (prices are the master's own — added on the step or later).
 *
 * Content, not UI copy: names live here in all three languages because they are
 * written to the database once, not re-translated on every render.
 */
import type { SpecializationKey } from '@/shared/config/specializations';
import type { AppLocale } from '@/shared/lib/i18n';

export interface ServiceTemplate {
  /** Stable id, unique across the catalog (`<profession>.<slug>`). */
  id: string;
  name: Record<AppLocale, string>;
  /** Minutes. */
  duration: number;
  /** Pre-ticked on step 3 — the services nearly every master of this profession does. */
  suggested?: boolean;
}

const t = (
  id: string,
  duration: number,
  ru: string,
  en: string,
  fr: string,
  suggested = false,
): ServiceTemplate => ({ id, duration, name: { ru, en, fr }, suggested });

export const SERVICE_TEMPLATES: Record<SpecializationKey, readonly ServiceTemplate[]> = {
  lashes: [
    t('lashes.classic', 120, 'Наращивание ресниц, классика', 'Classic lash extensions', 'Extensions de cils classiques', true),
    t('lashes.volume', 150, 'Наращивание ресниц, объём 2D–3D', 'Volume lash extensions (2D–3D)', 'Extensions de cils volume (2D–3D)', true),
    t('lashes.refill', 90, 'Коррекция наращивания', 'Lash refill', 'Remplissage des cils'),
    t('lashes.lift', 60, 'Ламинирование ресниц', 'Lash lift', 'Rehaussement de cils', true),
    t('lashes.removal', 20, 'Снятие ресниц', 'Lash removal', 'Dépose des extensions'),
  ],
  brows: [
    t('brows.shape', 30, 'Коррекция бровей', 'Brow shaping', 'Restructuration des sourcils', true),
    t('brows.tint', 30, 'Окрашивание бровей', 'Brow tint', 'Teinture des sourcils', true),
    t('brows.lamination', 60, 'Долговременная укладка бровей', 'Brow lamination', 'Brow lift', true),
    t('brows.henna', 45, 'Окрашивание хной', 'Henna brows', 'Sourcils au henné'),
  ],
  manicure: [
    t('manicure.gel', 90, 'Маникюр с покрытием гель-лаком', 'Gel polish manicure', 'Manucure semi-permanente', true),
    t('manicure.plain', 60, 'Маникюр без покрытия', 'Manicure, no polish', 'Manucure sans vernis', true),
    t('manicure.extensions', 150, 'Наращивание ногтей', 'Nail extensions', 'Extensions d’ongles'),
    t('manicure.removal', 20, 'Снятие покрытия', 'Polish removal', 'Dépose du vernis', true),
    t('manicure.design', 30, 'Дизайн ногтей', 'Nail art', 'Nail art'),
  ],
  pedicure: [
    t('pedicure.gel', 90, 'Педикюр с покрытием', 'Pedicure with gel polish', 'Pédicure semi-permanente', true),
    t('pedicure.plain', 60, 'Педикюр без покрытия', 'Pedicure, no polish', 'Pédicure sans vernis', true),
    t('pedicure.toes', 45, 'Покрытие пальчиков', 'Toe polish only', 'Vernis des orteils'),
    t('pedicure.medical', 75, 'Аппаратный педикюр', 'Medical pedicure', 'Pédicure médicale'),
  ],
  hair: [
    t('hair.womens_cut', 60, 'Женская стрижка', 'Women’s haircut', 'Coupe femme', true),
    t('hair.blowout', 45, 'Укладка', 'Blow-dry & styling', 'Brushing', true),
    t('hair.color', 120, 'Окрашивание в один тон', 'Single-process color', 'Coloration', true),
    t('hair.highlights', 180, 'Сложное окрашивание', 'Highlights & balayage', 'Mèches et balayage'),
    t('hair.updo', 60, 'Вечерняя причёска', 'Updo', 'Chignon'),
  ],
  barbers: [
    t('barbers.cut', 45, 'Мужская стрижка', 'Men’s haircut', 'Coupe homme', true),
    t('barbers.beard', 30, 'Оформление бороды', 'Beard trim', 'Taille de barbe', true),
    t('barbers.combo', 60, 'Стрижка и борода', 'Haircut & beard', 'Coupe et barbe', true),
    t('barbers.shave', 30, 'Бритьё опасной бритвой', 'Hot towel shave', 'Rasage à l’ancienne'),
    t('barbers.kids', 30, 'Детская стрижка', 'Kids’ haircut', 'Coupe enfant'),
  ],
  makeup: [
    t('makeup.day', 60, 'Дневной макияж', 'Day makeup', 'Maquillage de jour', true),
    t('makeup.evening', 75, 'Вечерний макияж', 'Evening makeup', 'Maquillage de soirée', true),
    t('makeup.bridal', 90, 'Свадебный макияж', 'Bridal makeup', 'Maquillage de mariée', true),
    t('makeup.lesson', 90, 'Урок макияжа для себя', 'Self-makeup lesson', 'Cours d’auto-maquillage'),
  ],
  skincare: [
    t('skincare.cleansing', 90, 'Чистка лица', 'Facial cleansing', 'Nettoyage de peau', true),
    t('skincare.peel', 45, 'Пилинг', 'Chemical peel', 'Peeling', true),
    t('skincare.care', 60, 'Уходовая процедура', 'Hydrating facial', 'Soin hydratant', true),
    t('skincare.consultation', 30, 'Консультация косметолога', 'Skin consultation', 'Consultation'),
  ],
  hair_removal: [
    t('hair_removal.legs', 45, 'Ноги полностью', 'Full legs', 'Jambes entières', true),
    t('hair_removal.bikini', 30, 'Глубокое бикини', 'Brazilian', 'Maillot intégral', true),
    t('hair_removal.underarms', 15, 'Подмышки', 'Underarms', 'Aisselles', true),
    t('hair_removal.face', 15, 'Лицо', 'Face', 'Visage'),
    t('hair_removal.arms', 30, 'Руки', 'Arms', 'Bras'),
  ],
  massage: [
    t('massage.classic', 60, 'Классический массаж', 'Classic massage', 'Massage classique', true),
    t('massage.back', 30, 'Массаж спины', 'Back massage', 'Massage du dos', true),
    t('massage.relax', 90, 'Расслабляющий массаж', 'Relaxing massage', 'Massage relaxant'),
    t('massage.sport', 60, 'Спортивный массаж', 'Sports massage', 'Massage sportif'),
    t('massage.lymph', 60, 'Лимфодренажный массаж', 'Lymphatic drainage', 'Drainage lymphatique'),
  ],
  permanent_makeup: [
    t('permanent_makeup.brows', 150, 'Перманент бровей', 'Permanent brows', 'Sourcils permanents', true),
    t('permanent_makeup.lips', 150, 'Перманент губ', 'Lip blush', 'Lèvres permanentes', true),
    t('permanent_makeup.eyeliner', 120, 'Межресничка', 'Lash line enhancement', 'Ras de cils', true),
    t('permanent_makeup.touch_up', 90, 'Коррекция перманента', 'Touch-up', 'Retouche'),
  ],
  tattoo: [
    t('tattoo.mini', 60, 'Мини-тату', 'Mini tattoo', 'Mini tatouage', true),
    t('tattoo.session', 180, 'Сеанс тату', 'Tattoo session', 'Séance de tatouage', true),
    t('tattoo.consultation', 30, 'Консультация и эскиз', 'Consultation & sketch', 'Consultation et croquis', true),
    t('tattoo.cover_up', 180, 'Перекрытие старой тату', 'Cover-up', 'Recouvrement'),
  ],
  piercing: [
    t('piercing.ear', 20, 'Прокол мочки уха', 'Earlobe piercing', 'Piercing du lobe', true),
    t('piercing.cartilage', 30, 'Прокол хряща', 'Cartilage piercing', 'Piercing du cartilage', true),
    t('piercing.nose', 30, 'Прокол носа', 'Nose piercing', 'Piercing du nez', true),
    t('piercing.jewelry', 15, 'Замена украшения', 'Jewelry change', 'Changement de bijou'),
  ],
  pet_grooming: [
    t('pet_grooming.full', 120, 'Комплексный груминг', 'Full grooming', 'Toilettage complet', true),
    t('pet_grooming.bath', 60, 'Мытьё и сушка', 'Bath & dry', 'Bain et séchage', true),
    t('pet_grooming.cut', 90, 'Стрижка', 'Haircut', 'Tonte', true),
    t('pet_grooming.nails', 15, 'Стрижка когтей', 'Nail trim', 'Coupe des griffes'),
  ],
};
