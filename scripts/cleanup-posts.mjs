import { createClient } from '@supabase/supabase-js';

// Cleanup script:
// - Free users: delete posts older than 30 days
// - Paying users: delete posts older than 90 days
// Also deletes associated images in Supabase Storage (bucket: images)
//
// Environment variables required:
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (must be a service role key)
//
// Optional flags:
//   DRY_RUN=true      -> Do not delete, only log what would be deleted
//   CONCURRENCY=5     -> How many users to process in parallel

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const DRY_RUN = String(process.env.DRY_RUN || 'false').toLowerCase() === 'true';
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || '5', 10));

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function isPayingPlanFromPrefs(prefs) {
  // Try to infer plan from user_preferences.preferences JSON
  // Accept a few keys/values commonly used in the app
  // paying if plan in ['starter','growth','pro','power'] or subscription.plan in that list
  if (!prefs) return false;
  try {
    const p = typeof prefs === 'string' ? JSON.parse(prefs) : prefs;
    const plan = (p?.plan || p?.subscription?.plan || p?.billingPlan || '').toString().toLowerCase();
    return ['starter', 'growth', 'pro', 'power', 'paid'].includes(plan);
  } catch {
    return false;
  }
}

function extractStoragePathFromPublicUrl(url) {
  // Example: https://PROJECT.supabase.co/storage/v1/object/public/images/generated-content/<userId>/post-...png
  // We need the path relative to bucket, e.g., generated-content/<userId>/post-...png
  try {
    if (!url) return null;
    const u = new URL(url);
    const parts = u.pathname.split('/');
    // Find 'public/images' and take the rest
    const idx = parts.findIndex((p) => p === 'public');
    if (idx >= 0 && parts[idx + 1] === 'images') {
      const after = parts.slice(idx + 2).join('/');
      return after || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchAllUsers() {
  const users = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.from('users').select('id,email').range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    users.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return users;
}

async function fetchUserPlan(userId) {
  // Try user_preferences.preferences
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.warn('Failed to load user preferences for', userId, error.message);
  }
  const prefs = data?.preferences || null;
  const paying = isPayingPlanFromPrefs(prefs);
  return { paying, prefs };
}

async function fetchDeletablePosts(userId, olderThanIso) {
  // We need to read posts (to get image_urls), then delete them
  const toDelete = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, image_urls, created_at')
      .eq('user_id', userId)
      .lt('created_at', olderThanIso)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    toDelete.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return toDelete;
}

async function deleteStorageImages(urls) {
  // Convert public URLs to storage paths and delete from bucket 'images'
  const paths = (urls || [])
    .map((u) => extractStoragePathFromPublicUrl(u))
    .filter(Boolean);
  if (paths.length === 0) return { success: true, count: 0 };
  if (DRY_RUN) {
    console.log(`[DRY_RUN] Would delete ${paths.length} storage objects from bucket 'images'`);
    return { success: true, count: paths.length };
  }
  const { data, error } = await supabase.storage.from('images').remove(paths);
  if (error) {
    console.warn('Storage delete error:', error.message);
    // Best-effort: continue
    return { success: false, count: 0 };
  }
  return { success: true, count: data?.length || paths.length };
}

async function deletePostsByIds(ids) {
  if (!ids.length) return { success: true, count: 0 };
  if (DRY_RUN) {
    console.log(`[DRY_RUN] Would delete ${ids.length} rows from posts table`);
    return { success: true, count: ids.length };
  }
  const { error } = await supabase.from('posts').delete().in('id', ids);
  if (error) {
    console.error('Posts delete error:', error.message);
    return { success: false, count: 0 };
  }
  return { success: true, count: ids.length };
}

async function processUser(user) {
  try {
    const { paying } = await fetchUserPlan(user.id);
    const days = paying ? 90 : 30;
    const cutoffIso = daysAgoDate(days);

    const deletable = await fetchDeletablePosts(user.id, cutoffIso);
    if (!deletable.length) {
      return { userId: user.id, paying, deleted: 0, images: 0 };
    }

    // Collect image URLs
    const allUrls = deletable.flatMap((p) => Array.isArray(p.image_urls) ? p.image_urls : []);

    // Delete images first (best-effort)
    const storageRes = await deleteStorageImages(allUrls);

    // Delete posts
    const ids = deletable.map((p) => p.id);
    const postsRes = await deletePostsByIds(ids);

    return { userId: user.id, paying, deleted: postsRes.count, images: storageRes.count };
  } catch (err) {
    console.error('Error processing user', user.id, err?.message || err);
    return { userId: user.id, paying: false, deleted: 0, images: 0, error: true };
  }
}

async function run() {
  console.log('Starting posts cleanup...', { DRY_RUN, CONCURRENCY });
  const users = await fetchAllUsers();
  console.log(`Found ${users.length} users`);

  // Simple concurrency control
  const results = [];
  let i = 0;
  async function worker() {
    while (i < users.length) {
      const index = i++;
      const user = users[index];
      const res = await processUser(user);
      results.push(res);
      const label = res.paying ? 'paid' : 'free';
      console.log(`User ${user.email || user.id} [${label}] -> deleted ${res.deleted} posts, ${res.images} images${res.error ? ' (with errors)' : ''}`);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);
  const totalImages = results.reduce((sum, r) => sum + (r.images || 0), 0);
  console.log('Cleanup complete.', { totalDeleted, totalImages, usersProcessed: results.length, DRY_RUN });
}

run().catch((e) => {
  console.error('Fatal cleanup error:', e?.message || e);
  process.exit(1);
});

