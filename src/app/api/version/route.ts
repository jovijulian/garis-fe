import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    buildId: process.env.NEXT_PUBLIC_APP_BUILD_ID 
  });
}

export const dynamic = 'force-dynamic';