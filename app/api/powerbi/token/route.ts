import { NextRequest, NextResponse } from 'next/server';
import { powerBIService } from '@/services/powerbi/powerbi.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId') || undefined;

    const config = await powerBIService.getEmbedConfig(reportId);
    return NextResponse.json(config);
  } catch (err: any) {
    console.error('Power BI Token Endpoint Error:', err);
    return NextResponse.json({ error: 'Failed to generate Power BI token', details: err.message }, { status: 500 });
  }
}
