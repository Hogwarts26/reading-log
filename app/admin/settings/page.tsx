'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useOwner } from '@/lib/useOwner'

const STAR_KEYS = ['1', '2', '3', '4', '5']

export default function SettingsPage() {
  const { isOwner, loading } = useOwner()
  const [criteria, setCriteria] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<string[]>([])
  const [newCat, setNewCat] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (!data) return
        setCriteria(data.rating_criteria ?? {})
        setCategories(Array.isArray(data.categories) ? data.categories : [])
      })
  }, [])

  function addCategory() {
    const c = newCat.trim()
    if (!c || categories.includes(c)) return
    setCategories([...categories, c])
    setNewCat('')
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= categories.length) return
    const next = [...categories]
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    setCategories(next)
  }

  async function save() {
    setSaving(true)
    setMessage('')
    const cleanCriteria: Record<string, string> = {}
    STAR_KEYS.forEach((k) => {
      cleanCriteria[k] = (criteria[k] ?? '').trim()
    })
    const { data, error } = await supabase
      .from('settings')
      .update({ rating_criteria: cleanCriteria, categories })
      .eq('id', 1)
      .select()
    setSaving(false)
    if (error || !data || data.length === 0) {
      setMessage('저장하지 못했어요. 로그인 상태를 확인해 주세요.')
      return
    }
    setMessage('✅ 저장했어요!')
  }

  if (loading) return <p>확인 중...</p>
  if (!isOwner)
    return (
      <p>
        로그인이 필요해요. <Link href="/login" className="underline">로그인하기</Link>
      </p>
    )

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-gray-500">← 책 추가로</Link>
        <h1 className="mt-2 text-xl font-bold">환경설정</h1>
      </div>

      <section className="space-y-2">
        <h2 className="font-bold">별점 기준</h2>
        <p className="text-sm text-gray-500">별에 마우스를 올리거나 터치하면 이 문구가 말풍선으로 떠요.</p>
        {STAR_KEYS.map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-10 text-yellow-500">{'★'.repeat(Number(k))}</span>
            <input
              className="w-full rounded border p-2"
              value={criteria[k] ?? ''}
              onChange={(e) => setCriteria({ ...criteria, [k]: e.target.value })}
              placeholder={`${k}점의 기준`}
            />
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">분야 목록</h2>
        <p className="text-sm text-gray-500">
          책을 등록할 때 고르는 분야예요. 목록에서 지워도 이미 기록한 책의 분야는 그대로 남아요.
        </p>
        <ul className="space-y-1">
          {categories.map((c, i) => (
            <li key={c} className="flex items-center gap-2 rounded bg-white px-3 py-1.5 shadow-sm">
              <span className="flex-1">{c}</span>
              <button onClick={() => move(i, -1)} className="px-1 text-gray-400" aria-label="위로">▲</button>
              <button onClick={() => move(i, 1)} className="px-1 text-gray-400" aria-label="아래로">▼</button>
              <button
                onClick={() => setCategories(categories.filter((x) => x !== c))}
                className="px-1 text-red-500"
                aria-label="삭제"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="w-full rounded border p-2"
            placeholder="새 분야 이름"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button onClick={addCategory} className="whitespace-nowrap rounded border px-4">추가</button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded bg-black px-5 py-2 text-white disabled:opacity-50">
          {saving ? '저장 중...' : '저장'}
        </button>
        {message && <span className="text-sm">{message}</span>}
      </div>
    </div>
  )
}