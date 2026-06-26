import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const sp = request.nextUrl.searchParams

  let query = supabase
    .from('questions')
    .select('*, passage:passages(id, title)')
    .order('created_at', { ascending: false })

  const section = sp.get('section')
  const status = sp.get('status')
  const limit = parseInt(sp.get('limit') ?? '50')

  if (section) query = query.eq('section', section)
  if (status) query = query.eq('status', status)
  query = query.limit(limit)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('questions')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
