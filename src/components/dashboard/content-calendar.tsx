"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { generateContentAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { BrandProfile, GeneratedPost } from "@/lib/types";

type ContentCalendarProps = {
  brandProfile: BrandProfile;
  posts: GeneratedPost[];
  onPostGenerated: (post: GeneratedPost) => void;
  onPostUpdated: (post: GeneratedPost) => void;
};

export function ContentCalendar({ brandProfile, posts, onPostGenerated, onPostUpdated }: ContentCalendarProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { toast } = useToast();

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    try {
      const newPost = await generateContentAction(brandProfile);
      onPostGenerated(newPost);
      toast({
        title: "Content Generated!",
        description: "A new post has been added to your calendar.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Content Calendar</h1>
          <p className="text-muted-foreground">
            Here's your generated content. Click a post to edit or regenerate.
          </p>
        </div>
        <Button onClick={handleGenerateClick} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "✨ Generate Today's Post"
          )}
        </Button>
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onPostUpdated={onPostUpdated} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
          <h3 className="text-xl font-semibold">Your calendar is empty</h3>
          <p className="text-muted-foreground mt-2">
            Click the "Generate" button to create your first social media post!
          </p>
        </div>
      )}
    </div>
  );
}
