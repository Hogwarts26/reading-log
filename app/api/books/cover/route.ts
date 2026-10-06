export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url') ?? ''
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new Response('bad url', { status: 400 })
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'image.yes24.com') {
    return new Response('not allowed', { status: 400 })
  }

  const res = await fetch(parsed.toString())
  if (!res.ok) return new Response('fetch failed', { status: 502 })

  const buf = await res.arrayBuffer()
  return new Response(buf, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}