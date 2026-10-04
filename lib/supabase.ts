import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Thiếu cấu hình Supabase. Hãy kiểm tra NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local.'
  )
}

export function supabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
