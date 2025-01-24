// app/api/files/route.js
import { UTApi } from "uploadthing/server";

// DELETE endpoint
export async function DELETE(request) {
  const utapi = new UTApi();

  try {
    // Parse the request body
    const { fileKey } = await request.json();

    // Validate the fileKey
    if (!fileKey || typeof fileKey !== 'string') {
      return Response.json(
        { success: false, error: 'Invalid fileKey' },
        { status: 400 }
      );
    }

    // Delete the file using UploadThing
    await utapi.deleteFiles(fileKey);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}