const MESSAGE_LANGUAGES = ['ru', 'en', 'fr']

/**
 * The first language of the client's browser the master's messages exist in, for
 * `client.language`. The page itself is in the master's language, so it says nothing here.
 */
export function clientLanguageFromHeader(header: string | undefined): string | null {
  if (!header) return null
  const tags = header
    .split(',')
    .map((part) => {
      const [tag = '', quality] = part.trim().split(';q=')
      return {
        code: tag.split('-')[0]?.toLowerCase() ?? '',
        quality: quality ? Number(quality) : 1
      }
    })
    .sort((a, b) => b.quality - a.quality)
  return tags.find((tag) => MESSAGE_LANGUAGES.includes(tag.code))?.code ?? null
}
