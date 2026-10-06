'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useOwner() {
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsOwner(!!data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsOwner(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { isOwner, loading }
}