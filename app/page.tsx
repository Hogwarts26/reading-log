import Link from 'next/link'
import { supabase, Book } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // 항상 최신 데이터를 보여줘요

export default async function Home() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return <p>불러오기 실패: {error.message}</p>
  const books = (data ?? []) as Book[]

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">읽은 책 {books.length}권</h1>
      {books.length === 0 && <p className="text-gray-500">아직 기록한 책이 없어요.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/books/${b.id}`}
            className="rounded bg-white p-2 shadow-sm transition hover:shadow-md"
          >
            {b.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.cover_url} alt={b.title} className="aspect-[2/3] w-full object-cover" />
            ) : (
              <div className="aspect-[2/3] w-full bg-gray-200" />
            )}
            <p className="mt-2 text-sm font-medium">{b.title}</p>
            <p className="text-xs text-gray-500">{b.author}</p>
            <p className="mt-1 text-xs text-gray-400">
              {b.rating ? `★ ${b.rating}` : ''}
              {b.end_date ? ` · ${b.end_date} 완독` : b.start_date ? ' · 읽는 중' : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}