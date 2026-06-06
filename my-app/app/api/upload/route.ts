import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '../../../lib/cloudinary';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to ArrayBuffer and then Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fallback if Cloudinary is not configured
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (!isCloudinaryConfigured) {
      console.warn('Cloudinary is not configured. Falling back to generating a stylized placeholder avatar.');
      // Generate a beautiful avatar using Dicebear
      const randomSeed = Math.random().toString(36).substring(7);
      const fallbackUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}`;
      return NextResponse.json({ url: fallbackUrl });
    }

    // Upload to Cloudinary using upload_stream
    return new Promise<NextResponse>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'student-portal-profiles',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            resolve(
              NextResponse.json(
                { error: 'Failed to upload to Cloudinary: ' + error.message },
                { status: 500 }
              )
            );
          } else {
            resolve(NextResponse.json({ url: result?.secure_url }));
          }
        }
      );
      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
