import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

// Initialize UploadThing
const f = createUploadthing();

// Mock authentication function
const auth = (req) => ({ id: "fakeId" });

// Define your file router
export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId };
    })
};