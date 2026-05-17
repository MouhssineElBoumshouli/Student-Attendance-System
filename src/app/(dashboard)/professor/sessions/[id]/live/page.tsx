"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize, Minimize, Users, Wifi, WifiOff } from "lucide-react";

export default function LiveQrPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connected, setConnected] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [intervalSec, setIntervalSec] = useState(10);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const lastPayloadRef = useRef("");
  const [sessionInfo, setSessionInfo] = useState<{
    courseName: string; roomName: string; presentCount: number; totalCount: number;
  } | null>(null);

  // ─── Attendance counter poll (every 5s) ───────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const present = data.attendances?.filter(
          (a: { status: string }) => a.status === "PRESENT" || a.status === "LATE"
        ).length || 0;
        setSessionInfo({
          courseName: data.course?.name || "",
          roomName: data.room?.name || "",
          presentCount: present,
          totalCount: data.attendances?.length || 0,
        });
      } catch { /* ignore */ }
    };
    fetchInfo();
    const poll = setInterval(fetchInfo, 5000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [sessionId]);

  // ─── QR token fetch — scheduled at window expiry, not polled ──
  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/qr-token`);
      if (!res.ok) {
        setConnected(false);
        return null;
      }

      const data = await res.json();

      if (data.closed) {
        setConnected(false);
        router.push(`/professor/sessions/${sessionId}`);
        return null;
      }

      setConnected(true);
      setIntervalSec(data.intervalSec || 10);
      setExpiresAt(data.expiresAt);

      // Re-render the QR canvas only when the payload actually changes
      // (the server now returns a stable payload per rotation window).
      if (canvasRef.current && data.payload && data.payload !== lastPayloadRef.current) {
        lastPayloadRef.current = data.payload;
        await QRCode.toCanvas(canvasRef.current, data.payload, {
          width: 500,
          margin: 3,
          color: { dark: "#000000", light: "#ffffff" },
          errorCorrectionLevel: "L",
        });
      }

      return data.expiresAt as number;
    } catch {
      setConnected(false);
      return null;
    }
  }, [sessionId, router]);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const loop = async () => {
      if (cancelled) return;
      const expiry = await fetchToken();
      if (cancelled) return;
      // Schedule the next fetch just after the current window expires.
      // Fall back to a short retry if the server didn't return an expiry
      // (e.g. transient network failure).
      const delay = expiry ? Math.max(100, expiry - Date.now() + 200) : 2000;
      timeout = setTimeout(loop, delay);
    };

    loop();
    return () => { cancelled = true; if (timeout) clearTimeout(timeout); };
  }, [fetchToken]);

  // ─── Smooth countdown derived from expiresAt ──────────────────
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
    };
    tick();
    const i = setInterval(tick, 200);
    return () => clearInterval(i);
  }, [expiresAt]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const countdownPercent = intervalSec > 0 ? (countdown / intervalSec) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center -mx-4 sm:-mx-6 lg:-mx-8 -my-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => router.push(`/professor/sessions/${sessionId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <><Wifi className="h-4 w-4 text-emerald-400" /><span className="text-emerald-400">Connecté</span></>
            ) : (
              <><WifiOff className="h-4 w-4 text-red-400" /><span className="text-red-400">Déconnecté</span></>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-6">
        {/* Course name */}
        {sessionInfo && (
          <div className="text-center">
            <h1 className="text-3xl font-bold">{sessionInfo.courseName}</h1>
            <p className="text-white/60 mt-1">{sessionInfo.roomName}</p>
          </div>
        )}

        {/* QR Code with countdown ring */}
        <div className="relative">
          {/* Countdown ring */}
          <svg className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)]" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="48"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <circle
              cx="50" cy="50" r="48"
              fill="none"
              stroke={countdownPercent > 30 ? "#10b981" : countdownPercent > 10 ? "#f59e0b" : "#ef4444"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${countdownPercent * 3.01} 301`}
              transform="rotate(-90 50 50)"
              className="transition-[stroke-dasharray,stroke] duration-200 ease-linear"
            />
          </svg>

          {/* QR Canvas */}
          <div className="bg-white rounded-2xl p-4 shadow-2xl">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Countdown text */}
        <div className="text-center">
          <p className="text-5xl font-mono font-bold tabular-nums">
            {countdown}s
          </p>
          <p className="text-white/50 text-sm mt-1">Prochain QR code</p>
        </div>

        {/* Instructions */}
        <div className="text-center text-white/60 text-sm max-w-md">
          <p>Scannez ce QR code avec l&apos;application sur votre téléphone</p>
          <p>Le code change toutes les {intervalSec} secondes</p>
        </div>

        {/* Live attendance counter */}
        {sessionInfo && (
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">{sessionInfo.presentCount}</span>
            <span className="text-white/60">/</span>
            <span className="text-white/60">{sessionInfo.totalCount} présents</span>
          </div>
        )}
      </div>
    </div>
  );
}
