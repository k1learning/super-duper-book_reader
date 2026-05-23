export const dynamic = 'force-dynamic'

import HomeClient from './HomeClient'
import { ensureSupabaseSetup } from './lib/supabase-setup'

export default async function Home() {
  const setup = await ensureSupabaseSetup()
  const setupWarning = setup.ok ? null : setup.issues.join(' | ')

  return <HomeClient setupWarning={setupWarning} />
}
