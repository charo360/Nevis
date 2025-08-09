"use client";

import Image from "next/image";
import { Facebook, Instagram, Linkedin, MoreVertical, Pen, RefreshCw, Twitter, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GeneratedPost } from "@/lib/types";
import { format } from 'date-fns';


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
