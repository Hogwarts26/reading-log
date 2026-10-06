import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mapCategory, cleanAuthor } from '@/lib/categories'

type Yes24Item = {
  itemId: number
  title: string
  author: string
  publisher: string
  publishDate: string
  goodsSortNm: string
  isbn13: string
  cover: string
  link: string
}

export async function GET(req: Request) {
  // 로그인한 사람만 검색할 수 있어요 (YES24 호출 한도 보호)
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: userData } = await supa.auth.getUser(token)
  if (!userData.user) {
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
  }

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ items: [] })

  const key = process.env.YES24_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'YES24_API_KEY가 설정되지 않았어요.' }, { status: 500 })
  }

  const url = `https://apis.yes24.com/v1/goods/itemList?query=${encodeURIComponent(q)}&category=BOOK&detail=Y`
  const res = await fetch(url, { headers: { 'X-Api-Key': key }, cache: 'no-store' })
  if (!res.ok) {
    return NextResponse.json({ error: `YES24 오류 (${res.status})` }, { status: 502 })
  }

  const json = await res.json()
  const items = (json?.data?.items ?? []) as Yes24Item[]

  const mapped = items
    .filter((i) => i.title && !i.title.includes('세트'))
    .map((i) => ({
      id: i.itemId,
      title: i.title,
      author: cleanAuthor(i.author),
      publisher: i.publisher,
      pub_year: i.publishDate ? Number(i.publishDate.slice(0, 4)) : null,
      category: mapCategory(i.goodsSortNm),
      raw_category: i.goodsSortNm,
      cover: i.cover,
      isbn13: i.isbn13 ?? '',
      link: i.link,
    }))

  return NextResponse.json({ items: mapped })
}