"use client";

import { useState } from 'react';

export function TwitterPostForm() {
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePost = async () => {
    setIsPosting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/social/twitter/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post');
      }

      setSuccess(true);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's happening?"
        maxLength={280}
        className="w-full border rounded p-2"
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{text.length}/280</span>
        <button onClick={handlePost} disabled={isPosting || !text.trim()} className="px-4 py-2 bg-blue-600 text-white rounded">
          {isPosting ? 'Posting...' : 'Post to Twitter'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">Posted successfully!</p>}
    </div>
  );
}
