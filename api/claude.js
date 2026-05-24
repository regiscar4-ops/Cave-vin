export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' } })
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!req.headers.get('authorization')) return new Response('Unauthorized', { status: 401 })
  try {
    const body = await req.json()
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:1500, ...body })
    })
    const data = await response.json()
    return new Response(JSON.stringify(data), { status:200, headers:{ 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' } })
  } catch {
    return new Response(JSON.stringify({ error:'Service indisponible' }), { status:503 })
  }
}
