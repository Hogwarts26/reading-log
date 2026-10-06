'use client'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useOwner } from '@/lib/useOwner'

export default function Header() {
  const { isOwner } = useOwner()
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 text-sm">
        <Link href="/" className="font-bold">📚 내 서재</Link>
        <Link href="/calendar">달력</Link>
        <Link href="/stats">통계</Link>
        <span className="flex-1" />
        {isOwner ? (
          <>
            <Link href="/admin">관리</Link>
            <button onClick={() => supabase.auth.signOut()}>로그아웃</button>
          </>
        ) : (
          <Link href="/login" className="text-gray-400">로그인</Link>
        )}
      </nav>
    </header>
  )
}