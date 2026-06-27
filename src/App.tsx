/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import DriveFiles from './components/DriveFiles';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased font-sans">
      {/* MAIN CONTENT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-6"
        >
          <DriveFiles />
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <p>© 2026 Drive Sync Viewer. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://developers.google.com/drive" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition-colors inline-flex items-center gap-1">
              Google Drive API <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
