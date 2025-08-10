"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Sparkles, Upload, X } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { BrandAnalysisResult, BrandProfile } from "@/lib/types";
import { analyzeBrandAction } from "@/app/actions";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Helper to convert hex to HSL string
const hexToHslString = (hex: string): string => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
};

// Helper to convert HSL string to hex
const hslStringToHex = (hslStr: string): string => {
    const [h, s, l] = hslStr.split(' ').map(val => parseFloat(val));
    const s_norm = s / 100;
    const l_norm = l / 100;
    let c = (1 - Math.abs(2 * l_norm - 1)) * s_norm,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l_norm - c / 2,
        r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
    else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
    else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
    else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
    else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
    else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const formSchema = z.object({
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  businessType: z.string().min(2, { message: "Business type must be at least 2 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }),
  logo: z.any().optional(),
  designs: z.any().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
});

type BrandSetupProps = {
  initialProfile: BrandProfile | null;
  onProfileSaved: (profile: BrandProfile) => void;
};

export function BrandSetup({ initialProfile, onProfileSaved }: BrandSetupProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<BrandAnalysisResult | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(initialProfile?.logoDataUrl || null);
  const [logoDataUrl, setLogoDataUrl] = React.useState<string>(initialProfile?.logoDataUrl || "");
  const [designPreviews, setDesignPreviews] = React.useState<string[]>([]);
  const [designDataUrls, setDesignDataUrls] = React.useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: initialProfile?.businessName || "",
      businessType: initialProfile?.businessType || "",
      location: initialProfile?.location || "",
      websiteUrl: "https://yourbusiness.com",
      primaryColor: initialProfile?.primaryColor ? hslStringToHex(initialProfile.primaryColor) : "#3399FF",
      accentColor: initialProfile?.accentColor ? hslStringToHex(initialProfile.accentColor) : "#33B2B2",
      backgroundColor: initialProfile?.backgroundColor ? hslStringToHex(initialProfile.backgroundColor) : "#F0F8FF",
    },
  });

  React.useEffect(() => {
    if (initialProfile) {
      form.reset({
        businessName: initialProfile.businessName,
        businessType: initialProfile.businessType,
        location: initialProfile.location,
        websiteUrl: "https://yourbusiness.com", // This field doesn't get saved, so we keep a default
        primaryColor: initialProfile.primaryColor ? hslStringToHex(initialProfile.primaryColor) : "#3399FF",
        accentColor: initialProfile.accentColor ? hslStringToHex(initialProfile.accentColor) : "#33B2B2",
        backgroundColor: initialProfile.backgroundColor ? hslStringToHex(initialProfile.backgroundColor) : "#F0F8FF",
      });
      setAnalysisResult({
        visualStyle: initialProfile.visualStyle,
        writingTone: initialProfile.writingTone,
        contentThemes: initialProfile.contentThemes,
      });
      setLogoPreview(initialProfile.logoDataUrl);
      setLogoDataUrl(initialProfile.logoDataUrl);
    }
  }, [initialProfile, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        setLogoDataUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDesignsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const dataUrlPromises = fileArray.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(dataUrlPromises).then(urls => {
        setDesignPreviews(urls);
        setDesignDataUrls(urls);
      });
    }
  };

  async function onAnalyze(values: z.infer<typeof formSchema>) {
    if (designDataUrls.length === 0) {
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Please upload at least one previous design example.",
        });
        return;
    }
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeBrandAction(values.websiteUrl, designDataUrls);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete!",
        description: "Brand analysis has been updated. Review and save the profile.",
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
    if (!analysisResult) {
        toast({
            variant: "destructive",
            title: "Cannot Save",
            description: "Please analyze your brand first."
        });
        return;
    }
     if (!logoDataUrl) {
        toast({
            variant: "destructive",
            title: "Missing Logo",
            description: "Please upload a logo to continue."
        });
        return;
    }

    const formValues = form.getValues();
    const profile: BrandProfile = {
      businessName: formValues.businessName,
      businessType: formValues.businessType,
      location: formValues.location,
      logoDataUrl,
      primaryColor: formValues.primaryColor ? hexToHslString(formValues.primaryColor) : undefined,
      accentColor: formValues.accentColor ? hexToHslString(formValues.accentColor) : undefined,
      backgroundColor: formValues.backgroundColor ? hexToHslString(formValues.backgroundColor) : undefined,
      ...analysisResult,
    };
    onProfileSaved(profile);
    toast({
      title: "Profile Saved!",
      description: "Your brand profile has been updated.",
    });
    
    // Force a reload to apply the new theme colors
    window.location.reload();

    if(!initialProfile) {
        router.push('/content-calendar');
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">{initialProfile ? "Manage Brand Profile" : "Welcome to LocalBuzz"}</h1>
        <p className="text-muted-foreground">
          {initialProfile ? "Update your brand details below." : "Let's set up your brand profile to generate perfectly tailored content."}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Brand Discovery</CardTitle>
          <CardDescription>
            Enter your business details, upload a logo, and provide your website and some design examples for AI-powered brand analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAnalyze)} className="space-y-6 pt-4">
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

               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField control={form.control} name="logo" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Business Logo</FormLabel>
                    <FormControl>
                        <div className="flex w-full items-center gap-4">
                        <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md border border-dashed">
                            {logoPreview ? (
                            <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" />
                            ) : (
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            )}
                        </div>
                        <Input 
                            type="file" 
                            accept="image/*" 
                            className="w-full"
                            onChange={(e) => {
                                field.onChange(e.target.files);
                                handleLogoChange(e);
                            }}
                        />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="designs" render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Designs (Upload a few examples)</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="w-full"
                      onChange={(e) => {
                        field.onChange(e.target.files);
                        handleDesignsChange(e);
                      }}
                    />
                  </FormControl>
                  {designPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                      {designPreviews.map((src, index) => (
                        <div key={index} className="relative aspect-square">
                          <Image src={src} alt={`Design preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
                           <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -right-2 -top-2 h-5 w-5 rounded-full"
                                onClick={() => {
                                    setDesignPreviews(prev => prev.filter((_, i) => i !== index));
                                    setDesignDataUrls(prev => prev.filter((_, i) => i !== index));
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
              
               <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField control={form.control} name="primaryColor" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                                <Input type="color" {...field} className="h-10 p-1"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="accentColor" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <FormControl>
                                <Input type="color" {...field} className="h-10 p-1"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="backgroundColor" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Background Color</FormLabel>
                            <FormControl>
                                <Input type="color" {...field} className="h-10 p-1"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

              <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourbusiness.com" {...field} />
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
                    {analysisResult ? "Re-analyze Brand" : "Analyze Brand"}
                  </>
                )}
              </Button>
            </form>
          </Form>

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
        
        <CardFooter>
            <Button onClick={handleSaveProfile} className="w-full md:w-auto" disabled={!analysisResult || !logoDataUrl}>
                {initialProfile ? "Save Changes" : "Save Brand Profile & Continue"}
            </Button>
        </CardFooter>
        
      </Card>
    </div>
  );
}
