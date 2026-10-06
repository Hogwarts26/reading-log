'use client'
import Link from 'next/link'
import { useOwner } from '@/lib/useOwner'

export default function AdminPage() {
  const { isOwner, loading } = useOwner()
  if (loading) return <p>확인 중...</p>
  if (!isOwner)
    return <p>로그인이 필요해요. <Link href="/login" className="underline">로그인하기</Link></p>
  return <p>✅ 로그인 성공! 다음 단계에서 책 추가 기능이 여기 들어가요.</p>
}