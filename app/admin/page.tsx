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
        로그인이 필요합니다. <Link href="/login" className="underline">로그인하기</Link>
      </p>
    )
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">책 추가</h1>
      <BookForm />
    </div>
  )
}