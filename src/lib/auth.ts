/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Prioritize the correct JSON config, fallback to environment variables if missing
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigJson.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigJson.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigJson.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigJson.messagingSenderId || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigJson.appId || metaEnv.VITE_FIREBASE_APP_ID,
  measurementId: firebaseConfigJson.measurementId || metaEnv.VITE_FIREBASE_MEASUREMENT_ID,
};

// Safe debug log to show which API key is actually running in the browser
if (firebaseConfig.apiKey) {
  const len = firebaseConfig.apiKey.length;
  console.log(
    `[Firebase Init] Menggunakan API Key: ${firebaseConfig.apiKey.substring(0, 8)}...${firebaseConfig.apiKey.substring(len - 4)}`
  );
} else {
  console.error('[Firebase Init] API Key tidak ditemukan!');
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use GoogleAuthProvider and set requested scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Subscriptions for auth change listeners
type AuthCallback = (user: User | null, token: string | null) => void;
const listeners: Set<AuthCallback> = new Set();

export const subscribeAuth = (callback: AuthCallback) => {
  listeners.add(callback);
  // Trigger immediately with current state
  callback(auth.currentUser, cachedAccessToken);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = (user: User | null, token: string | null) => {
  listeners.forEach((callback) => callback(user, token));
};

// Listen to Firebase auth state changes
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    cachedAccessToken = null;
    notifyListeners(null, null);
  } else {
    // If we have a user but no token cached (e.g., initial reload),
    // we need to ask user to sign-in again to acquire the token in-memory.
    // This is because Firebase Auth doesn't persist the Google OAuth Access Token
    // across page reloads. This is expected and secure.
    if (!cachedAccessToken && !isSigningIn) {
      notifyListeners(user, null);
    } else {
      notifyListeners(user, cachedAccessToken);
    }
  }
});

/**
 * Sign in with Google using Popup flow to acquire user identity and Drive read scope
 */
export const googleSignIn = async () => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google.');
    }
    cachedAccessToken = credential.accessToken;
    notifyListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out of the application
 */
export const logout = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    notifyListeners(null, null);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get the current cached access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};
