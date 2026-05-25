import { NextResponse } from 'next/server';
import { convertAllCalendars, detectConflicts, calculatePrecisionLoss } from '@/lib/calendar';
import type { CalendarDate, CalendarType } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date }: { date: CalendarDate } = body;

    if (!date || !date.calendar) {
      return NextResponse.json({ error: '缺少日期参数' }, { status: 400 });
    }

    const calendars = ['gregorian', 'lunar', 'mayan', 'persian'] as CalendarType[];
    const conversions: Record<string, any> = {};

    for (const cal of calendars) {
      try {
        const result = convertAllCalendars(date);
        conversions[cal] = result[cal as keyof typeof result];
      } catch (e) {
        conversions[cal] = { error: (e as Error).message };
      }
    }

    const conflicts = detectConflicts(date);

    return NextResponse.json({
      input: date,
      conversions,
      conflicts,
      precisionLoss: Object.fromEntries(
        calendars.map(cal => [cal, calculatePrecisionLoss(date.calendar, cal)])
      )
    });
  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  }
}
