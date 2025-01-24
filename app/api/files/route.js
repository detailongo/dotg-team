// app/api/files/route.js
import { UTApi } from "uploadthing/server";

// GET endpoint (existing)
export async function GET() {
  const utapi = new UTApi();
  try {
    const { files } = await utapi.listFiles();
    return Response.json(files);
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// NEW DELETE endpoint (add this to the same file)
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