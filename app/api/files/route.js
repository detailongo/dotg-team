import { UTApi } from "uploadthing/server";

export async function GET() {
  const utapi = new UTApi();
  
  try {
    const { files } = await utapi.listFiles();
    return Response.json(files); // Return just the files array
  } catch (error) {
    console.error('Error fetching files:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}