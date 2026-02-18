'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, ThumbsUp, Pin, Send } from 'lucide-react';

interface Comment {
  id: string;
  user_id: string;
  question_id: number;
  comment_text: string;
  likes: number;
  is_pinned: boolean;
  created_at: string;
  user_profiles?: {
    username: string;
  };
}

interface QuestionCommentsProps {
  questionId: number;
  questionText: string;
}

export default function QuestionComments({ questionId, questionText }: QuestionCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
    getCurrentUser();
  }, [questionId]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadComments() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('question_comments')
      .select(`
        *,
        user_profiles!inner(display_name)
      `)
      .eq('question_id', questionId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Map display_name to username for compatibility
      const commentsWithUsername = data.map((comment: any) => ({
        ...comment,
        user_profiles: {
          username: comment.user_profiles?.display_name || 'Utente'
        }
      }));
      setComments(commentsWithUsername);
    }
    setIsLoading(false);
  }

  async function sendComment() {
    if (!newComment.trim() || !currentUserId) return;

    setIsSending(true);
    const { error } = await supabase
      .from('question_comments')
      .insert({
        user_id: currentUserId,
        question_id: questionId,
        comment_text: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
      loadComments();
    }
    setIsSending(false);
  }

  async function toggleLike(commentId: string, currentLikes: number) {
    const isLiked = likedComments.has(commentId);
    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;

    const { error } = await supabase
      .from('question_comments')
      .update({ likes: newLikes })
      .eq('id', commentId);

    if (!error) {
      setComments(prev =>
        prev.map(c => c.id === commentId ? { ...c, likes: newLikes } : c)
      );
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        return newSet;
      });
    }
  }

  async function togglePin(commentId: string, isPinned: boolean) {
    const { error } = await supabase
      .from('question_comments')
      .update({ is_pinned: !isPinned })
      .eq('id', commentId);

    if (!error) {
      loadComments();
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Discussione sulla domanda
        </h3>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {comments.length} {comments.length === 1 ? 'commento' : 'commenti'}
        </span>
      </div>

      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
          "{questionText}"
        </p>
      </div>

      {/* Input nuovo commento */}
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Condividi un dubbio o un suggerimento su questa domanda..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          disabled={isSending}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={sendComment}
            disabled={!newComment.trim() || isSending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Invio...' : 'Invia commento'}
          </button>
        </div>
      </div>

      {/* Lista commenti */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Caricamento commenti...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nessun commento ancora. Sii il primo ad iniziare la discussione!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border ${
                comment.is_pinned
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                  : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {comment.user_profiles?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {comment.user_profiles?.username || 'Utente'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                  {comment.is_pinned && (
                    <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
                  )}
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => togglePin(comment.id, comment.is_pinned)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title={comment.is_pinned ? 'Rimuovi in evidenza' : 'Metti in evidenza'}
                  >
                    <Pin
                      className={`w-4 h-4 ${
                        comment.is_pinned
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                  </button>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                {comment.comment_text}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLike(comment.id, comment.likes)}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    likedComments.has(comment.id)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`}
                  />
                  <span>{comment.likes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
