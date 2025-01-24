"use client";
import { useState, useEffect } from 'react';
import { UploadButton } from "../../src/utils/uploadthing";
import { Search, File, Clock, CheckCircle, AlertCircle, Trash, Eye, Filter, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(10);
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'uploadedAt', direction: 'desc' });

  // File preview
  const openPreview = (file) => {
    console.log('Opening preview for file:', file); // Debugging
    if (typeof window !== 'undefined') {
      Modal.setAppElement('body'); // Use 'body' or another valid selector
    }
    setPreviewFile(file);
    setIsPreviewOpen(true);
    console.log('Preview file state:', previewFile); // Debugging
  };

  // Toggle file selection
  const toggleSelectFile = (fileKey) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileKey)) {
      newSelectedFiles.delete(fileKey);
    } else {
      newSelectedFiles.add(fileKey);
    }
    setSelectedFiles(newSelectedFiles);
  };

  // Handle individual file delete
  const handleDelete = async (fileKey) => {
    console.log('Deleting file:', fileKey); // Debugging
    const confirmed = window.confirm('Are you sure you want to delete this file?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKey }), // Send `fileKey` (singular) instead of `fileKeys`
      });

      console.log('Delete response:', response); // Debugging

      if (!response.ok) {
        const errorData = await response.json(); // Parse error response
        console.error('Delete failed with error:', errorData); // Debugging
        throw new Error('Delete failed');
      }

      setFiles((prev) => prev.filter((file) => file.key !== fileKey));
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };


  // Bulk delete
  const handleBulkDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete the selected files?');
    if (!confirmed || selectedFiles.size === 0) return;

    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKeys: Array.from(selectedFiles) }),
      });

      console.log('Bulk delete response:', response); // Debugging

      if (!response.ok) {
        const errorData = await response.json(); // Parse error response
        console.error('Bulk delete failed with error:', errorData); // Debugging
        throw new Error('Bulk delete failed');
      }

      setFiles((prev) => prev.filter((file) => !selectedFiles.has(file.key)));
      setSelectedFiles(new Set());
      toast.success(`${selectedFiles.size} files deleted successfully!`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete files');
    }
  };

  // Load files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await fetch('/api/files');
        if (!res.ok) throw new Error('Failed to fetch files');

        const files = await res.json();
        const formattedFiles = files.map((file) => ({
          key: file.key,
          name: file.name || file.key.split('/').pop(),
          size: `${(file.size / 1024).toFixed(2)} KB`,
          uploadedAt: new Date(file.uploadedAt).toLocaleDateString(),
          status: file.status.toLowerCase(),
          type: file.name.split('.').pop(),
          route: `https://${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}.ufs.sh/f/${file.key}`,
        }));

        setFiles(formattedFiles);
      } catch (error) {
        console.error('Error loading files:', error);
        toast.error('Failed to load files');
      }
    };
    loadFiles();
  }, []);

  // Filtered, sorted, and paginated files
  const filteredFiles = files
    .filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((file) => fileTypeFilter === 'all' || file.type === fileTypeFilter)
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header and Search */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <div className="flex items-center gap-4">
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
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                const newFiles = res.map((file) => ({
                  key: file.key,
                  name: file.name,
                  size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                  uploadedAt: new Date().toLocaleDateString(),
                  status: 'success',
                  type: file.name.split('.').pop(),
                  route: file.url,
                }));
                setFiles((prev) => [...newFiles, ...prev]);
                toast.success('File uploaded successfully!');
              }}
              onUploadError={(error) => {
                toast.error('File upload failed');
              }}
              appearance={{
                button: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors",
                allowedContent: "hidden",
              }}
            />
          </div>
        </div>

        {/* Bulk Actions and Filters */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBulkDelete}
              disabled={selectedFiles.size === 0}
              className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash className="h-4 w-4" />
              Delete Selected ({selectedFiles.size})
            </button>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 p-2"
            >
              <option value="all">All Types</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        {/* File List */}
        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-600">
            <div className="col-span-1"></div>
            <div className="col-span-4 flex items-center gap-2">
              <button
                onClick={() => setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                className="flex items-center gap-1"
              >
                Name
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </div>
            <div className="col-span-2">Route</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-2">Actions</div>
          </div>

          {currentFiles.map((file) => (
            <div
              key={file.key}
              className="grid grid-cols-12 items-center px-6 py-4 text-sm text-gray-700 hover:bg-gray-50"
            >
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.key)}
                  onChange={() => toggleSelectFile(file.key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-4 flex items-center">
                <File className="mr-3 h-5 w-5 text-blue-600" />
                {file.name}
              </div>
              <div className="col-span-2 truncate font-mono text-sm text-gray-500">
                {file.route || 'N/A'}
              </div>
              <div className="col-span-1">{file.size}</div>
              <div className="col-span-2 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                {file.uploadedAt}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('Eye button clicked for file:', file); // Debugging
                    openPreview(file);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    console.log('Trash button clicked for file:', file.key); // Debugging
                    handleDelete(file.key);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-center">
          {Array.from({ length: Math.ceil(filteredFiles.length / filesPerPage) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => {
                setCurrentPage(i + 1);
                console.log('Current page:', i + 1); // Debugging
              }}
              className={`mx-1 rounded px-3 py-1 ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* File Preview Modal */}
        <Modal
          isOpen={isPreviewOpen}
          onRequestClose={() => setIsPreviewOpen(false)}
          className="modal"
          overlayClassName="overlay"
        >
          {previewFile && (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">{previewFile.name}</h2>
              {previewFile.type === 'pdf' ? (
                <iframe
                  src={previewFile.route}
                  title={previewFile.name}
                  className="w-full h-[80vh]"
                />
              ) : (
                <img
                  src={previewFile.route}
                  alt={previewFile.name}
                  className="max-h-[80vh] max-w-full mx-auto"
                />
              )}
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
}