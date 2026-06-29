/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, auth } from './auth';
import { Comment } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Add a comment to a specific folder
 */
export const addComment = async (
  folderId: string, 
  folderName: string, 
  userId: string, 
  userName: string, 
  userEmail: string, 
  userPhoto: string | null, 
  text: string
): Promise<void> => {
  const path = 'comments';
  try {
    const commentsRef = collection(db, path);
    await addDoc(commentsRef, {
      folderId,
      folderName,
      userId,
      userName,
      userEmail,
      userPhoto,
      text,
      createdAt: serverTimestamp()
    });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
};

/**
 * Listen to real-time comments for a specific folder
 */
export const subscribeComments = (
  folderId: string, 
  onUpdate: (comments: Comment[]) => void,
  onError?: (errorMsg: string) => void
): () => void => {
  const path = 'comments';
  const commentsRef = collection(db, path);
  // Query only by folderId without orderBy to avoid composite index requirements
  const q = query(
    commentsRef, 
    where('folderId', '==', folderId)
  );

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        folderId: data.folderId,
        folderName: data.folderName,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhoto: data.userPhoto,
        text: data.text,
        createdAt: data.createdAt ? data.createdAt.toDate().getTime() : Date.now()
      });
    });
    
    // Sort client-side by createdAt ascending to ensure chronological order without index requirements
    comments.sort((a, b) => a.createdAt - b.createdAt);
    onUpdate(comments);
  }, (error) => {
    console.error('Error listening to comments:', error);
    if (onError) {
      // Extract clean error message for user UI
      onError(error.message || String(error));
    }
  });
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  const path = `comments/${commentId}`;
  try {
    const commentDocRef = doc(db, 'comments', commentId);
    await deleteDoc(commentDocRef);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};
