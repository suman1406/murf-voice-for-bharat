import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const urgency = searchParams.get('urgency') || '';

  try {
    const res = await fetch(`${BACKEND_URL}/api/escalations?status=${status}&urgency=${urgency}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('FastAPI backend not reachable, falling back to mock or empty response:', err);
  }

  return NextResponse.json({
    status: 'success',
    count: 0,
    data: [],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/escalations/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error('Error resolving escalation:', err);
  }

  return NextResponse.json({ status: 'error', message: 'Backend unreachable' }, { status: 500 });
}
