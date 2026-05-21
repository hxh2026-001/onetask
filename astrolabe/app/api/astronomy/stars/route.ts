import { NextResponse } from 'next/server';
import { getAllStars, getStarById } from '@/lib/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (id) {
    const star = await getStarById(parseInt(id));
    return NextResponse.json(star);
  }
  
  const stars = await getAllStars();
  return NextResponse.json(stars);
}