/**
 * Feedback Processor
 * Tracks and processes user edits to learn preferences
 * Part of Layer 5: Iteration & Learning Layer
 */

import { createClient } from '@supabase/supabase-js';

export interface UserEdit {
  id?: string;
  postId: string;
  clientId: string;
  originalContent: string;
  editedContent: string;
  editType: EditType;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type EditType = 
  | 'headline_change'
  | 'caption_change'
  | 'tone_adjustment'
  | 'length_change'
  | 'emoji_change'
  | 'cta_change'
  | 'hashtag_change'
  | 'complete_rewrite'
  | 'minor_tweak'
  | 'other';

export interface EditPattern {
  pattern: string;
  frequency: number;
  examples: string[];
  lastOccurred: Date;
}

export interface LearningInsights {
  clientId: string;
  totalEdits: number;
  editPatterns: EditPattern[];
  preferredTone: string;
  preferredLength: 'short' | 'medium' | 'long';
  emojiPreference: 'none' | 'minimal' | 'moderate' | 'heavy';
  commonRemovals: string[];
  commonAdditions: string[];
  lastUpdated: Date;
}

/**
 * Track a user edit
 */
export async function trackUserEdit(
  postId: string,
  clientId: string,
  originalContent: string,
  editedContent: string
): Promise<UserEdit> {
  console.log(`📝 [Learning] Tracking user edit for post ${postId}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Analyze the edit
  const editType = analyzeEditType(originalContent, editedContent);
  const metadata = analyzeEditDetails(originalContent, editedContent);

  const edit: UserEdit = {
    postId,
    clientId,
    originalContent,
    editedContent,
    editType,
    timestamp: new Date(),
    metadata,
  };

  // Save to database
  const { data, error } = await supabase
    .from('user_edits')
    .insert({
      post_id: edit.postId,
      client_id: edit.clientId,
      original_content: edit.originalContent,
      edited_content: edit.editedContent,
      edit_type: edit.editType,
      timestamp: edit.timestamp.toISOString(),
      metadata: edit.metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [Learning] Failed to track edit:', error);
    throw error;
  }

  console.log(`✅ [Learning] Edit tracked: ${editType}`);

  // Trigger pattern analysis in background
  analyzePatterns(clientId).catch(console.error);

  return { ...edit, id: data.id };
}

/**
 * Analyze what type of edit was made
 */
function analyzeEditType(original: string, edited: string): EditType {
  const originalLower = original.toLowerCase();
  const editedLower = edited.toLowerCase();

  // Check for complete rewrite (>70% different)
  const similarity = calculateSimilarity(originalLower, editedLower);
  if (similarity < 0.3) {
    return 'complete_rewrite';
  }

  // Check for minor tweak (<10% different)
  if (similarity > 0.9) {
    return 'minor_tweak';
  }

  // Check for specific changes
  const originalWords = originalLower.split(/\s+/);
  const editedWords = editedLower.split(/\s+/);

  // Length change
  const lengthDiff = Math.abs(editedWords.length - originalWords.length);
  if (lengthDiff > originalWords.length * 0.3) {
    return 'length_change';
  }

  // Emoji change
  const originalEmojis = (original.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const editedEmojis = (edited.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (Math.abs(editedEmojis - originalEmojis) >= 2) {
    return 'emoji_change';
  }

  // Hashtag change
  const originalHashtags = (original.match(/#\w+/g) || []).length;
  const editedHashtags = (edited.match(/#\w+/g) || []).length;
  if (Math.abs(editedHashtags - originalHashtags) >= 2) {
    return 'hashtag_change';
  }

  // CTA change (look for action words at the end)
  const ctaWords = ['now', 'today', 'click', 'shop', 'buy', 'get', 'try', 'start', 'join', 'learn'];
  const originalHasCTA = ctaWords.some(w => originalLower.includes(w));
  const editedHasCTA = ctaWords.some(w => editedLower.includes(w));
  if (originalHasCTA !== editedHasCTA) {
    return 'cta_change';
  }

  // Check first line (headline) change
  const originalFirstLine = original.split('\n')[0];
  const editedFirstLine = edited.split('\n')[0];
  if (calculateSimilarity(originalFirstLine, editedFirstLine) < 0.5) {
    return 'headline_change';
  }

  // Default to caption change
  return 'caption_change';
}

/**
 * Analyze edit details for learning
 */
function analyzeEditDetails(original: string, edited: string): Record<string, unknown> {
  const originalWords = original.split(/\s+/);
  const editedWords = edited.split(/\s+/);

  // Find removed words
  const removedWords = originalWords.filter(w => !editedWords.includes(w));
  
  // Find added words
  const addedWords = editedWords.filter(w => !originalWords.includes(w));

  // Analyze tone shift
  const originalTone = analyzeTone(original);
  const editedTone = analyzeTone(edited);

  return {
    lengthChange: editedWords.length - originalWords.length,
    removedWords: removedWords.slice(0, 10),
    addedWords: addedWords.slice(0, 10),
    originalTone,
    editedTone,
    toneShift: originalTone !== editedTone,
  };
}

/**
 * Simple tone analysis
 */
function analyzeTone(text: string): string {
  const lower = text.toLowerCase();

  const toneIndicators = {
    urgent: ['now', 'today', 'limited', 'hurry', 'last chance', 'don\'t miss'],
    casual: ['hey', 'awesome', 'cool', 'love', 'amazing', '!'],
    formal: ['please', 'kindly', 'we are pleased', 'we would like'],
    playful: ['fun', 'exciting', 'wow', 'yay', '😊', '🎉'],
    professional: ['ensure', 'provide', 'deliver', 'quality', 'excellence'],
  };

  let maxScore = 0;
  let detectedTone = 'neutral';

  for (const [tone, indicators] of Object.entries(toneIndicators)) {
    const score = indicators.filter(i => lower.includes(i)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedTone = tone;
    }
  }

  return detectedTone;
}

/**
 * Calculate text similarity (Jaccard-like)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Analyze patterns from user edits
 */
export async function analyzePatterns(clientId: string): Promise<LearningInsights> {
  console.log(`🔍 [Learning] Analyzing patterns for client ${clientId}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get recent edits
  const { data: edits } = await supabase
    .from('user_edits')
    .select('*')
    .eq('client_id', clientId)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (!edits || edits.length === 0) {
    return {
      clientId,
      totalEdits: 0,
      editPatterns: [],
      preferredTone: 'neutral',
      preferredLength: 'medium',
      emojiPreference: 'minimal',
      commonRemovals: [],
      commonAdditions: [],
      lastUpdated: new Date(),
    };
  }

  // Analyze edit types
  const editTypeCounts: Record<string, number> = {};
  const allRemovals: string[] = [];
  const allAdditions: string[] = [];
  const tones: string[] = [];
  const lengths: number[] = [];
  const emojiCounts: number[] = [];

  for (const edit of edits) {
    // Count edit types
    editTypeCounts[edit.edit_type] = (editTypeCounts[edit.edit_type] || 0) + 1;

    // Collect metadata
    if (edit.metadata) {
      if (edit.metadata.removedWords) {
        allRemovals.push(...(edit.metadata.removedWords as string[]));
      }
      if (edit.metadata.addedWords) {
        allAdditions.push(...(edit.metadata.addedWords as string[]));
      }
      if (edit.metadata.editedTone) {
        tones.push(edit.metadata.editedTone as string);
      }
    }

    // Analyze edited content
    const editedWords = (edit.edited_content as string).split(/\s+/).length;
    lengths.push(editedWords);

    const emojiCount = ((edit.edited_content as string).match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    emojiCounts.push(emojiCount);
  }

  // Build patterns
  const editPatterns: EditPattern[] = Object.entries(editTypeCounts)
    .map(([pattern, frequency]) => ({
      pattern,
      frequency,
      examples: edits
        .filter(e => e.edit_type === pattern)
        .slice(0, 3)
        .map(e => e.edited_content.substring(0, 100)),
      lastOccurred: new Date(edits.find(e => e.edit_type === pattern)?.timestamp || Date.now()),
    }))
    .sort((a, b) => b.frequency - a.frequency);

  // Determine preferences
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const preferredLength: LearningInsights['preferredLength'] = 
    avgLength < 30 ? 'short' : avgLength > 80 ? 'long' : 'medium';

  const avgEmojis = emojiCounts.reduce((a, b) => a + b, 0) / emojiCounts.length;
  const emojiPreference: LearningInsights['emojiPreference'] =
    avgEmojis === 0 ? 'none' : avgEmojis < 2 ? 'minimal' : avgEmojis < 5 ? 'moderate' : 'heavy';

  // Most common tone
  const toneCounts: Record<string, number> = {};
  tones.forEach(t => { toneCounts[t] = (toneCounts[t] || 0) + 1; });
  const preferredTone = Object.entries(toneCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // Most common removals/additions
  const removalCounts: Record<string, number> = {};
  allRemovals.forEach(w => { removalCounts[w] = (removalCounts[w] || 0) + 1; });
  const commonRemovals = Object.entries(removalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  const additionCounts: Record<string, number> = {};
  allAdditions.forEach(w => { additionCounts[w] = (additionCounts[w] || 0) + 1; });
  const commonAdditions = Object.entries(additionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  const insights: LearningInsights = {
    clientId,
    totalEdits: edits.length,
    editPatterns,
    preferredTone,
    preferredLength,
    emojiPreference,
    commonRemovals,
    commonAdditions,
    lastUpdated: new Date(),
  };

  // Save insights to performance_insights table
  await supabase.from('performance_insights').upsert({
    client_id: clientId,
    learning_insights: insights,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'client_id',
  });

  console.log(`✅ [Learning] Pattern analysis complete: ${editPatterns.length} patterns found`);
  return insights;
}

/**
 * Get learning insights for a client
 */
export async function getLearningInsights(clientId: string): Promise<LearningInsights | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('performance_insights')
    .select('learning_insights')
    .eq('client_id', clientId)
    .single();

  if (!data?.learning_insights) return null;

  return data.learning_insights as LearningInsights;
}

/**
 * Format learning insights for AI assistant
 */
export function formatLearningInsightsForAssistant(insights: LearningInsights): string {
  if (insights.totalEdits === 0) {
    return 'No user edit history available yet.';
  }

  return `
🧠 USER PREFERENCES (learned from ${insights.totalEdits} edits):

📝 CONTENT PREFERENCES:
• Preferred tone: ${insights.preferredTone}
• Preferred length: ${insights.preferredLength}
• Emoji usage: ${insights.emojiPreference}

🚫 WORDS TO AVOID (user often removes):
${insights.commonRemovals.slice(0, 5).map(w => `• "${w}"`).join('\n') || '• None identified'}

✅ WORDS TO INCLUDE (user often adds):
${insights.commonAdditions.slice(0, 5).map(w => `• "${w}"`).join('\n') || '• None identified'}

📊 COMMON EDIT PATTERNS:
${insights.editPatterns.slice(0, 3).map(p => `• ${p.pattern}: ${p.frequency} times`).join('\n')}

Apply these preferences to generate content the user is more likely to approve.
`;
}

export default {
  trackUserEdit,
  analyzePatterns,
  getLearningInsights,
  formatLearningInsightsForAssistant,
};
