export const dynamic = 'force-dynamic'

import HomeClient from './HomeClient'
import { ensureSupabaseSetup } from './lib/supabase-setup'

export default async function Home() {
  let setupWarning = null
  try {
    const setup = await ensureSupabaseSetup()
    setupWarning = setup.ok ? null : setup.issues.join(' | ')
  } catch (err) {
    setupWarning = `Supabase setup check failed: ${err?.message || String(err)}`
  }

  return <HomeClient setupWarning={setupWarning} />
}
