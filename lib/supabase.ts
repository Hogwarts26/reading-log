import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Book = {
  id: string
  title: string
  author: string | null
  publisher: string | null
  pub_year: number | null
  category: string | null
  cover_url: string | null
  cover_color: string | null
  isbn13: string | null
  book_link: string | null
  rating: number | null
  start_date: string | null
  end_date: string | null
  review: string | null
  created_at: string
}