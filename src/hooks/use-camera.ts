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


  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
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
