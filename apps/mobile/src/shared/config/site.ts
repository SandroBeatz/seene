/**
 * The public site. Staging builds point it at their own host through
 * EXPO_PUBLIC_SITE_URL: getseene.app has no deployment until production exists.
 */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://getseene.app';
