"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function useCamera() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (hasCameraPermission === null) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setHasCameraPermission(true);
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings to use this feature.",
          });
        }
      }
    };
    getCameraPermission();
  }, [hasCameraPermission, toast]);

  const startCamera = async () => {
    if (isCameraOn || hasCameraPermission === false) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure metadata is available and the element is actually playing.
        try {
          if (videoRef.current.readyState < 1) {
            await new Promise<void>((resolve) => {
              const v = videoRef.current;
              if (!v) return resolve();
              const onLoaded = () => {
                v.removeEventListener("loadedmetadata", onLoaded);
                resolve();
              };
              v.addEventListener("loadedmetadata", onLoaded);
            });
          }
          await videoRef.current.play();
        } catch {
          // ignore
        }
      }
      setIsCameraOn(true);
    } catch (error) {
      console.error("Error starting camera:", error);
      toast({
        variant: "destructive",
        title: "Could not start camera",
        description: "Please ensure your camera is not being used by another application.",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOn(false);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const flipCamera = () => {
    stopCamera();
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };
  
  useEffect(() => {
    if (facingMode && !isCameraOn) {
        startCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const waitForVideoReady = async (timeoutMs = 5000) => {
    const video = videoRef.current;
    if (!video) return false;
    if (video.videoWidth && video.videoHeight) return true;

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (video.videoWidth && video.videoHeight) return true;
      await new Promise(r => setTimeout(r, 50));
    }
    return Boolean(video.videoWidth && video.videoHeight);
  };

  const captureFrame = async () => {
    // Prefer ImageCapture when available; it often works even when the <video> element
    // hasn't populated videoWidth/videoHeight yet.
    try {
      const stream = streamRef.current;
      const ImageCaptureCtor = (globalThis as any).ImageCapture;
      if (stream && ImageCaptureCtor) {
        const track = stream.getVideoTracks?.()[0];
        if (track) {
          const imageCapture = new ImageCaptureCtor(track);
          const bitmap = await imageCapture.grabFrame();
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(bitmap, 0, 0);
              return canvas.toDataURL("image/jpeg");
            }
          }
        }
      }
    } catch {
      // ignore and fallback to video+canvas
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Try to nudge playback in case the browser paused it.
      try {
        await video.play();
      } catch {
        // ignore
      }
      const ready = await waitForVideoReady();
      if (!ready) {
        toast({
          variant: "destructive",
          title: "Camera not ready",
          description: "Wait a moment for the video to start, then try again.",
        });
        return null;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        return canvas.toDataURL("image/jpeg");
      }
    }
    return null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isCameraOn,
    hasCameraPermission,
    videoRef,
    canvasRef,
    toggleCamera,
    captureFrame,
    flipCamera,
  };
}
