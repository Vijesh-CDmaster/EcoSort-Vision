"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { identifyWasteType } from "@/ai/flows/waste-type-identification";
import { wasteBinClassification } from "@/ai/flows/waste-bin-classification";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Upload, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

type ScanResult = {
  wasteType: string;
  wasteTypeConfidence: number;
  binSuggestion: "recycling" | "compost" | "landfill";
  binConfidence: number;
};

const binInfo = {
  recycling: {
    icon: Icons.Recycling,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    label: "Recycling",
  },
  compost: {
    icon: Icons.Compost,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    label: "Compost",
  },
  landfill: {
    icon: Icons.Landfill,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    label: "Landfill",
  },
};

export function WasteScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const placeholderImage = useMemo(() => PlaceHolderImages.find(p => p.id === 'scanner-placeholder'), []);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload an image file.",
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleScan = async () => {
    if (!file || !previewUrl) return;

    setIsLoading(true);
    try {
      const [typeResult, binResult] = await Promise.all([
        identifyWasteType({ photoDataUri: previewUrl }),
        wasteBinClassification({ photoDataUri: previewUrl }),
      ]);
      setResult({
        wasteType: typeResult.wasteType,
        wasteTypeConfidence: typeResult.confidence,
        binSuggestion: binResult.binSuggestion,
        binConfidence: binResult.confidence,
      });
    } catch (error) {
      console.error("AI classification failed:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Could not classify the item. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const SuggestedBinCard = ({ bin }: { bin: "recycling" | "compost" | "landfill" }) => {
    const { icon: BinIcon, color, label } = binInfo[bin];
    return (
      <div className={cn("flex flex-col items-center justify-center p-6 rounded-lg", color)}>
        <BinIcon className="w-16 h-16" />
        <p className="mt-4 text-2xl font-bold">{label}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {!previewUrl ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="mt-4 font-semibold">
                  Drag & drop or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, or WEBP files accepted.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Waste item preview"
                  layout="fill"
                  objectFit="cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full h-8 w-8"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
            </div>
          )}

          <div className="space-y-4">
            {file && !result && !isLoading && (
              <Button onClick={handleScan} size="lg" className="w-full">
                <Sparkles className="mr-2 h-5 w-5" />
                Identify Item
              </Button>
            )}

            {isLoading && (
              <div className="flex items-center justify-center text-center p-8 space-y-4 rounded-lg bg-secondary">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="font-semibold ml-4">Analyzing item...</p>
              </div>
            )}
            
            {result && (
              <div className="space-y-4 animate-in fade-in-50">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested Bin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SuggestedBinCard bin={result.binSuggestion} />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Confidence: {(result.binConfidence * 100).toFixed(0)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Item Identified</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-semibold capitalize">{result.wasteType}</p>
                        <p className="text-sm text-muted-foreground">
                            Confidence: {(result.wasteTypeConfidence * 100).toFixed(0)}%
                        </p>
                    </CardContent>
                </Card>
                <Button onClick={handleClear} variant="outline" className="w-full">
                  Scan Another Item
                </Button>
              </div>
            )}

            {!file && !result && !isLoading && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    {placeholderImage && (
                        <Image
                          src={placeholderImage.imageUrl}
                          alt={placeholderImage.description}
                          data-ai-hint={placeholderImage.imageHint}
                          layout="fill"
                          objectFit="cover"
                          className="opacity-20"
                        />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">Image preview will appear here</p>
                    </div>
                </div>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  );
}
