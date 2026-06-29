/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, Image, Video, FileSpreadsheet, FileArchive, Folder, File, FileCode,
  Search, RefreshCw, LogOut, ArrowUpRight, Download, Calendar, HardDrive, 
  Layers, User as UserIcon, AlertCircle, CheckCircle2, ChevronRight, X, Eye,
  LayoutGrid, List, ChevronLeft, FolderDown
} from 'lucide-react';
import JSZip from 'jszip';
import { User } from 'firebase/auth';
import { DriveFile } from '../types';
import { googleSignIn, logout, subscribeAuth } from '../lib/auth';
import { CommentsSection } from './CommentsSection';

// Help helper for size formatting
export function formatBytes(bytesStr?: string): string {
  if (!bytesStr) return '0 Bytes';
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes)) return '-';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Convert mime types to human readable category
export function getMimeTypeDetails(mimeType: string) {
  if (mimeType.includes('folder')) {
    return { label: 'Folder', icon: Folder, color: 'text-amber-500 bg-amber-50 border-amber-200' };
  }
  if (mimeType.includes('pdf')) {
    return { label: 'PDF Document', icon: FileText, color: 'text-rose-500 bg-rose-50 border-rose-200' };
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return { label: 'Word Document', icon: FileText, color: 'text-blue-500 bg-blue-50 border-blue-200' };
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('sheet')) {
    return { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' };
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return { label: 'Presentation', icon: FileText, color: 'text-orange-500 bg-orange-50 border-orange-200' };
  }
  if (mimeType.includes('image')) {
    return { label: 'Gambar', icon: Image, color: 'text-purple-500 bg-purple-50 border-purple-200' };
  }
  if (mimeType.includes('video')) {
    return { label: 'Video', icon: Video, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' };
  }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gzip')) {
    return { label: 'Arsip (ZIP)', icon: FileArchive, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) {
    return { label: 'Source Code', icon: FileCode, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' };
  }
  return { label: 'File Lainnya', icon: File, color: 'text-slate-500 bg-slate-50 border-slate-200' };
}

export default function DriveFiles() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Display mode: 'public' (fetch from backend proxy without login) or 'personal' (fetch user's own drive via OAuth)
  const [displayMode, setDisplayMode] = useState<'public' | 'personal'>('public');
  const [isMockData, setIsMockData] = useState(false);
  
  // View mode for personal drive: 'shared-folder' (from the link provided) or 'entire-drive'
  const [viewMode, setViewMode] = useState<'shared-folder' | 'entire-drive'>('shared-folder');

  // Active folder navigation path stack
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>(() => {
    try {
      const saved = localStorage.getItem('drive_folder_path');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading folderPath from localStorage:', e);
    }
    return [{ id: '1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_', name: 'Beranda' }];
  });
  
  // Drive State
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'folders' | 'documents' | 'spreadsheets' | 'images' | 'pdfs'>('all');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [previewingFile, setPreviewingFile] = useState<DriveFile | null>(null);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');
  const isCancelledRef = useRef(false);
  const isFirstRender = useRef(true);

  // Subscribe to auth state updates
  useEffect(() => {
    const unsubscribe = subscribeAuth((currUser, currToken) => {
      setUser(currUser);
      setAccessToken(currToken);
      setIsLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  // Persist folderPath to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('drive_folder_path', JSON.stringify(folderPath));
    } catch (e) {
      console.error('Error saving folderPath to localStorage:', e);
    }
  }, [folderPath]);

  // Reset folder path when switching tabs/modes, but ignore initial render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (displayMode === 'public') {
      setFolderPath([{ id: '1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_', name: 'Beranda' }]);
    } else {
      if (viewMode === 'shared-folder') {
        setFolderPath([{ id: '1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_', name: 'Beranda' }]);
      } else {
        setFolderPath([{ id: 'root', name: 'Drive Saya' }]);
      }
    }
    setSelectedFile(null);
  }, [displayMode, viewMode]);

  // Navigate deeper into a subfolder
  const handleNavigateIntoFolder = (folder: DriveFile) => {
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
  };

  // Fetch public files from our server-side API proxy without requiring login
  const fetchPublicFiles = useCallback(async (folderId: string) => {
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/public-files?folderId=${encodeURIComponent(folderId)}`);
      if (!response.ok) {
        throw new Error('Gagal menghubungi server untuk memuat file publik.');
      }
      const data = await response.json();
      setFiles(data.files || []);
      setIsMockData(!!data.isMock);
    } catch (err: any) {
      console.error('Fetch Public Files error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data folder bersama.');
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // Fetch files from Google Drive API (For personal OAuth mode)
  const fetchDriveFiles = useCallback(async (folderId: string, tokenToUse?: string) => {
    const token = tokenToUse || accessToken;
    if (!token) return;

    setIsLoadingFiles(true);
    setErrorMsg(null);
    setIsMockData(false);

    try {
      const fields = 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, iconLink, webViewLink, webContentLink, owners(displayName, photoLink, emailAddress))';
      
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append('fields', fields);
      url.searchParams.append('orderBy', 'name asc');
      url.searchParams.append('pageSize', '60');
      
      // Filter dynamically based on active folderId
      const query = `'${folderId}' in parents and trashed = false`;
      url.searchParams.append('q', query);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token akses kedaluwarsa. Silakan masuk kembali.');
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || 'Gagal memuat file dari Google Drive.');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Fetch Drive Files error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [accessToken]);

  // Handle data loading based on active displayMode and active folder path
  useEffect(() => {
    const currentFolderId = folderPath[folderPath.length - 1]?.id;
    if (!currentFolderId) return;

    if (displayMode === 'public') {
      fetchPublicFiles(currentFolderId);
    } else {
      if (accessToken) {
        fetchDriveFiles(currentFolderId, accessToken);
      } else {
        setFiles([]);
      }
    }
  }, [displayMode, accessToken, folderPath, fetchPublicFiles, fetchDriveFiles]);

  const handleSignIn = async () => {
    try {
      setErrorMsg(null);
      const res = await googleSignIn();
      if (res?.accessToken) {
        const currentFolderId = folderPath[folderPath.length - 1]?.id || '1W_9Ab_i_hBWwisY3XMqsGYLNb6nWY1o_';
        fetchDriveFiles(currentFolderId, res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setErrorMsg(err.message || 'Gagal masuk menggunakan Google.');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Sign out failed:', err);
    }
  };

  // Filter logic
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === 'folders') {
      return file.mimeType.includes('folder');
    }
    if (activeCategory === 'documents') {
      return file.mimeType.includes('document') || file.mimeType.includes('word') || file.mimeType.includes('text');
    }
    if (activeCategory === 'spreadsheets') {
      return file.mimeType.includes('spreadsheet') || file.mimeType.includes('excel') || file.mimeType.includes('sheet');
    }
    if (activeCategory === 'images') {
      return file.mimeType.includes('image');
    }
    if (activeCategory === 'pdfs') {
      return file.mimeType.includes('pdf');
    }
    return true;
  });

  // Navigate to previous file in preview
  const handlePrevFile = useCallback(() => {
    if (filteredFiles.length <= 1 || !previewingFile) return;
    const currentIndex = filteredFiles.findIndex(f => f.id === previewingFile.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = filteredFiles.length - 1;
    }
    const nextFile = filteredFiles[prevIndex];
    setPreviewingFile(nextFile);
    setSelectedFile(nextFile);
  }, [filteredFiles, previewingFile]);

  // Navigate to next file in preview
  const handleNextFile = useCallback(() => {
    if (filteredFiles.length <= 1 || !previewingFile) return;
    const currentIndex = filteredFiles.findIndex(f => f.id === previewingFile.id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= filteredFiles.length) {
      nextIndex = 0;
    }
    const nextFile = filteredFiles[nextIndex];
    setPreviewingFile(nextFile);
    setSelectedFile(nextFile);
  }, [filteredFiles, previewingFile]);

  // Download all files in the current folder (including nested subfolders) as a single ZIP
  const downloadFolderAsZip = useCallback(async () => {
    if (filteredFiles.length === 0) {
      alert('Tidak ada item di folder ini yang dapat diunduh.');
      return;
    }

    setIsZipping(true);
    setZipProgress('Menyiapkan struktur unduhan...');
    isCancelledRef.current = false;

    try {
      const zip = new JSZip();
      let totalFilesProcessed = 0;

      // Recursive function to fetch and add files to the ZIP
      const processFolder = async (folderId: string, currentPath: string) => {
        if (isCancelledRef.current) {
          throw new Error('UNDUHAN_DIBATALKAN');
        }
        let folderFiles: DriveFile[] = [];
        
        try {
          // Check if this is the initial folder, we can reuse filteredFiles to save an API request
          const currentFolderId = folderPath[folderPath.length - 1]?.id || 'root';
          if (folderId === currentFolderId) {
            folderFiles = filteredFiles;
          } else {
            const res = await fetch(`/api/public-files?folderId=${folderId}`);
            if (!res.ok) throw new Error(`Gagal memuat isi folder: ${res.statusText}`);
            const data = await res.json();
            folderFiles = data.files || [];
          }
        } catch (err: any) {
          if (isCancelledRef.current) {
            throw new Error('UNDUHAN_DIBATALKAN');
          }
          console.error(`Gagal mengambil data untuk folderId ${folderId}:`, err);
          return;
        }

        for (const file of folderFiles) {
          if (isCancelledRef.current) {
            throw new Error('UNDUHAN_DIBATALKAN');
          }
          const relativeFilePath = currentPath ? `${currentPath}/${file.name}` : file.name;

          if (file.mimeType.includes('folder')) {
            // It's a folder, traverse recursively
            await processFolder(file.id, relativeFilePath);
          } else {
            // It's a file, download and add to ZIP
            totalFilesProcessed++;
            setZipProgress(`Mengunduh (${totalFilesProcessed}): ${relativeFilePath}`);
            try {
              const res = await fetch(`/api/download-file?fileId=${file.id}`);
              if (!res.ok) throw new Error(`Status ${res.status}`);
              const blob = await res.blob();
              
              if (isCancelledRef.current) {
                throw new Error('UNDUHAN_DIBATALKAN');
              }
              zip.file(relativeFilePath, blob);
            } catch (fetchErr: any) {
              if (fetchErr.message === 'UNDUHAN_DIBATALKAN') {
                throw fetchErr;
              }
              console.error(`Gagal mengunduh file ${relativeFilePath}:`, fetchErr);
              // Continue processing other files
            }
          }
        }
      };

      const currentFolderId = folderPath[folderPath.length - 1]?.id || 'root';
      await processFolder(currentFolderId, '');

      if (isCancelledRef.current) {
        throw new Error('UNDUHAN_DIBATALKAN');
      }

      if (totalFilesProcessed === 0) {
        alert('Tidak ada file yang ditemukan di dalam folder ini atau subfoldernya.');
        setIsZipping(false);
        setZipProgress('');
        return;
      }

      setZipProgress(`Mengompresi ${totalFilesProcessed} file menjadi satu file .zip...`);
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      if (isCancelledRef.current) {
        throw new Error('UNDUHAN_DIBATALKAN');
      }

      // Get current folder name for the zip filename
      const currentFolderName = folderPath[folderPath.length - 1]?.name || 'Beranda';
      const cleanFileName = `${currentFolderName.replace(/[^a-z0-9]/gi, '_')}_Archive.zip`;

      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL object
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
    } catch (err: any) {
      if (err.message === 'UNDUHAN_DIBATALKAN') {
        console.log('Error zipping files recursively: cancelled');
        return;
      }
      console.error('Error zipping files recursively:', err);
      alert(`Gagal mengunduh folder sebagai ZIP: ${err.message || err}`);
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  }, [filteredFiles, folderPath]);

  // Keyboard arrow keys navigation for preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewingFile) return;
      if (e.key === 'ArrowRight') {
        handleNextFile();
      } else if (e.key === 'ArrowLeft') {
        handlePrevFile();
      } else if (e.key === 'Escape') {
        setPreviewingFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewingFile, handleNextFile, handlePrevFile]);

  // Calculate statistics
  const totalFilesCount = files.length;
  const foldersCount = files.filter(f => f.mimeType.includes('folder')).length;
  const docsCount = files.filter(f => f.mimeType.includes('document') || f.mimeType.includes('pdf') || f.mimeType.includes('text')).length;
  const mediaCount = files.filter(f => f.mimeType.includes('image') || f.mimeType.includes('video')).length;
  
  const totalSizeBytes = files.reduce((acc, file) => {
    if (file.size) {
      const sizeVal = parseInt(file.size, 10);
      return isNaN(sizeVal) ? acc : acc + sizeVal;
    }
    return acc;
  }, 0);

  return (
    <div className="w-full space-y-6">
      {/* MOCK DATA WARNING BANNER */}
      {isMockData && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-center sm:text-left">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Sistem dalam Mode Simulasi Offline</p>
              <p className="text-xs text-amber-600 leading-normal">
                Folder publik Anda terdeteksi, namun server belum memiliki kunci API Google Drive. Hubungkan Google Cloud API Key di Vercel atau file <code>.env</code> Anda untuk mengaktifkan sinkronisasi real-time instan!
              </p>
            </div>
          </div>
          <div className="text-xs bg-amber-100 text-amber-850 px-3 py-1.5 rounded-lg font-mono">
            GOOGLE_DRIVE_API_KEY
          </div>
        </div>
      )}

          {/* STORAGE STATS BLOCK */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Total File Terbaca</p>
                <p className="text-xl font-bold text-slate-800">{totalFilesCount}</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Folder</p>
                <p className="text-xl font-bold text-slate-800">{foldersCount}</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Gambar & Media</p>
                <p className="text-xl font-bold text-slate-800">{mediaCount}</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Kapasitas file terhitung</p>
                <p className="text-xl font-bold text-slate-800">{formatBytes(totalSizeBytes.toString())}</p>
              </div>
            </div>
          </div>

          {/* SEARCH AND CAT TABS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari file..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl shadow-2xs transition-colors outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setActiveCategory('folders')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === 'folders' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Folder
                </button>
                <button
                  onClick={() => setActiveCategory('documents')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === 'documents' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Dokumen
                </button>
                <button
                  onClick={() => setActiveCategory('spreadsheets')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === 'spreadsheets' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Sheet
                </button>
                <button
                  onClick={() => setActiveCategory('images')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === 'images' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Gambar
                </button>
                <button
                  onClick={() => setActiveCategory('pdfs')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeCategory === 'pdfs' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  PDF
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-3xs">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === 'grid' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                  title="Tampilan Galeri / Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewLayout('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === 'list' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                  title="Tampilan Tabel / Daftar"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <button 
                onClick={downloadFolderAsZip}
                disabled={isZipping || isLoadingFiles}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-3xs hover:shadow-2xs active:scale-97 cursor-pointer disabled:opacity-50"
                title="Unduh seluruh file dalam folder ini sekaligus sebagai file .zip"
              >
                <FolderDown className={`w-3.5 h-3.5 ${isZipping ? 'animate-pulse' : ''}`} />
                <span>Unduh Semua (.zip)</span>
              </button>

              <button 
                onClick={() => {
                  const currentFolderId = folderPath[folderPath.length - 1]?.id;
                  if (currentFolderId) fetchPublicFiles(currentFolderId);
                }}
                disabled={isLoadingFiles}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 bg-white border border-slate-200 hover:border-emerald-250 rounded-xl transition-all shadow-3xs cursor-pointer disabled:opacity-50"
                title="Segarkan Folder"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {/* BREADCRUMBS PATH NAVIGATOR */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto whitespace-nowrap">
            <span className="text-slate-400 font-bold px-1 select-none">Folder:</span>
            {folderPath.map((folder, index) => {
              const isLast = index === folderPath.length - 1;
              return (
                <div key={folder.id} className="flex items-center gap-2">
                  {index > 0 && <span className="text-slate-300 font-normal">/</span>}
                  <button
                    onClick={() => {
                      if (!isLast) {
                        setFolderPath(folderPath.slice(0, index + 1));
                        setSelectedFile(null);
                      }
                    }}
                    className={`transition-colors py-0.5 rounded-md ${
                      isLast 
                        ? 'text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-100 px-2' 
                        : 'cursor-pointer hover:text-slate-900 hover:bg-slate-200/60 px-1.5'
                    }`}
                  >
                    {folder.name}
                  </button>
                </div>
              );
            })}
          </div>

          {/* MAIN PANELS: LIST + SIDEBAR */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* FILE LIST TABLE */}
            <div className="flex-1 w-full bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
              {isLoadingFiles ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-500">Menghubungi Google Drive API...</p>
                </div>
              ) : errorMsg ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">Gagal Memuat File</p>
                  <p className="text-xs text-rose-600 max-w-md mx-auto mb-4">{errorMsg}</p>
                  <button
                    onClick={() => {
                      const currentFolderId = folderPath[folderPath.length - 1]?.id;
                      if (currentFolderId) {
                        if (displayMode === 'public') {
                          fetchPublicFiles(currentFolderId);
                        } else {
                          fetchDriveFiles(currentFolderId);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <File className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Tidak ada file ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery ? 'Coba bersihkan filter pencarian Anda.' : 'Unggah file atau folder ke Google Drive Anda untuk melihatnya di sini secara otomatis.'}
                  </p>
                </div>
              ) : viewLayout === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-medium">
                        <th className="py-3 px-4">Nama File / Folder</th>
                        <th className="py-3 px-4 hidden md:table-cell">Jenis</th>
                        <th className="py-3 px-4 text-right">Ukuran</th>
                        <th className="py-3 px-4 hidden sm:table-cell text-right">Dimodifikasi</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredFiles.map((file) => {
                        const mDetails = getMimeTypeDetails(file.mimeType);
                        const FileIcon = mDetails.icon;
                        const isSelected = selectedFile?.id === file.id;

                        return (
                          <tr 
                            key={file.id} 
                            onClick={() => setSelectedFile(file)}
                            onDoubleClick={() => {
                              if (file.mimeType.includes('folder')) {
                                handleNavigateIntoFolder(file);
                              } else {
                                setPreviewingFile(file);
                              }
                            }}
                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/30' : ''}`}
                            title={file.mimeType.includes('folder') ? "Klik dua kali untuk membuka folder" : "Klik dua kali untuk pratinjau langsung"}
                          >
                            <td className="py-3.5 px-4 font-medium text-slate-950">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${mDetails.color}`}>
                                  <FileIcon className="w-4 h-4" />
                                </div>
                                <div className="max-w-[180px] sm:max-w-xs md:max-w-md truncate">
                                  <p className="truncate font-semibold text-slate-800" title={file.name}>{file.name}</p>
                                  {file.owners && file.owners[0] && (
                                    <p className="text-xs text-slate-400 truncate hidden sm:block">Pemilik: {file.owners[0].displayName}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 hidden md:table-cell text-slate-500 text-xs">
                              {mDetails.label}
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-xs">
                              {file.mimeType.includes('folder') ? '-' : formatBytes(file.size)}
                            </td>
                            <td className="py-3.5 px-4 hidden sm:table-cell text-right text-slate-500 text-xs font-mono">
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {file.mimeType.includes('folder') ? (
                                  <button 
                                    onClick={() => handleNavigateIntoFolder(file)}
                                    className="p-1.5 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                                    title="Buka & Jelajahi Folder"
                                  >
                                    <Folder className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => setPreviewingFile(file)}
                                    className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                                    title="Pratinjau Langsung"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {file.webContentLink && (
                                  <a 
                                    href={file.webContentLink} 
                                    target="_blank" 
                                    referrerPolicy="no-referrer"
                                    rel="noreferrer"
                                    className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
                                    title="Unduh File"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {filteredFiles.map((file) => {
                    const mDetails = getMimeTypeDetails(file.mimeType);
                    const FileIcon = mDetails.icon;
                    const isSelected = selectedFile?.id === file.id;
                    const thumbnailSrc = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, '=s400') : undefined;

                    return (
                      <div 
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        onDoubleClick={() => {
                          if (file.mimeType.includes('folder')) {
                            handleNavigateIntoFolder(file);
                          } else {
                            setPreviewingFile(file);
                          }
                        }}
                        className={`group relative flex flex-col bg-white border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-xs ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/10 shadow-emerald-500/10' : 'border-slate-100 hover:border-slate-200'}`}
                        title={file.mimeType.includes('folder') ? "Klik dua kali untuk membuka folder" : "Klik dua kali untuk pratinjau langsung"}
                      >
                        {/* Thumbnail / icon area */}
                        <div className="aspect-video w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
                          {thumbnailSrc ? (
                            <img 
                              src={thumbnailSrc} 
                              alt={file.name} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${mDetails.color}`}>
                              <FileIcon className="w-6 h-6" />
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {file.mimeType.includes('folder') ? (
                              <button 
                                onClick={() => handleNavigateIntoFolder(file)}
                                className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-sm transform translate-y-1 group-hover:translate-y-0 duration-200 cursor-pointer"
                                title="Buka Folder"
                              >
                                <Folder className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => setPreviewingFile(file)}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm transform translate-y-1 group-hover:translate-y-0 duration-200 cursor-pointer"
                                title="Pratinjau Langsung"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {file.webContentLink && (
                              <a 
                                href={file.webContentLink} 
                                target="_blank" 
                                rel="noreferrer"
                                referrerPolicy="no-referrer"
                                className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-sm transform translate-y-1 group-hover:translate-y-0 duration-200 cursor-pointer"
                                title="Unduh"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-white/95 text-slate-600 border border-slate-100 shadow-4xs backdrop-blur-xs">
                            {mDetails.label}
                          </span>
                        </div>

                        {/* Text Info */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight break-all" title={file.name}>
                              {file.name}
                            </p>
                            {file.owners && file.owners[0] && (
                              <p className="text-[10px] text-slate-400 truncate">
                                Pemilik: {file.owners[0].displayName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 font-medium font-mono">
                            <span>{file.mimeType.includes('folder') ? '-' : formatBytes(file.size)}</span>
                            <span>
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short'
                              }) : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SIDE DETAIL PANEL */}
            {selectedFile && (
              <div className="w-full lg:w-80 bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detail File</span>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center py-4 bg-white border border-slate-100 rounded-xl shadow-2xs">
                  {selectedFile.thumbnailLink ? (
                    <img 
                      src={selectedFile.thumbnailLink} 
                      alt={selectedFile.name} 
                      className="max-h-24 object-contain rounded-md border border-slate-100 shadow-xs mb-3"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 mb-3">
                      {React.createElement(getMimeTypeDetails(selectedFile.mimeType).icon, { className: "w-8 h-8" })}
                    </div>
                  )}
                  <h3 className="text-sm font-bold text-slate-800 px-4 text-center break-all line-clamp-2 leading-snug">
                    {selectedFile.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 mt-2 bg-slate-100 text-slate-600 font-medium rounded-full">
                    {getMimeTypeDetails(selectedFile.mimeType).label}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> ID File</span>
                    <span className="font-mono text-slate-600 truncate max-w-[120px]" title={selectedFile.id}>{selectedFile.id}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Ukuran</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {selectedFile.mimeType.includes('folder') ? '-' : formatBytes(selectedFile.size)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dibuat</span>
                    <span className="text-slate-700">
                      {selectedFile.createdTime ? new Date(selectedFile.createdTime).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dimodifikasi</span>
                    <span className="text-slate-700">
                      {selectedFile.modifiedTime ? new Date(selectedFile.modifiedTime).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </span>
                  </div>

                  {selectedFile.owners && selectedFile.owners[0] && (
                    <div className="py-1.5 space-y-1">
                      <span className="text-slate-400 flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> Pemilik</span>
                      <div className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg">
                        {selectedFile.owners[0].photoLink ? (
                          <img 
                            referrerPolicy="no-referrer"
                            src={selectedFile.owners[0].photoLink} 
                            alt={selectedFile.owners[0].displayName} 
                            className="w-5 h-5 rounded-full" 
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {selectedFile.owners[0].displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-medium text-slate-700 truncate">{selectedFile.owners[0].displayName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{selectedFile.owners[0].emailAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {selectedFile.mimeType.includes('folder') ? (
                    <button 
                      onClick={() => handleNavigateIntoFolder(selectedFile)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer animate-pulse"
                    >
                      <Folder className="w-4 h-4" />
                      Buka & Jelajahi Folder
                    </button>
                  ) : (
                    <button 
                      onClick={() => setPreviewingFile(selectedFile)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      Pratinjau Langsung
                    </button>
                  )}

                  {selectedFile.webContentLink && (
                    <div className="flex gap-2 w-full pt-2">
                      <a 
                        href={selectedFile.webContentLink} 
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                        title="Unduh File"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh File</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* REAL-TIME DISCUSSION BOARD FOR THE CURRENT FOLDER */}
          <CommentsSection 
            folderId={folderPath[folderPath.length - 1]?.id || 'root'}
            folderName={folderPath[folderPath.length - 1]?.name || 'Beranda'}
            user={user}
            onSignIn={handleSignIn}
          />

      {/* INLINE PREVIEW MODAL */}
      {previewingFile && (() => {
        const activePreviewIndex = filteredFiles.findIndex(f => f.id === previewingFile.id);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate mr-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getMimeTypeDetails(previewingFile.mimeType).color}`}>
                    {React.createElement(getMimeTypeDetails(previewingFile.mimeType).icon, { className: "w-4 h-4" })}
                  </div>
                  <div className="truncate text-left">
                    <h3 className="font-bold text-slate-800 text-sm truncate" title={previewingFile.name}>
                      {previewingFile.name}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      ID: {previewingFile.id} • {previewingFile.mimeType.includes('folder') ? 'Folder' : formatBytes(previewingFile.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                  {filteredFiles.length > 1 && activePreviewIndex !== -1 && (
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                      {activePreviewIndex + 1} / {filteredFiles.length}
                    </span>
                  )}
                  <button 
                    onClick={() => setPreviewingFile(null)}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Frame Viewer */}
              <div className="flex-1 bg-slate-100 relative group/viewer">
                {previewingFile.mimeType.includes('folder') ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-200 shadow-sm">
                      <Folder className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Pratinjau Folder Bersama</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Folder tidak dapat ditampilkan sebagai dokumen tunggal. Gunakan navigasi daftar file utama di situs ini untuk menjelajahi seluruh isinya secara langsung.
                      </p>
                    </div>
                    <button 
                      onClick={() => setPreviewingFile(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Tutup Pratinjau
                    </button>
                  </div>
                ) : (
                  <>
                    <iframe
                      src={`https://drive.google.com/file/d/${previewingFile.id}/preview`}
                      className="w-full h-full border-0 bg-white"
                      allow="autoplay"
                      referrerPolicy="no-referrer"
                      title={previewingFile.name}
                    />

                    {/* Navigation Buttons */}
                    {filteredFiles.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevFile();
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full shadow-lg border border-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                          title="File Sebelumnya (Tombol Kiri)"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextFile();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full shadow-lg border border-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                          title="File Selanjutnya (Tombol Kanan)"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* COMPRESSION ZIP PROGRESS MODAL */}
      {isZipping && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 flex flex-col items-center text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm mb-4 animate-bounce">
              <FolderDown className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Mengunduh Folder...</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
              File sedang diunduh dan dikompresi menjadi satu file .zip secara langsung di browser Anda.
            </p>
            
            {/* Progress status */}
            <div className="mt-5 w-full bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
              <p className="text-[11px] font-medium text-slate-600 text-left font-mono truncate flex-1" title={zipProgress}>
                {zipProgress}
              </p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => {
                isCancelledRef.current = true;
                setIsZipping(false);
                setZipProgress('');
              }}
              className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs rounded-xl transition-all border border-slate-200/60 hover:border-rose-100 cursor-pointer shadow-3xs hover:shadow-2xs active:scale-97"
            >
              Batalkan Unduhan
            </button>
            
            <p className="text-[10px] text-slate-400 mt-4 italic">
              Mohon jangan tutup halaman ini selama proses berjalan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
