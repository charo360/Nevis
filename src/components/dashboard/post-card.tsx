
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GeneratedPost } from "@/lib/types";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const platformIcons = {
  Facebook: <Facebook className="h-4 w-4" />,
  Instagram: <Instagram className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Twitter: <Twitter className="h-4 w-4" />,
};

type PostCardProps = {
  post: GeneratedPost;
};

export function PostCard({ post }: PostCardProps) {
  const formattedDate = format(new Date(post.date), 'MMM d, yyyy');
  const { toast } = useToast();

  const handleDownload = React.useCallback(async () => {
    try {
      const response = await fetch(post.imageUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Extracting file extension from imageUrl or defaulting to .png
      const fileExtension = post.imageUrl.split('.').pop() || 'png';
      link.download = `localbuzz-image-${post.id}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the image.",
      });
    }
  }, [post.id, post.imageUrl, toast]);


  return (
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
            <DropdownMenuItem>
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
  );
}
