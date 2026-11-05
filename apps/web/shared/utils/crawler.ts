/**
 * Search engines and the link-preview fetchers of messengers. They read the HTML
 * without running JavaScript, so only they get a master's page rendered on the
 * server; a false positive just gets a slower page, a miss loses the preview.
 */
const CRAWLER =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|whatsapp\/|viber|vkshare|skypeuripreview|bingpreview|embedly|pinterest|yandex|google-inspectiontool|googleother/i

export function isCrawler(userAgent: string | null | undefined): boolean {
  return !!userAgent && CRAWLER.test(userAgent)
}
