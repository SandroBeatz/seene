import { SITE_URL } from '@/shared/config/site';

/** The master's public booking page: the short form for display, the full one for links. */
export const masterPageLabel = (username: string) => `getseene.app/${username}`;

export const masterPageUrl = (username: string) => `${SITE_URL}/${username}`;
