"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, AlertTriangle, Loader2, MapPin, Camera, Clock,
  BookOpen, Hand, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

type Phase = "idle" | "checking" | "submitting" | "success" | "already" | "error" | "no-session";

interface ActiveSession {
  id: string;
  startTime: string;
  endTime: string;
  course: { name: string; code: string };
  room: { name: string; building: string | null };
  alreadyCheckedIn?: boolean;
}

interface CheckinResult {
  status?: string;
  verified?: boolean;
  flags?: string[];
  distance?: number | null;
  message?: string;
}

const FLAG_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  GPS_UNAVAILABLE: {
    label: "Position GPS non disponible",
    icon: <MapPin className="h-3.5 w-3.5" />,
  },
  GPS_OUT_OF_RANGE: {
    label: "GPS hors zone de la salle",
    icon: <MapPin className="h-3.5 w-3.5" />,
  },
  NO_SELFIE: {
    label: "Photo non capturée",
    icon: <Camera className="h-3.5 w-3.5" />,
  },
  DEVICE_MISMATCH: {
    label: "Appareil différent de l'habitude",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  DEVICE_SHARED: {
    label: "Cet appareil a déjà servi pour un autre compte",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
};

export default function CheckinPage() {
  const { data: authSession } = useSession();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CheckinResult>({});
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchActive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/active-session");
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        if (data.session.alreadyCheckedIn) setPhase("already");
        else setPhase("idle");
      } else {
        setActiveSession(null);
        setPhase("no-session");
      }
    } catch {
      setError("Erreur de chargement");
      setPhase("error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActive();
    // Re-check every 30s so the page updates if a session starts/ends
    const i = setInterval(fetchActive, 30_000);
    return () => clearInterval(i);
  }, [fetchActive]);

  // ── Capture a front-camera selfie as a small JPEG data URL ──────────
  const captureSelfie = async (): Promise<string | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      if (!videoRef.current) return null;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      // Give the camera 600ms to expose properly
      await new Promise((r) => setTimeout(r, 600));

      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        stream.getTracks().forEach((t) => t.stop());
        return null;
      }
      // Center-crop the video into a 320x320 square
      const v = videoRef.current;
      const side = Math.min(v.videoWidth, v.videoHeight);
      const sx = (v.videoWidth - side) / 2;
      const sy = (v.videoHeight - side) / 2;
      ctx.drawImage(v, sx, sy, side, side, 0, 0, 320, 320);
      const data = canvas.toDataURL("image/jpeg", 0.75);

      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      return data;
    } catch (e) {
      console.warn("Selfie capture failed:", e);
      return null;
    }
  };

  // ── Read GPS once with high accuracy ───────────────────────────────
  const captureGps = (): Promise<GeolocationPosition | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });

  const handleCheckin = async () => {
    if (!activeSession) return;
    setPhase("checking");
    setResult({});
    setError("");

    const [pos, selfie] = await Promise.all([captureGps(), captureSelfie()]);

    setPhase("submitting");
    const deviceInfo = `${navigator.userAgent}|${screen.width}x${screen.height}|${navigator.language}`;
    try {
      const res = await fetch(`/api/sessions/${activeSession.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: pos?.coords.latitude ?? null,
          longitude: pos?.coords.longitude ?? null,
          deviceInfo,
          selfie,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setPhase("success");
      } else if (data.alreadyPresent) {
        setPhase("already");
      } else {
        setError(data.error || "Erreur");
        setPhase("error");
      }
    } catch {
      setError("Erreur réseau");
      setPhase("error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Marquer ma présence</h1>
        <p className="text-gray-500 mt-1">
          {authSession?.user?.role === "PROFESSOR"
            ? "Enregistrez votre présence en classe en un tap"
            : "Tapez sur le bouton ci-dessous une fois dans la salle"}
        </p>
      </div>

      <video ref={videoRef} className="hidden" playsInline muted />

      {phase === "no-session" && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">Aucune séance active</p>
            <p className="text-sm text-gray-500 mt-1">
              Aucun de vos cours n&apos;a de séance en cours pour le moment.
            </p>
          </CardContent>
        </Card>
      )}

      {activeSession && phase !== "no-session" && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-mono">
                Séance en cours
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                {activeSession.course.name}
              </h2>
              <p className="text-sm text-gray-500">{activeSession.course.code}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatTime(activeSession.startTime)} – {formatTime(activeSession.endTime)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {activeSession.room.name}
              </div>
            </div>

            {phase === "idle" && (
              <Button
                onClick={handleCheckin}
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-base"
              >
                <Hand className="h-5 w-5" />
                Je suis là
              </Button>
            )}

            {phase === "checking" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Vérifications en cours…</p>
                  <p className="text-blue-700">GPS · caméra · appareil</p>
                </div>
              </div>
            )}

            {phase === "submitting" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Envoi…</p>
              </div>
            )}

            {phase === "success" && (
              <div
                className={`border rounded-lg p-4 space-y-3 ${
                  result.verified
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.verified ? (
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                  )}
                  <p
                    className={`font-semibold ${
                      result.verified ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    {result.verified ? "Présence vérifiée" : "Présence enregistrée — à vérifier"}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{result.message}</p>
                {result.flags && result.flags.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-amber-200">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                      Points à vérifier
                    </p>
                    {result.flags.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-amber-800">
                        {FLAG_LABELS[f]?.icon || <AlertTriangle className="h-3.5 w-3.5" />}
                        {FLAG_LABELS[f]?.label || f}
                      </div>
                    ))}
                    <p className="text-xs text-amber-600 mt-2 italic">
                      Votre professeur pourra confirmer en classe.
                    </p>
                  </div>
                )}
                {result.distance != null && (
                  <div className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                    <MapPin className="h-3 w-3" /> Distance à la salle : {result.distance} m
                  </div>
                )}
              </div>
            )}

            {phase === "already" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Votre présence est déjà enregistrée pour cette séance.
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="font-semibold text-red-800">Échec</p>
                </div>
                <p className="text-sm text-red-700">{error}</p>
                <Button onClick={() => setPhase("idle")} variant="outline" size="sm">
                  Réessayer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-gray-500 space-y-1 max-w-md mx-auto px-2">
        <p className="font-medium text-gray-600">Comment ça marche</p>
        <p>Quand vous tapez « Je suis là », l&apos;application :</p>
        <ul className="list-disc list-inside space-y-0.5 pl-2">
          <li>vérifie que vous êtes dans la salle (GPS)</li>
          <li>compare votre appareil à votre appareil habituel</li>
          <li>prend une photo de face pour audit</li>
        </ul>
        <p className="pt-1">
          Si une vérification échoue, votre présence est tout de même enregistrée
          mais marquée « à vérifier » — votre professeur tranchera en classe.
        </p>
      </div>
    </div>
  );
}
