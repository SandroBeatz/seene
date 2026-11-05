import { describe, it, expect } from 'vitest'
import { isCrawler } from '../shared/utils/crawler'

describe('isCrawler', () => {
  it.each([
    'WhatsApp/2.23.20.0 A',
    'TelegramBot (like TwitterBot)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
    'Mozilla/5.0 (compatible; vkShare; +http://vk.com/dev/Share)',
    'Viber/20.3.0',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'
  ])('recognises %s', (userAgent) => {
    expect(isCrawler(userAgent)).toBe(true)
  })

  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
    // In-app browsers of messengers are people, not preview fetchers.
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 Telegram-Android/11.0',
    ''
  ])('treats %s as a person', (userAgent) => {
    expect(isCrawler(userAgent)).toBe(false)
  })

  it('treats a missing user agent as a person', () => {
    expect(isCrawler(null)).toBe(false)
    expect(isCrawler(undefined)).toBe(false)
  })
})
