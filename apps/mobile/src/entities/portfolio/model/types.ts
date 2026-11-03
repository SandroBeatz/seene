import type { Tables, TablesUpdate } from '@/shared/api/database.types';

export type PortfolioItem = Tables<'portfolio_item'>;
export type PortfolioItemPatch = Pick<TablesUpdate<'portfolio_item'>, 'caption' | 'service_id'>;

/** `portfolio_item_caption_length` in the database. */
export const CAPTION_MAX_LENGTH = 60;
