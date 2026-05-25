import { NextResponse } from 'next/server';
import { PRESETS } from '@/lib/constants';
import { getDatabase, getPreset } from '@/lib/database';
import type { PresetId } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const presetId = params.id as PresetId;
    const preset = PRESETS[presetId];

    if (!preset) {
      return NextResponse.json({ error: '预设不存在' }, { status: 404 });
    }

    let dbPreset: any = null;
    try {
      dbPreset = getPreset(presetId);
    } catch (e) {
      // 数据库可能未初始化
    }

    return NextResponse.json({
      ...preset,
      databasePreset: dbPreset
    });
  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  }
}
