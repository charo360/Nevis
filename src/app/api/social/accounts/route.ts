/**
 * Social Accounts API
 * Get connected accounts and disconnect accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnectedAccounts, disconnectAccount } from '@/lib/social/token-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandProfileId = searchParams.get('brandProfileId');

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'brandProfileId is required' },
        { status: 400 }
      );
    }

    const accounts = await getConnectedAccounts(brandProfileId);

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        count: accounts.length,
      },
    });
  } catch (error) {
    console.error('❌ [Social API] Error getting accounts:', error);
    return NextResponse.json(
      { error: 'Failed to get connected accounts', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandProfileId, platform, accountId } = body;

    if (!brandProfileId || !platform || !accountId) {
      return NextResponse.json(
        { error: 'brandProfileId, platform, and accountId are required' },
        { status: 400 }
      );
    }

    await disconnectAccount(brandProfileId, platform, accountId);

    return NextResponse.json({
      success: true,
      message: `Disconnected ${platform} account`,
    });
  } catch (error) {
    console.error('❌ [Social API] Error disconnecting account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account', details: String(error) },
      { status: 500 }
    );
  }
}
