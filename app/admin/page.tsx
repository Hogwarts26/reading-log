'use client'
import Link from 'next/link'
import { useOwner } from '@/lib/useOwner'
import BookForm from '@/components/BookForm'

export default function AdminPage() {
  const { isOwner, loading } = useOwner()
  if (loading) return <p>확인 중...</p>
  if (!isOwner)
    return (
      <p>
        로그인이 필요해요. <Link href="/login" className="underline">로그인하기</Link>
      </p>
    )
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">책 추가</h1>
        <Link href="/admin/settings" className="text-sm text-gray-500 underline">
          ⚙ 환경설정 (별점 기준·분야)
        </Link>
      </div>
      <BookForm />
    </div>
  )
}