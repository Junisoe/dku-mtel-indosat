/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Github, Chrome, ShieldCheck, Database, Sliders, Code, CheckCircle, 
  ChevronRight, ArrowRight, ExternalLink, Copy, Check, FileCode, Server
} from 'lucide-react';

export default function IntegrationGuide() {
  const [activeTab, setActiveTab] = useState<'intro' | 'github' | 'gcp' | 'firebase' | 'vercel' | 'code'>('intro');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Simple copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Interactive Checklist State to engage users
  const [completedSteps, setCompletedSteps] = useState({
    repoCreated: false,
    gcpProjectCreated: false,
    oauthConsentConfigured: false,
    gcpCredentialsCreated: false,
    firebaseProjectCreated: false,
    googleAuthProviderEnabled: false,
    vercelImported: false,
    envVarsConfigured: false,
  });

  const toggleStep = (stepKey: keyof typeof completedSteps) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  // Code snippets
  const authCodeExample = `// src/lib/auth.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "API_KEY_ANDA",
  authDomain: "DOMAIN_AUTH_ANDA.firebaseapp.com",
  projectId: "ID_PROJECT_ANDA",
  storageBucket: "BUCKET_ANDA.appspot.com",
  messagingSenderId: "SENDER_ID_ANDA",
  appId: "APP_ID_ANDA"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Meminta hak akses baca Google Drive
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

export const googleSignIn = async () => {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return {
    user: result.user,
    accessToken: credential?.accessToken
  };
};`;

  const fetchCodeExample = `// src/components/DriveFiles.tsx
const fetchDriveFiles = async (accessToken: string) => {
  const fields = 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink)';
  const url = 'https://www.googleapis.com/drive/v3/files?orderBy=modifiedTime desc&q=trashed = false&fields=' + encodeURIComponent(fields);
  
  const response = await fetch(url, {
    headers: {
      Authorization: \`Bearer \${accessToken}\`,
    },
  });
  
  const data = await response.json();
  return data.files; // List file Google Drive terbaru
};`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* SIDEBAR TABS */}
      <div className="lg:col-span-1 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3 mb-2">Langkah Panduan</span>
        
        <button
          onClick={() => setActiveTab('intro')}
          className={`w-full flex items-center justify-between p-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'intro' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4" />
            <span>Pendahuluan</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`w-full flex items-center justify-between p-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'github' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <Github className="w-4 h-4" />
            <span>1. Repositori GitHub</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>

        <button
          onClick={() => setActiveTab('gcp')}
          className={`w-full flex items-center justify-between p-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'gcp' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <Chrome className="w-4 h-4" />
            <span>2. Google Cloud Console</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`w-full flex items-center justify-between p-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'firebase' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4" />
            <span>3. Firebase Setup</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>

        <button
          onClick={() => setActiveTab('vercel')}
          className={`w-full flex items-center justify-between p-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'vercel' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4" />
            <span>4. Deploy ke Vercel</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`w-full flex items-center justify-between p-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'code' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <Code className="w-4 h-4" />
            <span>5. Referensi Kode Utama</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>

        {/* PROGRESS CHECKBOX SUMMARY */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-6 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progres Integrasi</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Langkah Selesai:</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {Object.values(completedSteps).filter(Boolean).length} / {Object.keys(completedSteps).length}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300" 
              style={{ width: `${(Object.values(completedSteps).filter(Boolean).length / Object.keys(completedSteps).length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="lg:col-span-3 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6">
        
        {/* INTRO TAB */}
        {activeTab === 'intro' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 mb-2">Integrasi Otomatis Google Drive ke Website Anda</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Panduan ini disusun khusus untuk membantu Anda mendeploy proyek web ini ke **Vercel** yang terhubung langsung ke **GitHub**, menggunakan **Google Drive API** secara aman dan andal melalui **Firebase Authentication** untuk mengelola kredensial OAuth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Mengapa Firebase + Google API?</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Firebase bertindak sebagai perantara aman untuk OAuth 2.0. Ini menghindarkan Anda dari harus menyimpan Client Secret Google langsung di frontend Anda yang rentan diretas, serta mengelola perpanjangan token akses secara otomatis.
                </p>
              </div>

              <div className="p-4 border border-slate-100 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Koneksi Otomatis</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dengan mengintegrasikan API Google Drive, setiap kali user mengunggah file baru ke drive mereka, daftar file tersebut akan langsung tersinkronisasi dan tampil di web app secara real-time saat halaman dimuat.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0 mt-0.5">i</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Penting:</strong> Untuk mempraktikkan panduan ini, klik tab langkah demi langkah di menu kiri. Anda dapat menandai langkah-langkah yang telah selesai pada setiap bagian untuk melacak progres konfigurasi Anda sendiri!
              </p>
            </div>

            <button 
              onClick={() => setActiveTab('github')}
              className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Mulai Konfigurasi
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* GITHUB TAB */}
        {activeTab === 'github' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 mb-2">Langkah 1: Membuat & Menghubungkan Repositori GitHub</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Langkah pertama adalah menyimpan source code aplikasi ini ke repositori GitHub pribadi Anda, agar nantinya dapat diimpor langsung oleh Vercel.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.repoCreated} 
                  onChange={() => toggleStep('repoCreated')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">1. Buat Repositori Baru di GitHub</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Buka <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold inline-flex items-center gap-0.5 hover:underline">GitHub New Repository <ExternalLink className="w-3 h-3" /></a>, beri nama repositori Anda (misalnya <code>google-drive-sync</code>), dan pilih Visibilitas (Public atau Private). Jangan tambahkan README atau .gitignore karena proyek ini sudah menyediakannya.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Perintah Git untuk Push Kode ke GitHub:</h5>
                <div className="relative font-mono text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto">
                  <button 
                    onClick={() => handleCopy(`git init\ngit add .\ngit commit -m "Initial commit"\ngit branch -M main\ngit remote add origin https://github.com/USER_ANDA/google-drive-sync.git\ngit push -u origin main`, 'git-push')}
                    className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-all text-slate-300 cursor-pointer"
                  >
                    {copiedText === 'git-push' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>{`git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USER_ANDA/REPO_NAME.git
git push -u origin main`}</pre>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setActiveTab('intro')} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Kembali</button>
              <button 
                onClick={() => setActiveTab('gcp')}
                className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* GCP TAB */}
        {activeTab === 'gcp' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 mb-2">Langkah 2: Konfigurasi Google Cloud Console</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Anda perlu membuat proyek di Google Cloud Console untuk mendaftarkan kredensial OAuth 2.0 yang memperbolehkan aplikasi mengakses Google Drive API.
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.gcpProjectCreated} 
                  onChange={() => toggleStep('gcpProjectCreated')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">1. Buat Proyek Baru & Aktifkan Google Drive API</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Buka <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold inline-flex items-center gap-0.5 hover:underline">Google Cloud Console <ExternalLink className="w-3 h-3" /></a>, buat proyek baru. Di bilah pencarian atas, cari <strong>Google Drive API</strong>, lalu klik tombol **Enable** (Aktifkan).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.oauthConsentConfigured} 
                  onChange={() => toggleStep('oauthConsentConfigured')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">2. Konfigurasi OAuth Consent Screen</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Masuk ke menu <strong>APIs & Services &gt; OAuth Consent Screen</strong>. Pilih User Type <strong>External</strong>, isi informasi aplikasi dasar (Nama, email dukungan). Pada tahap Scopes, tambahkan scope: <code>.../auth/drive.readonly</code>. Di bagian **Test Users**, masukkan email Google Anda agar Anda dapat masuk saat tahap testing.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.gcpCredentialsCreated} 
                  onChange={() => toggleStep('gcpCredentialsCreated')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">3. Buat OAuth 2.0 Client Credentials</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Masuk ke menu <strong>APIs & Services &gt; Credentials</strong>. Klik **Create Credentials** &gt; **OAuth Client ID**. Pilih Application Type: <strong>Web Application</strong>.
                    <br />
                    - Tambahkan Authorized JavaScript Origins: <code>http://localhost:3000</code> dan URL domain Vercel Anda nantinya.
                    <br />
                    - Tambahkan Authorized Redirect URIs: <code>https://PROJECT_ID.firebaseapp.com/__/auth/handler</code> (Dapatkan ID project ini setelah membuat Firebase project di langkah berikutnya).
                    <br />
                    Setelah disimpan, Anda akan mendapatkan <strong>Client ID</strong> dan <strong>Client Secret</strong>. Catat keduanya secara aman.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setActiveTab('github')} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Kembali</button>
              <button 
                onClick={() => setActiveTab('firebase')}
                className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* FIREBASE TAB */}
        {activeTab === 'firebase' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 mb-2">Langkah 3: Konfigurasi Firebase Authentication</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Firebase Authentication menyederhanakan alur login OAuth 2.0 Google. Kita perlu mendaftarkan kredensial Google yang didapatkan dari GCP ke Firebase.
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.firebaseProjectCreated} 
                  onChange={() => toggleStep('firebaseProjectCreated')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">1. Buat Proyek Firebase Baru</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold inline-flex items-center gap-0.5 hover:underline">Firebase Console <ExternalLink className="w-3 h-3" /></a>, buat proyek baru (Anda bisa menghubungkannya dengan proyek Google Cloud yang Anda buat di Langkah 2).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.googleAuthProviderEnabled} 
                  onChange={() => toggleStep('googleAuthProviderEnabled')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">2. Aktifkan Sign-In Method "Google" di Firebase</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Masuk ke menu **Build &gt; Authentication &gt; Sign-in method**. Klik **Add new provider** dan pilih **Google**.
                    <br />
                    - Klik toggle **Enable**.
                    <br />
                    - Klik tanda segitiga **Web SDK configuration** di bagian bawah.
                    <br />
                    - Masukkan **Client ID** dan **Client Secret** yang Anda dapatkan dari Google Cloud Console di Langkah 2.
                    <br />
                    - Simpan perubahan.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Sinkronisasi Sukses!</strong> Sekarang Redirect URI OAuth di Google Cloud Console akan terhubung sempurna. Salin Redirect URI yang tercantum di halaman setelan Google provider Firebase tersebut ke dalam setelan Authorized Redirect URIs di Google Cloud Console.
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setActiveTab('gcp')} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Kembali</button>
              <button 
                onClick={() => setActiveTab('vercel')}
                className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* VERCEL TAB */}
        {activeTab === 'vercel' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 mb-2">Langkah 4: Deploy ke Vercel</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ini adalah langkah terakhir untuk mendeploy website Anda ke internet secara gratis menggunakan Vercel.
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.vercelImported} 
                  onChange={() => toggleStep('vercelImported')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">1. Hubungkan GitHub & Impor Repositori</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Buka <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold inline-flex items-center gap-0.5 hover:underline">Vercel Dashboard <ExternalLink className="w-3 h-3" /></a>, masuk menggunakan akun GitHub Anda. Cari repositori <code>google-drive-sync</code> yang telah Anda buat di Langkah 1, lalu klik **Import**.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <input 
                  type="checkbox" 
                  checked={completedSteps.envVarsConfigured} 
                  onChange={() => toggleStep('envVarsConfigured')} 
                  className="w-4.5 h-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">2. Konfigurasi Environment Variables</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Sebelum mengklik **Deploy**, luaskan bagian <strong>Environment Variables</strong> di konfigurasi Vercel, lalu tambahkan variabel berikut yang bersumber dari config Firebase Anda:
                  </p>
                  
                  {/* Table of variables */}
                  <div className="overflow-x-auto mt-2 border border-slate-100 rounded-lg">
                    <table className="w-full text-left text-[11px] font-mono divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-500 font-sans font-bold">
                        <tr>
                          <th className="p-2">Nama Variabel</th>
                          <th className="p-2">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">VITE_FIREBASE_API_KEY</td>
                          <td className="p-2">API Key dari Firebase project Anda</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">VITE_FIREBASE_AUTH_DOMAIN</td>
                          <td className="p-2">Auth Domain (misal: project-id.firebaseapp.com)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">VITE_FIREBASE_PROJECT_ID</td>
                          <td className="p-2">ID Project Firebase Anda</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">VITE_FIREBASE_STORAGE_BUCKET</td>
                          <td className="p-2">Storage Bucket (project-id.appspot.com)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">VITE_FIREBASE_APP_ID</td>
                          <td className="p-2">App ID dari pengaturan Firebase web app Anda</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-slate-600">3. Selesaikan Deployment</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Klik tombol **Deploy**. Vercel akan mengompilasi kode React Anda menjadi file statis dalam beberapa detik. Setelah proses selesai, website Anda akan tayang dengan alamat domain gratis dari Vercel!
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setActiveTab('firebase')} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Kembali</button>
              <button 
                onClick={() => setActiveTab('code')}
                className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CODE REFERENCE TAB */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 mb-2">Referensi Struktur Kode Utama</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Berikut adalah struktur dasar kode autentikasi dan penarikan data dari API Google Drive yang diimplementasikan dalam aplikasi ini.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  Inisialisasi Firebase & OAuth Provider
                </span>
                <div className="relative font-mono text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto max-h-72">
                  <button 
                    onClick={() => handleCopy(authCodeExample, 'code-auth')}
                    className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-all text-slate-300 cursor-pointer"
                  >
                    {copiedText === 'code-auth' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>{authCodeExample}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  Mengambil List File dari Google Drive API
                </span>
                <div className="relative font-mono text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto max-h-72">
                  <button 
                    onClick={() => handleCopy(fetchCodeExample, 'code-fetch')}
                    className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition-all text-slate-300 cursor-pointer"
                  >
                    {copiedText === 'code-fetch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>{fetchCodeExample}</pre>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setActiveTab('vercel')} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Kembali</button>
              <button 
                onClick={() => setActiveTab('intro')}
                className="inline-flex items-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Kembali ke Pendahuluan
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
