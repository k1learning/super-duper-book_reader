import { supabase, getSupabaseConfig } from './supabase'
import { getSupabaseAdmin } from './supabase-admin'

const REQUIRED_BUCKETS = [
  {
    name: 'book-files',
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['application/pdf'],
  },
  {
    name: 'book-covers',
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
]
const REQUIRED_TABLES = ['books', 'notes', 'canvas_notes']

// Supabase supports two key formats:
//   • Legacy JWTs:  "eyJ..." with three dot-separated parts
//   • New format:   "sb_publishable_..." (client) / "sb_secret_..." (server)
// We accept either. Random UUIDs or empty strings fail this check, which
// is how we catch the most common .env misconfiguration.
function looksLikePublishableKey(value) {
  if (!value || typeof value !== 'string') return false
  if (value.startsWith('sb_publishable_')) return true
  return value.split('.').length === 3 && value.startsWith('eyJ')
}

function looksLikeSecretKey(value) {
  if (!value || typeof value !== 'string') return false
  if (value.startsWith('sb_secret_')) return true
  return value.split('.').length === 3 && value.startsWith('eyJ')
}

async function checkTables() {
  const issues = []
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' })
    if (error) {
      issues.push(`Table "${table}" is unreachable: ${error.message}`)
    }
  }
  return issues
}

async function ensureBuckets() {
  const issues = []
  const admin = getSupabaseAdmin()

  // Without the service-role key we can only verify existence, not create.
  // Use the anon client to list buckets and report which are missing.
  if (!admin) {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
      issues.push(
        `SUPABASE_SERVICE_ROLE_KEY is missing and listing buckets via the anon key failed: ${error.message}. Set SUPABASE_SERVICE_ROLE_KEY in .env.local to allow auto-create, or create the buckets manually in the Supabase dashboard.`
      )
      return issues
    }
    const existing = new Set((data || []).map((b) => b.name))
    for (const bucket of REQUIRED_BUCKETS) {
      if (!existing.has(bucket.name)) {
        issues.push(
          `Storage bucket "${bucket.name}" is missing. Create it manually (public) in the Supabase dashboard or add SUPABASE_SERVICE_ROLE_KEY to .env.local for auto-create.`
        )
      }
    }
    return issues
  }

  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) {
    issues.push(`Unable to list storage buckets: ${listError.message}`)
    return issues
  }

  const existing = new Map((buckets || []).map((b) => [b.name, b]))

  for (const spec of REQUIRED_BUCKETS) {
    if (existing.has(spec.name)) {
      // Bucket exists but may not be public — try to update.
      const current = existing.get(spec.name)
      if (current.public !== spec.public) {
        const { error: updateError } = await admin.storage.updateBucket(spec.name, {
          public: spec.public,
          fileSizeLimit: spec.fileSizeLimit,
          allowedMimeTypes: spec.allowedMimeTypes,
        })
        if (updateError) {
          issues.push(`Failed to update bucket "${spec.name}": ${updateError.message}`)
        }
      }
      continue
    }

    const { error: createError } = await admin.storage.createBucket(spec.name, {
      public: spec.public,
      fileSizeLimit: spec.fileSizeLimit,
      allowedMimeTypes: spec.allowedMimeTypes,
    })
    if (createError) {
      issues.push(`Failed to create bucket "${spec.name}": ${createError.message}`)
    }
  }

  return issues
}

export async function ensureSupabaseSetup() {
  const issues = []
  const { url, anonKey } = getSupabaseConfig()

  const where = process.env.VERCEL ? 'Vercel → Settings → Environment Variables' : '.env.local'

  if (!url) {
    issues.push(`NEXT_PUBLIC_SUPABASE_URL is missing. Add it in ${where} and redeploy.`)
  } else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
    issues.push(`NEXT_PUBLIC_SUPABASE_URL does not look right: "${url}". Expected https://<project>.supabase.co`)
  }

  if (!anonKey) {
    issues.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Add it in ${where} and redeploy.`)
  } else if (!looksLikePublishableKey(anonKey)) {
    issues.push(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY does not look valid. Expected either a JWT starting with "eyJ" or a new-format key starting with "sb_publishable_". Copy the publishable/anon key from Supabase → Settings → API Keys.'
    )
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey && !looksLikeSecretKey(serviceRoleKey)) {
    issues.push(
      'SUPABASE_SERVICE_ROLE_KEY is set but does not look valid. Expected a JWT starting with "eyJ" or a new-format key starting with "sb_secret_".'
    )
  }

  if (issues.length > 0) {
    // Stop early — calls to Supabase will all fail with these problems.
    return { ok: false, issues }
  }

  const [tableIssues, bucketIssues] = await Promise.all([checkTables(), ensureBuckets()])
  issues.push(...tableIssues, ...bucketIssues)

  return {
    ok: issues.length === 0,
    issues,
  }
}
