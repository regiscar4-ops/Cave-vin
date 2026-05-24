import { createClient } from '@supabase/supabase-js'
export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const { user_id } = req.body
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  await Promise.all([
    sb.from('historique').delete().eq('user_id',user_id),
    sb.from('courses').delete().eq('user_id',user_id),
    sb.from('offline_queue').delete().eq('user_id',user_id)
  ])
  await sb.from('bouteilles').delete().eq('user_id',user_id)
  await sb.from('preferences').delete().eq('user_id',user_id)
  await sb.auth.admin.deleteUser(user_id)
  res.status(200).json({ success:true })
}
