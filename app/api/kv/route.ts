import { NextResponse } from 'next/server'
import { isKvConfigured } from '@/lib/kv'

export async function GET() {
  const configured = isKvConfigured()
  return NextResponse.json({
    configured,
    env: {
      KV_URL: Boolean(process.env.KV_URL),
      KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
      KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN),
    },
  })
}
