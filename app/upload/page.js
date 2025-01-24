"use client";
import { useState, useEffect } from 'react';
import { UploadButton } from '../../src/utils/uploadthing';
import { useMobileDetect } from '../../src/hooks/useMobileDetect';
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
  const isMobile = useMobileDetect();

  // File preview
  const openPreview = (file) => {
    window.open(file.route, '_blank'); // Always open in new tab
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
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header and Search - Mobile Optimized */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Files</h1>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                // ... existing upload handler ...
              }}
              appearance={{
                button: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-colors text-xs sm:text-sm max-w-[110px] truncate",
                allowedContent: "hidden",
              }}
            />
          </div>
        </div>

        {/* Bulk Actions and Filters - Mobile Stacked */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={selectedFiles.size === 0}
              className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
            >
              <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Delete ({selectedFiles.size})</span>
            </button>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 p-1.5 text-sm sm:p-2 sm:text-base"
            >
              <option value="all">All Types</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        {/* File List - Responsive Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {/* Table Headers - Hidden on Mobile */}
          <div className="hidden border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 sm:grid sm:grid-cols-12 sm:px-6 sm:py-3">
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
            <div className="col-span-2 hidden sm:block">Route</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* File Items - Responsive Grid */}
          {currentFiles.map((file) => (
            <div
              key={file.key}
              className="grid grid-cols-8 items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:grid-cols-12 sm:gap-0 sm:px-6 sm:py-4"
            >
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.key)}
                  onChange={() => toggleSelectFile(file.key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-6 flex items-center sm:col-span-4">
                <File className="mr-2 h-5 w-5 min-w-[20px] text-blue-600" />
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <div className="col-span-8 -order-1 sm:order-1 sm:col-span-2 sm:block">
                <div className="truncate font-mono text-xs text-gray-500 sm:text-sm">
                  {file.size}
                </div>
                <div className="flex items-center text-xs text-gray-500 sm:hidden">
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  {file.uploadedAt}
                </div>
              </div>
              <div className="hidden sm:col-span-2 sm:block sm:truncate sm:font-mono sm:text-sm sm:text-gray-500">
                {file.route?.split('/').pop() || 'N/A'}
              </div>
              <div className="hidden sm:col-span-2 sm:flex sm:items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                {file.uploadedAt}
              </div>
              <div className="col-span-1 flex justify-end gap-2 sm:col-span-2">
                <button
                  onClick={() => openPreview(file)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(file.key)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination - Mobile Friendly */}
        <div className="mt-4 flex flex-wrap justify-center gap-1">
          {Array.from({ length: Math.ceil(filteredFiles.length / filesPerPage) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`rounded px-2.5 py-1 text-sm ${currentPage === i + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* File Preview Modal - Mobile Optimized */}
        {/* <Modal
          isOpen={isPreviewOpen}
          onRequestClose={() => setIsPreviewOpen(false)}
          className="modal"
          overlayClassName="overlay"
          closeTimeoutMS={200}
        >
          {previewFile && (
            <div className="p-3 sm:p-4">
              <h2 className="text-lg font-bold sm:text-xl sm:mb-4">
                {previewFile.name}
              </h2>
              {previewFile.type === 'pdf' ? (
                <iframe
                  src={previewFile.route}
                  className="h-[70vh] w-full border-none"
                  title={previewFile.name}
                />
              ) : (
                <img
                  src={previewFile.route}
                  alt={previewFile.name}
                  className="mx-auto max-h-[70vh] max-w-full"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400';
                  }}
                />
              )}
            </div>
          )}
        </Modal> */}
      </div>
    </main>
  );

}