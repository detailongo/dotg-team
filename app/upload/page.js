"use client";
import { useState, useEffect } from 'react';
import { UploadDropzone } from "../../src/utils/uploadthing";
import { Search, File, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add filtered files calculation
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await fetch('/api/files');
        if (!res.ok) throw new Error('Failed to fetch files');
        
        const files = await res.json();
        const formattedFiles = files.map(file => ({
          name: file.name || file.key.split('/').pop(),
          size: `${(file.size / 1024).toFixed(2)} KB`,
          uploadedAt: new Date(file.uploadedAt).toLocaleDateString(),
          status: file.status.toLowerCase(),
          route: `https://${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}.ufs.sh/f/${file.key}`
        }));
        
        setFiles(formattedFiles);
      } catch (error) {
        console.error("Error loading files:", error);
        // Optional: Add error state UI feedback
      }
    };
    loadFiles();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8">
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const newFiles = res.map(file => ({
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                uploadedAt: new Date().toLocaleDateString(),
                status: 'success',
                route: file.url
              }));
              setFiles(prev => [...newFiles, ...prev]);
            }}
            onUploadError={(error) => {
              const errorFile = {
                name: error.message,
                size: 'N/A',
                uploadedAt: new Date().toLocaleDateString(),
                status: 'error'
              };
              setFiles(prev => [errorFile, ...prev]);
            }}
            config={{ mode: 'auto' }}
            className="ut-uploading:cursor-wait ut-label:text-lg ut-label:font-medium ut-label:text-gray-900 ut-button:bg-blue-600 ut-button:px-6 ut-button:py-2 ut-button:hover:bg-blue-700"
          />
        </div>

        {filteredFiles.length > 0 ? (
          <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-600">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Route</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Uploaded</div>
              <div className="col-span-2">Status</div>
            </div>
            
            {filteredFiles.map((file, index) => (
              <div
                key={index}
                className="grid grid-cols-12 items-center px-6 py-4 text-sm text-gray-700 hover:bg-gray-50"
              >
                <div className="col-span-4 flex items-center">
                  <File className="mr-3 h-5 w-5 text-blue-600" />
                  {file.name}
                </div>
                <div className="col-span-2 truncate font-mono text-sm text-gray-500">
                  {file.route || 'N/A'}
                </div>
                <div className="col-span-2">{file.size}</div>
                <div className="col-span-2 flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-400" />
                  {file.uploadedAt}
                </div>
                <div className="col-span-2 flex items-center">
                  {file.status === 'success' && (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                  )}
                  {file.status === 'uploading' && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  )}
                  <span className="capitalize">{file.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center text-gray-500">
            {files.length === 0
              ? "No files uploaded yet. Upload some files to get started!"
              : "No files match your search query"}
          </div>
        )}
      </div>
    </main>
  );
}