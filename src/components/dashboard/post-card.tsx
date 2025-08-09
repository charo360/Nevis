
"use client";

import * as React from 'react';
import Image from "next/image";
import { Facebook, Instagram, Linkedin, MoreVertical, Pen, RefreshCw, Twitter, CalendarIcon, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GeneratedPost } from "@/lib/types";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const platformIcons = {
  Facebook: <Facebook className="h-4 w-4" />,
  Instagram: <Instagram className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Twitter: <Twitter className="h-4 w-4" />,
};

type PostCardProps = {
  post: GeneratedPost;
  onPostUpdated: (post: GeneratedPost) => void;
};

export function PostCard({ post, onPostUpdated }: PostCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(post.content);
  const [editedHashtags, setEditedHashtags] = React.useState(post.hashtags);
  const formattedDate = format(new Date(post.date), 'MMM d, yyyy');
  const { toast } = useToast();

  const handleDownload = React.useCallback(async () => {
    try {
      const link = document.createElement('a');
      link.href = post.imageUrl;
      const mimeType = post.imageUrl.match(/data:(image\/[^;]+);/)?.[1];
      const fileExtension = mimeType ? mimeType.split('/')[1] : 'png';
      link.download = `localbuzz-image-${post.id}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the image. Please try again.",
      });
    }
  }, [post.id, post.imageUrl, toast]);

  const handleSaveChanges = () => {
    onPostUpdated({
        ...post,
        content: editedContent,
        hashtags: editedHashtags,
        status: 'edited',
    });
    setIsEditing(false);
    toast({
        title: "Post Updated",
        description: "Your changes have been saved.",
    });
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="flex-row items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {platformIcons[post.platform]}
            <span className="font-medium">{post.platform}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pen className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 p-4 pt-0">
          <div className="aspect-square w-full overflow-hidden rounded-md border">
            <Image
              alt="Generated post image"
              className="h-full w-full object-cover"
              height={1080}
              src={post.imageUrl}
              data-ai-hint="social media post"
              width={1080}
              crossOrigin="anonymous"
            />
          </div>
          <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2"><CalendarIcon className="w-4 h-4" />{formattedDate}</div>
              <p className="text-sm text-foreground line-clamp-4">{post.content}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex flex-wrap gap-1">
            {post.hashtags.split(" ").map((tag, index) => (
              <Badge key={index} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post content and hashtags below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="h-32"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={editedHashtags}
                onChange={(e) => setEditedHashtags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
