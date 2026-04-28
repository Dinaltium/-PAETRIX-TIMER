import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Only allow audio files
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Only audio files are allowed' }, { status: 400 });
    }

    // Path to public/alerts
    const publicPath = path.join(process.cwd(), 'public', 'alerts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    const filePath = path.join(publicPath, file.name);
    
    // Check if we are on Vercel (read-only filesystem)
    if (process.env.VERCEL) {
      return NextResponse.json({ 
        error: 'Vercel filesystem is read-only. Uploading directly to the "public" folder is only supported in local development. For production, please use the URL option or Vercel Blob.' 
      }, { status: 403 });
    }

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, name: file.name });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
