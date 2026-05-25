import { NextResponse } from 'next/server';
import { getDatabase, getAllNodes, getUnlockedNodes, getConnections, getConversionRules } from '@/lib/database';
import { DEFAULT_MAZE_STATE } from '@/lib/constants';

export async function GET() {
  try {
    let nodes: any[] = [];
    let connections: any[] = [];
    let rules: any[] = [];

    try {
      nodes = getAllNodes();
      connections = getConnections();
      rules = getConversionRules();
    } catch (e) {
      // 数据库可能未初始化，使用默认数据
    }

    return NextResponse.json({
      state: DEFAULT_MAZE_STATE,
      databaseNodes: nodes,
      databaseConnections: connections,
      databaseRules: rules
    });
  } catch (error) {
    return NextResponse.json({
      state: DEFAULT_MAZE_STATE
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodeId, action } = body;

    if (!nodeId) {
      return NextResponse.json({ error: '缺少节点ID' }, { status: 400 });
    }

    if (action === 'unlock') {
      try {
        const db = getDatabase();
        db.prepare('UPDATE time_nodes SET unlocked = 1 WHERE id = ?').run(nodeId);
      } catch (e) {
        // 数据库可能未初始化
      }
    }

    return NextResponse.json({ success: true, nodeId });
  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message
    }, { status: 500 });
  }
}
