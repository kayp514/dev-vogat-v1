import { getRedisClient, CacheKeys } from '@/lib/db/redis-sync-cache';
import { NextResponse } from 'next/server';
import { auth } from '@tern-secure/nextjs/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    const uid = userId

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const client = await getRedisClient();
    const cachedUser = await client.hGetAll(CacheKeys.USER_DATA('default', uid));
    
    return NextResponse.json(cachedUser || { status: 'offline' });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const { uid } = await request.json();
      const client = await getRedisClient();
      const cachedUser = await client.hGetAll(CacheKeys.USER_DATA('default', uid));
      
      return NextResponse.json(cachedUser || { status: 'offline' });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}