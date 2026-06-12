import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general'; // course, hero, gallery, general
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${timestamp}-${baseName}${ext}`;

    // Determine upload directory based on type
    const uploadDirs: Record<string, string> = {
      course: 'courses',
      hero: 'hero',
      gallery: 'gallery',
      testimonial: 'testimonials',
      blog: 'blog',
      general: 'uploads'
    };
    const subDir = uploadDirs[type] || 'uploads';
    
    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'images', subDir);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    // Write file
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the path to use
    const publicPath = `/images/${subDir}/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      path: publicPath,
      url: publicPath, // Also return as 'url' for compatibility
      fileName: fileName,
      type: type
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
