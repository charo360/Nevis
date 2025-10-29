import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const date = searchParams.get('date');

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    }

    let query = supabase
      .from('scheduled_content')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'scheduled');

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('scheduled_content')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete calendar data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, serviceName, date, contentType, platform, notes } = body;

    if (!brandId || !serviceName || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scheduled_content')
      .insert({
        brand_id: brandId,
        service_name: serviceName,
        date,
        content_type: contentType || 'post',
        platform: platform || 'All',
        notes,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Calendar create error:', error);
    return NextResponse.json({ error: 'Failed to create scheduled content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, generatedPostId } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (generatedPostId) updateData.generated_post_id = generatedPostId;

    const { data, error } = await supabase
      .from('scheduled_content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Calendar update error:', error);
    return NextResponse.json({ error: 'Failed to update scheduled content' }, { status: 500 });
  }
}