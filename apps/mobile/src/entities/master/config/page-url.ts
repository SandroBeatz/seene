/** The master's public booking page: the short form for display, the full one for links. */
const PAGE_HOST = 'getseene.app';

export const masterPageLabel = (username: string) => `${PAGE_HOST}/${username}`;

export const masterPageUrl = (username: string) => `https://${PAGE_HOST}/${username}`;
