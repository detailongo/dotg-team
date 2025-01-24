// app/api/files/route.js
import { UTApi } from "uploadthing/server";

// GET endpoint
export async function GET() {
  const utapi = new UTApi();
  try {
    const { files } = await utapi.listFiles();

    // Format the files to include the correct `route` property
    const formattedFiles = files.map((file) => ({
      key: file.key,
      name: file.name,
      size: file.size,
      uploadedAt: file.uploadedAt,
      status: file.status,
      type: file.name.split('.').pop(), // Extract file extension
      route: `https://${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}.ufs.sh/f/${file.key}`, // Use NEXT_PUBLIC_UPLOADTHING_APP_ID
    }));

    return Response.json(formattedFiles);
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint
export async function DELETE(request) {
  const utapi = new UTApi();
  const { fileKey } = await request.json();

  try {
    await utapi.deleteFiles(fileKey);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}