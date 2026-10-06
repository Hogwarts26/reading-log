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
          <div key={b.id} className="rounded bg-white p-2 shadow-sm">
            {b.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.cover_url} alt={b.title} className="aspect-[2/3] w-full object-cover" />
            )}
            <p className="mt-2 text-sm font-medium">{b.title}</p>
            <p className="text-xs text-gray-500">{b.author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}