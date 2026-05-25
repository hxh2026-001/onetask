import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT count(*) as count FROM conversion_rules').get() as { count: number };

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      rulesCount: result.count
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: (error as Error).message
    }, { status: 500 });
  }
}
