"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QrCode, Camera, CheckCircle2, XCircle, AlertTriangle,
  Loader2, MapPin, RefreshCw,
} from "lucide-react";

type ScanState = "idle" | "scanning" | "submitting" | "success" | "error" | "already";

export default function StudentScanPage() {
  const { data: session } = useSession();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [scanDetails, setScanDetails] = useState<{
    status?: string; verified?: boolean; distance?: number;
  }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const lastScannedRef = useRef("");

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const submitAttendance = useCallback(async (payload: string) => {
    if (!session?.user?.studentId) return;

    // Prevent duplicate submissions for same QR
    if (lastScannedRef.current === payload) return;
    lastScannedRef.current = payload;

    setScanState("submitting");
    setMessage("Enregistrement en cours...");

    try {
      const qrData = JSON.parse(payload);
      const { s: sessionId, t: token, ts: timestamp } = qrData;

      if (!sessionId || !token || !timestamp) {
        setScanState("error");
        setMessage("QR code invalide");
        return;
      }

      // Get geolocation
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // GPS unavailable — will be marked as unverified
      }

      // Device fingerprint
      const deviceInfo = `${navigator.userAgent}|${screen.width}x${screen.height}|${navigator.language}`;

      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          timestamp,
          latitude,
          longitude,
          deviceInfo,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setScanState("success");
        setMessage(data.message);
        setScanDetails({
          status: data.status,
          verified: data.verified,
          distance: data.distance,
        });
        stopCamera();
      } else if (data.alreadyPresent) {
        setScanState("already");
        setMessage(data.error);
        stopCamera();
      } else {
        setScanState("error");
        setMessage(data.error);
        // Allow re-scanning after error
        setTimeout(() => {
          lastScannedRef.current = "";
        }, 3000);
      }
    } catch {
      setScanState("error");
      setMessage("Erreur lors de la lecture du QR code");
      lastScannedRef.current = "";
    }
  }, [session, stopCamera]);

  const startScanning = useCallback(async () => {
    setScanState("scanning");
    setMessage("");
    lastScannedRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 720 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scanningRef.current = true;

      // Dynamic import of jsQR for QR decoding
      const { default: jsQR } = await import("jsqr");

      const scan = () => {
        if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
          requestAnimationFrame(scan);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code?.data) {
          submitAttendance(code.data);
        } else {
          requestAnimationFrame(scan);
        }
      };

      requestAnimationFrame(scan);
    } catch {
      setScanState("error");
      setMessage("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, [submitAttendance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Scanner QR Code</h1>
        <p className="text-gray-500 mt-1">Scannez le QR code affiché par votre professeur</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {scanState === "idle" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <QrCode className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Prêt à scanner
              </h2>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Pointez votre caméra vers le QR code affiché sur l&apos;écran du professeur
              </p>
              <Button onClick={startScanning} size="lg">
                <Camera className="h-4 w-4" /> Ouvrir la caméra
              </Button>
            </div>
          )}

          {scanState === "scanning" && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full aspect-square object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Overlay with scanning frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/80 rounded-2xl shadow-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black/50 backdrop-blur-sm inline-block px-4 py-2 rounded-full">
                  Recherche du QR code...
                </p>
              </div>
              <Button
                variant="ghost"
                className="absolute top-4 right-4 text-white bg-black/30 hover:bg-black/50"
                onClick={() => { stopCamera(); setScanState("idle"); }}
              >
                Annuler
              </Button>
            </div>
          )}

          {scanState === "submitting" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600 font-medium">{message}</p>
            </div>
          )}

          {scanState === "success" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-emerald-700 mb-2">
                {scanDetails.status === "LATE" ? "Présent (en retard)" : "Présent !"}
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              {scanDetails.distance !== null && scanDetails.distance !== undefined && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                  <MapPin className="h-3.5 w-3.5" />
                  {scanDetails.verified
                    ? `GPS vérifié (${scanDetails.distance}m)`
                    : `GPS non vérifié (${scanDetails.distance}m)`}
                </div>
              )}
              {scanDetails.status === "LATE" && (
                <div className="flex items-center gap-2 text-amber-600 text-sm mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  Vous êtes arrivé en retard
                </div>
              )}
            </div>
          )}

          {scanState === "already" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-blue-700 mb-2">Déjà enregistré</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {scanState === "error" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-700 mb-2">Erreur</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={() => { setScanState("idle"); }} variant="outline">
                <RefreshCw className="h-4 w-4" /> Réessayer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
