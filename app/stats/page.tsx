import Link from 'next/link'
import { supabase, Book } from '@/lib/supabase'
import { HBars, VBars } from '@/components/Charts'

export const dynamic = 'force-dynamic' // 항상 최신 데이터

type Item = { label: string; value: number }

function countBy(keys: string[]): Item[] {
  const m = new Map<string, number>()
  keys.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1))
  return Array.from(m.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

const yearOf = (b: Book) => (b.end_date ?? '').slice(0, 4)
const monthOf = (b: Book) => (b.end_date ?? '').slice(5, 7)

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearParam } = await searchParams

  const { data, error } = await supabase.from('books').select('*')
  if (error) return <p>불러오기 실패: {error.message}</p>
  const all = (data ?? []) as Book[]

  const finishedAll = all.filter((b) => b.end_date)
  const reading = all.filter((b) => b.start_date && !b.end_date)
  const noDates = all.filter((b) => !b.start_date && !b.end_date)

  // 완독 연도 목록 (최신순)
  const years = Array.from(new Set(finishedAll.map(yearOf))).sort().reverse()

  // 선택된 연도: 주소에 ?year=2026 / ?year=all, 없으면 가장 최근 연도
  let selected = 'all'
  if (yearParam === 'all') selected = 'all'
  else if (yearParam && years.includes(yearParam)) selected = yearParam
  else if (years.length > 0) selected = years[0]

  const finished = selected === 'all' ? finishedAll : finishedAll.filter((b) => yearOf(b) === selected)

  // 분야별
  const byCategory = countBy(finished.map((b) => b.category || '미분류'))

  // 저자별 TOP 10 (공동 저자는 각각 1권)
  const byAuthor = countBy(
    finished.flatMap((b) =>
      (b.author ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, 10)

  // 월별(연도 선택 시) 또는 연도별(전체 선택 시)
  let timeItems: Item[]
  if (selected === 'all') {
    const countByYear = new Map(countBy(finishedAll.map(yearOf)).map((i) => [i.label, i.value]))
    timeItems = [...years].reverse().map((y) => ({ label: `${y}`, value: countByYear.get(y) ?? 0 }))
  } else {
    const countByMonth = new Map(countBy(finished.map(monthOf)).map((i) => [i.label, i.value]))
    timeItems = Array.from({ length: 12 }, (_, idx) => {
      const mm = String(idx + 1).padStart(2, '0')
      return { label: `${idx + 1}월`, value: countByMonth.get(mm) ?? 0 }
    })
  }

  // 별점
  const rated = finished.filter((b) => b.rating)
  const avg = rated.length > 0 ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length : null
  const ratingItems: Item[] = [5, 4, 3, 2, 1].map((n) => ({
    label: '★'.repeat(n),
    value: rated.filter((b) => Math.round(b.rating ?? 0) === n).length,
  }))

  const tab = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm ${active ? 'bg-black text-white' : 'bg-white text-gray-600 shadow-sm'}`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-3 text-xl font-bold">독서 통계</h1>
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <Link key={y} href={`/stats?year=${y}`} className={tab(selected === y)}>
              {y}년
            </Link>
          ))}
          <Link href="/stats?year=all" className={tab(selected === 'all')}>
            전체
          </Link>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          완독일이 입력된 책만 집계해요.
          {noDates.length > 0 && ` 날짜가 없는 책 ${noDates.length}권은 빠져 있어요.`}
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">{selected === 'all' ? '전체 완독' : `${selected}년 완독`}</p>
          <p className="mt-1 text-2xl font-bold">{finished.length}권</p>
        </div>
        <div className="rounded bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">읽는 중</p>
          <p className="mt-1 text-2xl font-bold">{reading.length}권</p>
        </div>
        <div className="rounded bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">평균 별점</p>
          <p className="mt-1 text-2xl font-bold">{avg !== null ? `★ ${avg.toFixed(1)}` : '-'}</p>
        </div>
        <div className="rounded bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">가장 많이 읽은 분야</p>
          <p className="mt-1 truncate text-2xl font-bold">{byCategory[0]?.label ?? '-'}</p>
        </div>
      </div>

      <section className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-4 font-bold">{selected === 'all' ? '연도별 완독 권수' : `${selected}년 월별 완독 권수`}</h2>
        {timeItems.length > 0 ? <VBars items={timeItems} /> : <p className="text-sm text-gray-400">아직 데이터가 없어요.</p>}
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold">분야별</h2>
          <HBars items={byCategory} />
        </section>
        <section className="rounded bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-bold">저자별 TOP 10</h2>
          <HBars items={byAuthor} />
        </section>
      </div>

      <section className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-4 font-bold">별점 분포</h2>
        <HBars items={ratingItems} />
      </section>
    </div>
  )
}