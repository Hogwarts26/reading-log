'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Book } from '@/lib/supabase'
import { useOwner } from '@/lib/useOwner'
import StarRating from '@/components/StarRating'

type Form = {
  title: string
  author: string
  publisher: string
  pubYear: string
  category: string
  startDate: string
  endDate: string
  rating: number
  review: string
}

const emptyForm: Form = {
  title: '', author: '', publisher: '', pubYear: '', category: '',
  startDate: '', endDate: '', rating: 0, review: '',
}

function toForm(b: Book): Form {
  return {
    title: b.title,
    author: b.author ?? '',
    publisher: b.publisher ?? '',
    pubYear: b.pub_year ? String(b.pub_year) : '',
    category: b.category ?? '',
    startDate: b.start_date ?? '',
    endDate: b.end_date ?? '',
    rating: b.rating ?? 0,
    review: b.review ?? '',
  }
}

// 시작일~완독일 일수 (시작일과 완독일을 모두 포함해서 셉니다)
function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / 86400000) + 1
}

export default function BookDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const { isOwner } = useOwner()

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [criteria, setCriteria] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    async function load() {
      const [bookRes, settingsRes] = await Promise.all([
        supabase.from('books').select('*').eq('id', id).single(),
        supabase.from('settings').select('*').eq('id', 1).single(),
      ])
      if (bookRes.data) {
        setBook(bookRes.data as Book)
        setForm(toForm(bookRes.data as Book))
      }
      if (settingsRes.data) {
        setCriteria(settingsRes.data.rating_criteria ?? {})
        setCategories(Array.isArray(settingsRes.data.categories) ? settingsRes.data.categories : [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function save() {
    if (!book) return
    if (!form.title.trim()) {
      setMessage('제목을 입력해 주세요.')
      return
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setMessage('완독일이 시작일보다 빨라요.')
      return
    }
    setSaving(true)
    setMessage('')
    const updates = {
      title: form.title.trim(),
      author: form.author.trim() || null,
      publisher: form.publisher.trim() || null,
      pub_year: form.pubYear ? Number(form.pubYear) : null,
      category: form.category || null,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      rating: form.rating || null,
      review: form.review.trim() || null,
    }
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', book.id)
      .select()
    setSaving(false)
    if (error || !data || data.length === 0) {
      setMessage('저장하지 못했어요. 로그인 상태를 확인해 주세요.')
      return
    }
    setBook(data[0] as Book)
    setForm(toForm(data[0] as Book))
    setEditing(false)
  }

  async function remove() {
    if (!book) return
    if (!window.confirm(`"${book.title}"을(를) 정말 삭제할까요? 되돌릴 수 없어요.`)) return
    // 저장소의 표지 파일도 같이 지워요
    const path = book.cover_url?.split('/covers/')[1]
    if (path) await supabase.storage.from('covers').remove([path])
    const { error } = await supabase.from('books').delete().eq('id', book.id)
    if (error) {
      setMessage('삭제하지 못했어요.')
      return
    }
    router.push('/')
  }

  if (loading) return <p>불러오는 중...</p>
  if (!book) {
    return (
      <p>
        책을 찾을 수 없어요. <Link href="/" className="underline">홈으로</Link>
      </p>
    )
  }

  const inputCls = 'w-full rounded border p-2'
  const catOptions =
    form.category && !categories.includes(form.category) ? [...categories, form.category] : categories

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-gray-500">← 목록으로</Link>

      <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
        {/* 표지 */}
        <div>
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover_url} alt={book.title} className="w-48 rounded shadow" />
          ) : (
            <div className="aspect-[2/3] w-48 rounded bg-gray-200" />
          )}
          {book.book_link && (
            <a
              href={book.book_link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-xs text-blue-600 underline"
            >
              YES24에서 보기
            </a>
          )}
        </div>

        {/* 정보 */}
        {!editing ? (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{book.title}</h1>
            <p className="text-gray-600">
              {[book.author, book.publisher, book.pub_year ? `${book.pub_year}년` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {book.category && (
              <span className="inline-block rounded bg-gray-200 px-2 py-0.5 text-xs">{book.category}</span>
            )}
            <p className="text-sm text-gray-600">
              {book.start_date ? book.start_date : '시작일 미정'}
              {' ~ '}
              {book.end_date ? book.end_date : book.start_date ? '읽는 중' : '미정'}
              {book.start_date && book.end_date && ` (${daysBetween(book.start_date, book.end_date)}일)`}
            </p>
            {book.rating ? <StarRating value={book.rating} criteria={criteria} /> : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm">제목</label>
              <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">저자</label>
              <input className={inputCls} value={form.author} onChange={(e) => set('author', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm">출판사</label>
                <input className={inputCls} value={form.publisher} onChange={(e) => set('publisher', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">출판연도</label>
                <input className={inputCls} type="number" value={form.pubYear} onChange={(e) => set('pubYear', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm">분야</label>
              <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">분야 선택</option>
                {catOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm">독서 시작일</label>
                <input className={inputCls} type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">완독일</label>
                <input className={inputCls} type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm">별점</label>
              <StarRating value={form.rating} onChange={(v) => set('rating', v)} criteria={criteria} />
            </div>
          </div>
        )}
      </div>

      {/* 독후감 */}
      <section>
        <h2 className="mb-2 font-bold">독후감</h2>
        {!editing ? (
          book.review ? (
            <p className="whitespace-pre-wrap rounded bg-white p-4 leading-7 shadow-sm">{book.review}</p>
          ) : (
            <p className="text-sm text-gray-400">아직 독후감이 없어요.</p>
          )
        ) : (
          <textarea
            className="min-h-64 w-full rounded border p-3 leading-7"
            placeholder="독후감을 자유롭게 적어 보세요."
            value={form.review}
            onChange={(e) => set('review', e.target.value)}
          />
        )}
      </section>

      {/* 나만 보이는 버튼 */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)} className="rounded bg-black px-4 py-2 text-sm text-white">
                수정 / 독후감 쓰기
              </button>
              <button onClick={remove} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600">
                삭제
              </button>
            </>
          ) : (
            <>
              <button onClick={save} disabled={saving} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setForm(toForm(book))
                  setEditing(false)
                  setMessage('')
                }}
                className="rounded border px-4 py-2 text-sm"
              >
                취소
              </button>
            </>
          )}
          {message && <span className="text-sm text-red-500">{message}</span>}
        </div>
      )}
    </div>
  )
}