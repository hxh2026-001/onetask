import { NextResponse } from 'next/server';
import { findShortestPath, detectEndlessLoops, detectTimezoneConflicts, detectPrecisionLoss } from '@/lib/pathfinding';
import { DEFAULT_MAZE_STATE } from '@/lib/constants';
import { getDatabase } from '@/lib/database';
import type { MazeLayout } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, layout } = body;

    let mazeLayout: MazeLayout = layout || DEFAULT_MAZE_STATE.layout;

    if (!from || !to) {
      return NextResponse.json({ error: '缺少起点或目标参数' }, { status: 400 });
    }

    const result = findShortestPath(
      mazeLayout,
      from,
      to,
      DEFAULT_MAZE_STATE.activeCalendar
    );

    const loops = detectEndlessLoops(mazeLayout);
    const timezoneConflicts = detectTimezoneConflicts(mazeLayout);
    const precisionLoss = detectPrecisionLoss(mazeLayout, from, to);

    return NextResponse.json({
      ...result,
      loops,
      timezoneConflicts,
      precisionLoss,
      analysis: {
        pathLength: result.path.length,
        totalCost: result.cost,
        warnings: result.warnings.length,
        loopDetected: loops.length > 0,
        timezoneConflicts: timezoneConflicts.length > 0
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  }
}
