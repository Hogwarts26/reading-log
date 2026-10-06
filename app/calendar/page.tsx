import Link from 'next/link'
import { supabase, Book } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // 항상 최신 데이터

const DAY = 86400000

// 'YYYY-MM-DD' → 날짜 번호 (시간대 문제를 피하려고 UTC 기준 일수로 계산)
const dayNum = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY)
}
const fromNum = (n: number) => new Date(n * DAY)

// 배경색이 밝으면 검은 글씨, 어두우면 흰 글씨
function textColorFor(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1f2937' : '#ffffff'
}

type Item = { book: Book; s: number; e: number; lane: number; color: string }

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>
}) {
  const { m } = await searchParams

  // 오늘 날짜 (한국 시간 기준)
  const kst = new Date(Date.now() + 9 * 3600 * 1000)
  const todayNum = Math.floor(kst.getTime() / DAY)

  // 보여줄 달: 주소의 ?m=2026-10, 없으면 이번 달
  let year = kst.getUTCFullYear()
  let month = kst.getUTCMonth() // 0~11
  if (m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m)) {
    year = Number(m.slice(0, 4))
    month = Number(m.slice(5, 7)) - 1
  }

  const firstOfMonth = Date.UTC(year, month, 1) / DAY
  const lastOfMonth = Date.UTC(year, month + 1, 0) / DAY
  const gridStart = firstOfMonth - fromNum(firstOfMonth).getUTCDay() // 일요일부터 시작
  const gridEnd = lastOfMonth + (6 - fromNum(lastOfMonth).getUTCDay())
  const weekCount = (gridEnd - gridStart + 1) / 7

  const { data, error } = await supabase.from('books').select('*')
  if (error) return <p>불러오기 실패: {error.message}</p>
  const all = (data ?? []) as Book[]

  // 이 달력에 걸치는 책만 골라서 기간을 계산해요
  const items: Item[] = []
  for (const b of all) {
    if (!b.start_date && !b.end_date) continue
    const s = b.start_date ? dayNum(b.start_date) : dayNum(b.end_date as string)
    let e = b.end_date ? dayNum(b.end_date) : Math.max(todayNum, s) // 읽는 중이면 오늘까지
    if (e < s) e = s
    if (e < gridStart || s > gridEnd) continue
    items.push({ book: b, s, e, lane: 0, color: b.cover_color || '#9ca3af' })
  }

  // 겹치는 책은 줄(lane)을 나눠서 쌓아요. 한 번 정한 줄은 달 전체에서 유지돼요.
  items.sort((a, b) => a.s - b.s || b.e - b.s - (a.e - a.s))
  const laneEnds: number[] = []
  for (const it of items) {
    let lane = laneEnds.findIndex((end) => end < it.s)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(it.e)
    } else {
      laneEnds[lane] = it.e
    }
    it.lane = lane
  }

  // 주(week)별로 막대 조각을 나눠요
  const weekRows = Array.from({ length: weekCount }, (_, w) => {
    const ws = gridStart + w * 7
    const we = ws + 6
    const segs = items
      .filter((it) => it.e >= ws && it.s <= we)
      .map((it) => {
        const segS = Math.max(it.s, ws)
        const segE = Math.min(it.e, we)
        return {
          it,
          col: segS - ws,
          span: segE - segS + 1,
          startsHere: it.s >= ws,
          endsHere: it.e <= we,
        }
      })
    const lanes = segs.reduce((mx, sg) => Math.max(mx, sg.it.lane + 1), 0)
    return { ws, segs, height: Math.max(88, 28 + lanes * 22 + 6) }
  })

  // 이전달/다음달 링크
  const ym = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  const prevHref = `/calendar?m=${ym(new Date(Date.UTC(year, month - 1, 1)))}`
  const nextHref = `/calendar?m=${ym(new Date(Date.UTC(year, month + 1, 1)))}`

  // 이 달에 읽은 책 목록 (범례)
  const monthItems = items.filter((it) => it.e >= firstOfMonth && it.s <= lastOfMonth)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {year}년 {month + 1}월
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={prevHref} className="rounded bg-white px-3 py-1 shadow-sm">◀</Link>
          <Link href="/calendar" className="rounded bg-white px-3 py-1 shadow-sm">오늘</Link>
          <Link href={nextHref} className="rounded bg-white px-3 py-1 shadow-sm">▶</Link>
        </div>
      </div>

      <div className="overflow-hidden rounded border-l border-t bg-white">
        <div className="grid grid-cols-7 border-b border-r text-center text-xs text-gray-500">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="border-r py-1 last:border-r-0">{d}</div>
          ))}
        </div>

        {weekRows.map((row) => (
          <div key={row.ws} className="relative" style={{ height: row.height }}>
            {/* 날짜 칸 */}
            <div className="absolute inset-0 grid grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => {
                const num = row.ws + i
                const date = fromNum(num)
                const inMonth = date.getUTCMonth() === month
                const isToday = num === todayNum
                return (
                  <div
                    key={i}
                    className={`border-b border-r p-1 text-[11px] ${
                      inMonth ? 'text-gray-700' : 'text-gray-300'
                    } ${isToday ? 'bg-yellow-50' : ''}`}
                  >
                    <span className={isToday ? 'rounded-full bg-black px-1.5 py-0.5 text-white' : ''}>
                      {date.getUTCDate()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 형광펜 막대 */}
            {row.segs.map((sg) => {
              const inset = (sg.startsHere ? 2 : 0) + (sg.endsHere ? 2 : 0)
              const rl = sg.startsHere ? '10px' : '0'
              const rr = sg.endsHere ? '10px' : '0'
              return (
                <Link
                  key={`${sg.it.book.id}-${row.ws}`}
                  href={`/books/${sg.it.book.id}`}
                  title={sg.it.book.title}
                  className="absolute truncate px-2 text-[11px] font-medium leading-5"
                  style={{
                    top: 24 + sg.it.lane * 22,
                    height: 20,
                    left: `calc(${(sg.col * 100) / 7}% + ${sg.startsHere ? 2 : 0}px)`,
                    width: `calc(${(sg.span * 100) / 7}% - ${inset}px)`,
                    background: sg.it.color,
                    color: textColorFor(sg.it.color),
                    borderRadius: `${rl} ${rr} ${rr} ${rl}`,
                  }}
                >
                  {sg.it.book.title}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* 이 달에 읽은 책 */}
      <section>
        <h2 className="mb-2 text-sm font-bold">이 달에 읽은 책</h2>
        {monthItems.length === 0 ? (
          <p className="text-sm text-gray-400">이 달에는 기록된 독서 기간이 없어요.</p>
        ) : (
          <ul className="space-y-1">
            {monthItems.map((it) => (
              <li key={it.book.id}>
                <Link href={`/books/${it.book.id}`} className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-3 w-3 flex-none rounded-full" style={{ background: it.color }} />
                  <span className="truncate font-medium">{it.book.title}</span>
                  <span className="flex-none text-xs text-gray-400">
                    {it.book.start_date ?? ''} ~ {it.book.end_date ?? '읽는 중'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}