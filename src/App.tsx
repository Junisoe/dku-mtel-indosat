/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HardDrive, BookOpen, ExternalLink, Github, Layers, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DriveFiles from './components/DriveFiles';
import IntegrationGuide from './components/IntegrationGuide';

export default function App() {
  const [activeTab, setActiveTab] = useState<'viewer' | 'guide'>('viewer');

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased font-sans">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* BRAND */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">Drive Sync Viewer</h1>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mt-0.5 block">Google API Hub</span>
              </div>
            </div>

            {/* NAV TABS */}
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('viewer')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'viewer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                id="tab-drive-viewer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Live Drive Viewer</span>
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                id="tab-integration-guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Panduan Integrasi Vercel</span>
              </button>
            </nav>

            {/* EXTERNAL LINK QUICK ACTION */}
            <div className="hidden sm:flex items-center gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'viewer' ? (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Katalog Google Drive Anda</h2>
                <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                  Semua dokumen, gambar, folder, dan file yang baru saja Anda unggah ke Google Drive akan muncul secara otomatis di bawah ini melalui sinkronisasi Google API.
                </p>
              </div>

              <DriveFiles />
            </motion.div>
          ) : (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Panduan Integrasi GitHub & Vercel</h2>
                <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                  Langkah demi langkah mendeploy website ini secara mandiri ke Vercel bersumber dari repositori GitHub pribadi Anda dengan setup API Google Drive.
                </p>
              </div>

              <IntegrationGuide />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white py-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <p>© 2026 Drive Sync Viewer. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://developers.google.com/drive" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition-colors inline-flex items-center gap-1">
              Google Drive API <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-200">|</span>
            <a href="https://vercel.com" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition-colors inline-flex items-center gap-1">
              Vercel Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
