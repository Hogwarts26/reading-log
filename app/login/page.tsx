'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('이메일 또는 비밀번호가 맞지 않아요.')
    else router.push('/admin')
  }

  return (
    <div className="mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">주인 로그인</h1>
      <input className="w-full rounded border p-2" placeholder="이메일"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded border p-2" type="password" placeholder="비밀번호"
        value={password} onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
      <button onClick={handleLogin} className="w-full rounded bg-black p-2 text-white">로그인</button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}