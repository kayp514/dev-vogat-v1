import { NextResponse } from 'next/server';

const API = "https://api-vogat.vercel.app";
const API_VERSION = "v1";
const USERS_ENDPOINT = "users";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 10;

    const params = new URLSearchParams({
      maxResults: pageSize.toString(),
    });
    
    if (page > 1) {
      const offset = (page - 1) * pageSize;
      params.append("nextPage", offset.toString());
    }
    
    const url = `${API}/${API_VERSION}/${USERS_ENDPOINT}?${params.toString()}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`);
    }

    const data = await res.json();
    
    return NextResponse.json({
      success: true,
      users: data.users || [],
      totalCount: data.totalCount || 0,
      totalPages: data.totalPages || 0,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_USERS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch users',
        },
      },
      { status: 500 }
    );
  }
}
