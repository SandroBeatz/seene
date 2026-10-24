/**
 * The visitor's country from the CDN (Cloudflare `cf-ipcountry`, Vercel
 * `x-vercel-ip-country`), for the marketing pages, which are prerendered and
 * cannot read it themselves. No geolocation prompt, nothing stored.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const header =
    getRequestHeader(event, 'cf-ipcountry') ?? getRequestHeader(event, 'x-vercel-ip-country')
  const country = header && /^[A-Z]{2}$/i.test(header) ? header.toUpperCase() : null

  // "XX" and "T1" are Cloudflare's "unknown" and Tor
  return { country: country && country !== 'XX' && country !== 'T1' ? country : null }
})
