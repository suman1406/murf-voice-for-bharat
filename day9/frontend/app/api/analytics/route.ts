import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'summary';

  try {
    let endpoint = '/api/analytics';
    if (type === 'recent') {
      endpoint = '/api/analytics/recent';
    } else if (type === 'chart') {
      endpoint = '/api/analytics/chart-data';
    }

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  } catch (err) {
    console.warn('Analytics backend not reachable:', err);
  }

  // Fallback empty response
  if (type === 'recent') {
    return NextResponse.json([]);
  }
  if (type === 'chart') {
    return NextResponse.json([]);
  }
  return NextResponse.json({
    total_calls: 0,
    successful_calls: 0,
    failed_calls: 0,
    in_progress: 0,
    success_rate: 0,
    avg_duration_seconds: 0,
    failure_breakdown: [],
  });
}
