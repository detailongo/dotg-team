"use client";
import { UploadButton } from "../../src/utils/uploadthing";
export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          console.log("Upload results:", res);
          alert("Upload successful!");
        }}
        onUploadError={(error) => {
          console.error("Upload error:", error);
          alert(`Upload failed: ${error.message}`);
        }}
      />
    </main>
  );
}