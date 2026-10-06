'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { extractDominantColor } from '@/lib/color'
import StarRating from './StarRating'

type SearchItem = {
  id: number
  title: string
  author: string
  publisher: string
  pub_year: number | null
  category: string
  raw_category: string
  cover: string
  isbn13: string
  link: string
}

const DEFAULT_CATEGORIES = [
  '소설', '에세이', '인문', '경제/경영', '자기계발', '과학', '역사', '시/희곡', '만화', '기타',
]

export default function BookForm() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [criteria, setCriteria] = useState<Record<string, string>>({})

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [pubYear, setPubYear] = useState('')
  const [category, setCategory] = useState('')
  const [isbn13, setIsbn13] = useState('')
  const [bookLink, setBookLink] = useState('')
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [coverColor, setCoverColor] = useState('')
  const [rating, setRating] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 환경설정(분야 목록, 별점 기준) 불러오기
  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (!data) return
        if (Array.isArray(data.categories)) setCategories(data.categories)
        if (data.rating_criteria) setCriteria(data.rating_criteria)
      })
  }, [])

  // 제목을 입력하고 0.5초 쉬면 자동 검색
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      try {
        const { data: s } = await supabase.auth.getSession()
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${s.session?.access_token ?? ''}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || '검색에 실패했어요.')
        setResults(json.items)
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : '검색에 실패했어요.')
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  async function setCoverFromBlob(blob: Blob) {
    setCoverBlob(blob)
    setCoverPreview(URL.createObjectURL(blob))
    try {
      setCoverColor(await extractDominantColor(blob))
    } catch {
      setCoverColor('')
    }
  }

  // 검색 결과를 고르면 폼이 자동으로 채워져요
  async function pickResult(item: SearchItem) {
    setTitle(item.title)
    setAuthor(item.author)
    setPublisher(item.publisher)
    setPubYear(item.pub_year ? String(item.pub_year) : '')
    setCategory(categories.includes(item.category) ? item.category : '')
    setIsbn13(item.isbn13)
    setBookLink(item.link)
    setResults([])
    setMessage('')
    try {
      const res = await fetch(`/api/books/cover?url=${encodeURIComponent(item.cover)}`)
      if (!res.ok) throw new Error()
      await setCoverFromBlob(await res.blob())
    } catch {
      setMessage('표지를 불러오지 못했어요. 아래에서 직접 올려 주세요.')
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setCoverFromBlob(f)
  }

  function resetForm() {
    setQuery('')
    setResults([])
    setTitle('')
    setAuthor('')
    setPublisher('')
    setPubYear('')
    setCategory('')
    setIsbn13('')
    setBookLink('')
    setCoverBlob(null)
    setCoverPreview('')
    setCoverColor('')
    setRating(0)
    setStartDate('')
    setEndDate('')
  }

  async function save() {
    if (!title.trim()) {
      setMessage('제목을 입력해 주세요.')
      return
    }
    if (startDate && endDate && endDate < startDate) {
      setMessage('완독일이 시작일보다 빨라요.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      let coverUrl: string | null = null
      if (coverBlob) {
        const ext = coverBlob.type.includes('png') ? 'png' : 'jpg'
        const path = `${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('covers')
          .upload(path, coverBlob, { contentType: coverBlob.type || 'image/jpeg' })
        if (upErr) throw upErr
        coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      }

      const { error } = await supabase.from('books').insert({
        title: title.trim(),
        author: author.trim() || null,
        publisher: publisher.trim() || null,
        pub_year: pubYear ? Number(pubYear) : null,
        category: category || null,
        cover_url: coverUrl,
        cover_color: coverColor || null,
        isbn13: isbn13 || null,
        book_link: bookLink || null,
        rating: rating || null,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      if (error) throw error

      setMessage('✅ 저장했어요! 홈에서 확인해 보세요.')
      resetForm()
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? String(e)
      setMessage(`저장 실패: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded border p-2'

  return (
    <div className="space-y-8">
      {/* 1. 검색 */}
      <section>
        <label className="mb-1 block text-sm font-medium">책 제목으로 검색</label>
        <input
          className={inputCls}
          placeholder="제목을 입력하면 자동으로 검색돼요 (2글자 이상)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <p className="mt-2 text-sm text-gray-500">검색 중...</p>}
        {searchError && <p className="mt-2 text-sm text-red-500">{searchError}</p>}
        {results.length > 0 && (
          <ul className="mt-2 max-h-96 divide-y overflow-y-auto rounded border bg-white">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pickResult(r)}
                  className="flex w-full gap-3 p-2 text-left hover:bg-gray-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.cover} alt="" className="h-20 w-14 flex-none object-cover" />
                  <span className="text-sm">
                    <span className="block font-medium">{r.title}</span>
                    <span className="block text-gray-500">
                      {r.author} · {r.publisher} · {r.pub_year ?? '?'}
                    </span>
                    <span className="block text-xs text-gray-400">{r.raw_category}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. 입력 폼 */}
      <section className="grid gap-6 sm:grid-cols-[170px_1fr]">
        <div>
          <div className="aspect-[2/3] w-40 overflow-hidden rounded bg-gray-200">
            {coverPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="표지" className="h-full w-full object-cover" />
            )}
          </div>
          <label className="mt-2 block cursor-pointer text-xs text-blue-600 underline">
            내 사진으로 올리기
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          {coverColor && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
              <span className="inline-block h-4 w-4 rounded" style={{ background: coverColor }} />
              표지 색 {coverColor}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">제목</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">저자</label>
            <input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">출판사</label>
              <input className={inputCls} value={publisher} onChange={(e) => setPublisher(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">출판연도</label>
              <input
                className={inputCls}
                type="number"
                value={pubYear}
                onChange={(e) => setPubYear(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm">분야</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">분야 선택</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">독서 시작일</label>
              <input
                className={inputCls}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">완독일</label>
              <input
                className={inputCls}
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm">별점</label>
            <StarRating value={rating} onChange={setRating} criteria={criteria} />
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded bg-black p-3 text-white disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
          {message && <p className="text-sm">{message}</p>}
        </div>
      </section>
    </div>
  )
}