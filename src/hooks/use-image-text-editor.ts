'use client';

import { useState, useCallback } from 'react';

export interface TextEditingSession {
  id: string;
  originalImageUrl: string;
  editedImageUrl?: string;
  isActive: boolean;
  timestamp: number;
}

export function useImageTextEditor() {
  const [editingSessions, setEditingSessions] = useState<TextEditingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const startEditing = useCallback((imageUrl: string) => {
    const sessionId = Date.now().toString();
    const newSession: TextEditingSession = {
      id: sessionId,
      originalImageUrl: imageUrl,
      isActive: true,
      timestamp: Date.now(),
    };

    setEditingSessions(prev => [...prev, newSession]);
    setActiveSessionId(sessionId);
    
    return sessionId;
  }, []);

  const saveEditing = useCallback((sessionId: string, editedImageUrl: string) => {
    setEditingSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, editedImageUrl, isActive: false }
          : session
      )
    );
    setActiveSessionId(null);
    
    return editedImageUrl;
  }, []);

  const cancelEditing = useCallback((sessionId: string) => {
    setEditingSessions(prev =>
      prev.filter(session => session.id !== sessionId)
    );
    setActiveSessionId(null);
  }, []);

  const getActiveSession = useCallback(() => {
    if (!activeSessionId) return null;
    return editingSessions.find(session => session.id === activeSessionId) || null;
  }, [activeSessionId, editingSessions]);

  const getSessionHistory = useCallback(() => {
    return editingSessions.filter(session => !session.isActive);
  }, [editingSessions]);

  const clearHistory = useCallback(() => {
    setEditingSessions(prev => prev.filter(session => session.isActive));
  }, []);

  return {
    editingSessions,
    activeSessionId,
    startEditing,
    saveEditing,
    cancelEditing,
    getActiveSession,
    getSessionHistory,
    clearHistory,
  };
}
