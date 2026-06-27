/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

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
