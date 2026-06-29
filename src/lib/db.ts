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
import { db } from './auth';
import { Comment } from '../types';

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
  const commentsRef = collection(db, 'comments');
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
};

/**
 * Listen to real-time comments for a specific folder
 */
export const subscribeComments = (
  folderId: string, 
  onUpdate: (comments: Comment[]) => void
): () => void => {
  const commentsRef = collection(db, 'comments');
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
  });
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  const commentDocRef = doc(db, 'comments', commentId);
  await deleteDoc(commentDocRef);
};
