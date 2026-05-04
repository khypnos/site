import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const supabase = createClient('https://fbxiynomlxrjasbbcipp.supabase.co', 'sb_publishable_1R_hEWSnFLiy-wpPdvrahw_AxMIg8bJ')

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/login.html'
    return null
  }
  return session
}

export async function getStudent(email) {
  const { data } = await supabase
    .from('students')
    .select('nom, plans, active')
    .eq('email', email)
    .single()

  if (!data || !data.active) {
    window.location.href = '/login.html?error=access_denied'
    return null
  }
  return data
}