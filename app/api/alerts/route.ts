import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const alertsDir = path.join(process.cwd(), 'public', 'alerts');
  
  if (!fs.existsSync(alertsDir)) {
    fs.mkdirSync(alertsDir, { recursive: true });
    return NextResponse.json([]);
  }

  try {
    const files = fs.readdirSync(alertsDir);
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
    });

    return NextResponse.json(audioFiles);
  } catch (error) {
    console.error('Error reading alerts directory:', error);
    return NextResponse.json({ error: 'Failed to read alerts' }, { status: 500 });
  }
}
