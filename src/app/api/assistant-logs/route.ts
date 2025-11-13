import { NextResponse } from 'next/server';

// Store recent logs in memory (will reset on server restart)
const recentLogs: Array<{ timestamp: string; level: string; message: string }> = [];
const MAX_LOGS = 50;

// Function to add log (can be called from other modules)
export function addAssistantLog(level: 'info' | 'warn' | 'error', message: string) {
  recentLogs.push({
    timestamp: new Date().toISOString(),
    level,
    message
  });
  
  // Keep only recent logs
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }
}

export async function GET() {
  return NextResponse.json({
    logs: recentLogs,
    count: recentLogs.length,
    note: 'These are in-memory logs that reset on server restart'
  });
}

export async function DELETE() {
  recentLogs.length = 0;
  return NextResponse.json({ message: 'Logs cleared' });
}
