"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { BrandAnalysisResult, BrandProfile } from "@/lib/types";
import { analyzeBrandAction } from "@/app/actions";

const formSchema = z.object({
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  businessType: z.string().min(2, { message: "Business type must be at least 2 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  socialMediaUrl: z.string().url({ message: "Please enter a valid URL." }),
});

type BrandSetupProps = {
  onProfileSaved: (profile: BrandProfile) => void;
};

export function BrandSetup({ onProfileSaved }: BrandSetupProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<BrandAnalysisResult | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      businessType: "",
      location: "",
      socialMediaUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeBrandAction(values.socialMediaUrl);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete!",
        description: "We've analyzed the brand profile. Review the details below.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSaveProfile = () => {
    if (analysisResult) {
      const profile: BrandProfile = {
        ...form.getValues(),
        ...analysisResult,
      };
      onProfileSaved(profile);
      toast({
        title: "Profile Saved!",
        description: "You can now start generating content.",
      });
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Welcome to LocalBuzz</h1>
        <p className="text-muted-foreground">
          Let's set up your brand profile to generate perfectly tailored content.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Brand Discovery</CardTitle>
          <CardDescription>
            Enter your business details and a social media link for AI-powered brand analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="social">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="website" disabled>Website (Coming Soon)</TabsTrigger>
              <TabsTrigger value="manual" disabled>Manual (Coming Soon)</TabsTrigger>
            </TabsList>
            <TabsContent value="social">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="businessName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., The Corner Cafe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="businessType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Restaurant, Salon, Plumber" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="socialMediaUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram or Facebook URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/yourbusiness" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Brand
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          {analysisResult && (
            <div className="mt-6 space-y-4 rounded-lg border bg-muted/20 p-4">
                <h3 className="font-semibold text-lg">Analysis Results</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label className="text-sm font-medium">Visual Style</Label>
                        <Textarea readOnly value={analysisResult.visualStyle} className="mt-1 h-24 bg-white" />
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Writing Tone</Label>
                        <Textarea readOnly value={analysisResult.writingTone} className="mt-1 h-24 bg-white" />
                    </div>
                </div>
                <div>
                    <Label className="text-sm font-medium">Content Themes</Label>
                    <Textarea readOnly value={analysisResult.contentThemes} className="mt-1 h-24 bg-white" />
                </div>
            </div>
          )}
        </CardContent>
        {analysisResult && (
            <CardFooter>
                <Button onClick={handleSaveProfile} className="w-full md:w-auto">Save Brand Profile & Continue</Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
