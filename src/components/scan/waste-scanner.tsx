"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { identifyWasteType } from "@/ai/flows/waste-type-identification";
import { wasteBinClassification } from "@/ai/flows/waste-bin-classification";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Upload, X, Loader2, Sparkles, Camera, Video, FlipHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCamera } from "@/hooks/use-camera";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type ScanResult = {
  wasteType: string;
  wasteTypeConfidence: number;
  binSuggestion: "recycling" | "compost" | "landfill";
  binConfidence: number;
  imageUrl: string;
  detections?: Array<{ label: string; confidence: number }>;
};

function guessBinFromLabel(label: string): "recycling" | "compost" | "landfill" {
  const l = label.toLowerCase();
  if (
    l.includes("paper") ||
    l.includes("cardboard") ||
    l.includes("plastic") ||
    l.includes("metal") ||
    l.includes("glass") ||
    l.includes("can") ||
    l.includes("bottle")
  ) {
    return "recycling";
  }
  if (l.includes("food") || l.includes("organic") || l.includes("compost") || l.includes("fruit") || l.includes("vegetable")) {
    return "compost";
  }
  return "landfill";
}

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [genkitEnabled, setGenkitEnabled] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  
  const {
    videoRef,
    canvasRef,
    isCameraOn,
    hasCameraPermission,
    toggleCamera,
    captureFrame,
    flipCamera,
  } = useCamera();

  const placeholderImage = useMemo(() => PlaceHolderImages.find(p => p.id === 'scanner-placeholder'), []);

  useEffect(() => {
    // Check whether Genkit is configured on the server (API key present).
    fetch("/api/genkit/enabled")
      .then(r => (r.ok ? r.json() : null))
      .then(d => setGenkitEnabled(Boolean(d?.enabled)))
      .catch(() => setGenkitEnabled(false));
  }, []);

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
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleScan = async (imageUrl: string | null) => {
    if (!imageUrl) return;

    setIsLoading(true);
    setResult(null);
    try {
      // Prefer the local YOLO model if available, fallback to Genkit AI.
      let newResult: ScanResult | null = null;
      let yoloFailure: string | null = null;

      try {
        const yoloRes = await fetch("/api/yolo/predict", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });

        if (yoloRes.ok) {
          const yoloData = await yoloRes.json();
          const top = yoloData?.top;
          const detections = Array.isArray(yoloData?.detections) ? yoloData.detections : [];

          if (top?.label) {
            const wasteType = String(top.label);
            const wasteTypeConfidence = Number(top.confidence ?? 0);
            const binSuggestion = guessBinFromLabel(wasteType);

            newResult = {
              wasteType,
              wasteTypeConfidence,
              binSuggestion,
              binConfidence: wasteTypeConfidence,
              imageUrl,
              detections: detections
                .slice(0, 5)
                .map((d: any) => ({ label: String(d.label), confidence: Number(d.confidence ?? 0) })),
            };
          } else {
            // Model responded but didn't detect anything.
            yoloFailure = "No object detected. Try moving closer or improving lighting.";
            newResult = {
              wasteType: "unknown",
              wasteTypeConfidence: 0,
              binSuggestion: "landfill",
              binConfidence: 0,
              imageUrl,
              detections: detections
                .slice(0, 5)
                .map((d: any) => ({ label: String(d.label), confidence: Number(d.confidence ?? 0) })),
            };
            toast({
              variant: "destructive",
              title: "No Detection",
              description: yoloFailure,
            });
          }
        } else {
          const err = await yoloRes.json().catch(() => null);
          yoloFailure = err?.error ? String(err.error) : `YOLO service returned ${yoloRes.status}`;
        }
      } catch (e) {
        yoloFailure = "Could not reach YOLO service";
      }

      if (!newResult) {
        if (genkitEnabled) {
          const [typeResult, binResult] = await Promise.all([
            identifyWasteType({ photoDataUri: imageUrl }),
            wasteBinClassification({ photoDataUri: imageUrl }),
          ]);

          newResult = {
            wasteType: typeResult.wasteType,
            wasteTypeConfidence: typeResult.confidence,
            binSuggestion: binResult.binSuggestion,
            binConfidence: binResult.confidence,
            imageUrl: imageUrl,
          };
        } else {
          throw new Error(yoloFailure || "YOLO inference failed");
        }
      }
      
      setResult(newResult);
      setRecentScans(prev => [newResult, ...prev.slice(0, 4)]);

    } catch (error) {
      console.error("AI classification failed:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not classify the item. Ensure the YOLO service is running (http://127.0.0.1:8000/health).",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCapture = async () => {
    const frame = await captureFrame();
    if (frame) {
      setPreviewUrl(frame);
      handleScan(frame);
      toggleCamera();
    } else {
      toast({
        variant: "destructive",
        title: "Capture failed",
        description: "Could not capture a frame from the camera. Try again.",
      });
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
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" /> Upload Image
              </TabsTrigger>
              <TabsTrigger value="camera" onClick={toggleCamera} disabled={!hasCameraPermission && !isCameraOn}>
                <Video className="mr-2 h-4 w-4" /> Live Camera
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <div
                className={cn(
                  "mt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
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
            </TabsContent>
            <TabsContent value="camera">
              <div className="mt-4 relative">
                {isCameraOn ? (
                  <div className="relative">
                    <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                      <Button onClick={handleCapture} size="lg" className="rounded-full h-16 w-16">
                        <Camera className="h-8 w-8" />
                      </Button>
                      <Button onClick={flipCamera} size="icon" variant="secondary" className="rounded-full h-16 w-16">
                        <FlipHorizontal className="h-8 w-8" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                     {!hasCameraPermission ? (
                      <Alert variant="destructive" className="w-auto">
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                          Enable camera permissions to use this feature.
                        </AlertDescription>
                      </Alert>
                     ) : (
                      <p>Camera is off</p>
                     )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Image Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
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
              ) : (
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
          </CardContent>
          {previewUrl && !result && !isLoading && (
            <CardFooter>
              <Button onClick={() => handleScan(previewUrl)} size="lg" className="w-full">
                <Sparkles className="mr-2 h-5 w-5" />
                Identify Item
              </Button>
            </CardFooter>
          )}
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Scan Result</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center text-center p-8 space-y-4 rounded-lg bg-secondary h-[300px]">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="font-semibold ml-4">Analyzing item...</p>
              </div>
            )}
            
            {result && (
              <div className="space-y-4 animate-in fade-in-50 h-[300px]">
                <SuggestedBinCard bin={result.binSuggestion} />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Confidence: {(result.binConfidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold capitalize">{result.wasteType}</p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {(result.wasteTypeConfidence * 100).toFixed(0)}%
                  </p>
                </div>
                {result.detections && result.detections.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <Separator className="my-2" />
                    <p className="font-medium text-foreground">Detected</p>
                    <ul className="mt-2 space-y-1">
                      {result.detections.map((d, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-4">
                          <span className="capitalize">{d.label}</span>
                          <span>{(d.confidence * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!result && !isLoading && (
              <div className="flex items-center justify-center text-center p-8 space-y-4 rounded-lg bg-muted h-[300px]">
                <p className="text-muted-foreground">Results will be displayed here.</p>
              </div>
            )}
          </CardContent>
           {(result || isLoading) && (
            <CardFooter>
               <Button onClick={handleClear} variant="outline" className="w-full">
                  Scan Another Item
                </Button>
            </CardFooter>
           )}
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          {recentScans.length > 0 ? (
            <ScrollArea>
              <div className="flex space-x-4 pb-4">
                {recentScans.map((scan, index) => (
                  <div key={index} className="flex-shrink-0 w-[200px] space-y-2">
                    <Image
                      src={scan.imageUrl}
                      alt={`Scan of ${scan.wasteType}`}
                      width={200}
                      height={150}
                      className="rounded-md object-cover aspect-[4/3]"
                    />
                    <div className="text-sm">
                      <p className="font-semibold capitalize">{scan.wasteType}</p>
                      <p className="text-xs text-muted-foreground">{binInfo[scan.binSuggestion].label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No recent scans to display.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
