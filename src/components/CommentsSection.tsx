/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Trash2, Clock, Sparkles, User as UserIcon, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';
import { Comment } from '../types';
import { addComment, subscribeComments, deleteComment } from '../lib/db';

interface CommentsSectionProps {
  folderId: string;
  folderName: string;
  user: User | null;
  onSignIn: () => Promise<any>;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  folderId,
  folderName,
  user,
  onSignIn
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time comments whenever folderId changes
  useEffect(() => {
    setIsLoadingComments(true);
    const unsubscribe = subscribeComments(folderId, (updatedComments) => {
      setComments(updatedComments);
      setIsLoadingComments(false);
    });
    return unsubscribe;
  }, [folderId]);

  // Scroll to bottom of comments when comments update or change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Silakan masuk log dengan Google terlebih dahulu untuk ikut berdiskusi.');
      return;
    }

    const trimmedText = newCommentText.trim();
    if (!trimmedText) return;

    setIsSubmitting(true);
    try {
      await addComment(
        folderId,
        folderName,
        user.uid,
        user.displayName || 'Pengguna Anonim',
        user.email || '',
        user.photoURL,
        trimmedText
      );
      setNewCommentText('');
    } catch (err: any) {
      console.error('Error sending comment:', err);
      alert(`Gagal mengirim komentar: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) {
      return;
    }
    try {
      await deleteComment(commentId);
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      alert(`Gagal menghapus komentar: ${err.message || err}`);
    }
  };

  // Helper for rendering human-friendly timestamps
  const formatCommentTime = (timestampMs: number) => {
    const date = new Date(timestampMs);
    const now = new Date();
    
    // Check if same calendar day
    const isToday = date.toDateString() === now.toDateString();
    
    // Check if yesterday
    const tempYesterday = new Date();
    tempYesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === tempYesterday.toDateString();
    
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Hari ini pukul ${timeStr}`;
    } else if (isYesterday) {
      return `Kemarin pukul ${timeStr}`;
    } else {
      return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} pukul ${timeStr}`;
    }
  };

  return (
    <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col mt-6">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 shadow-4xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Ruang Diskusi & Komentar</h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Folder: <span className="text-emerald-700 font-semibold">{folderName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100/40 text-[10px] font-semibold">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>Real-time</span>
        </div>
      </div>

      {/* Comments List Feed */}
      <div className="p-6 max-h-[360px] overflow-y-auto bg-slate-50/30 flex-1 space-y-4">
        {isLoadingComments ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Clock className="w-6 h-6 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Memuat komentar...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-150 text-slate-400 flex items-center justify-center shadow-3xs mb-3.5">
              <MessageSquare className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Belum ada diskusi</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Belum ada komentar di dalam folder ini. Tulis pertanyaan, instruksi, atau koordinasi pertama Anda di bawah ini!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isOwnComment = user && comment.userId === user.uid;
              return (
                <div 
                  key={comment.id} 
                  className={`flex items-start gap-3.5 group animate-in fade-in slide-in-from-bottom-2 duration-250`}
                >
                  {/* User Photo */}
                  {comment.userPhoto ? (
                    <img 
                      referrerPolicy="no-referrer"
                      src={comment.userPhoto} 
                      alt={comment.userName} 
                      className="w-8 h-8 rounded-full border border-slate-200/80 shadow-3xs flex-shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Comment Bubble Content */}
                  <div className="flex-1 min-w-0 bg-white border border-slate-100/90 rounded-2xl p-3.5 shadow-4xs group-hover:shadow-3xs transition-shadow relative">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate" title={comment.userName}>
                          {comment.userName}
                        </span>
                        {isOwnComment && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-slate-100 border border-slate-200 text-slate-500 rounded-md font-bold uppercase tracking-wider">
                            Anda
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium font-mono whitespace-nowrap">
                        {formatCommentTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                      {comment.text}
                    </p>

                    {/* Delete Action Trigger (only visible to owner on hover or mobile) */}
                    {isOwnComment && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all cursor-pointer"
                        title="Hapus komentar Anda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>

      {/* Input Form / Auth Prompt Footer */}
      <div className="p-4 border-t border-slate-100 bg-white">
        {user ? (
          <form onSubmit={handleSubmit} className="flex gap-2.5 items-end">
            <div className="flex-1 relative">
              <textarea
                value={newCommentText}
                onChange={(e) => {
                  if (e.target.value.length <= 400) {
                    setNewCommentText(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Tulis pesan atau koordinasi pekerjaan di sini..."
                rows={1}
                maxLength={400}
                className="w-full pl-4 pr-12 py-2.5 text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl resize-none outline-none transition-colors max-h-24 font-medium"
              />
              <span className="absolute right-3 bottom-2 text-[9px] text-slate-400 font-mono">
                {newCommentText.length}/400
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-3xs hover:shadow-2xs active:scale-95 disabled:opacity-45 disabled:scale-100 cursor-pointer flex items-center justify-center flex-shrink-0"
              title="Kirim Komentar"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="p-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 border border-slate-200/50">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-slate-700">Masuk Log untuk Ikut Berdiskusi</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Anda dapat melihat jalannya diskusi, tetapi harus masuk log menggunakan akun Google terlebih dahulu untuk mengirim komentar di sini.
                </p>
              </div>
            </div>
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-3xs hover:shadow-2xs active:scale-97 cursor-pointer transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk dengan Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
