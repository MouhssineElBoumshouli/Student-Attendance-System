"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, Loader2, Play, Eye, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface Session {
  id: string; date: string; startTime: string; endTime: string; status: string;
  course: { name: string; code: string };
  room: { name: string; building: string | null };
  _count: { attendances: number };
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "warning" }> = {
  SCHEDULED: { label: "Planifiée", variant: "secondary" },
  ACTIVE: { label: "En cours", variant: "success" },
  COMPLETED: { label: "Terminée", variant: "default" },
  CANCELLED: { label: "Annulée", variant: "destructive" },
};

export default function ProfessorSessionsPage() {
  const { data: authSession } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authSession?.user?.professorId) return;
    fetch(`/api/sessions?professorId=${authSession.user.professorId}`)
      .then((r) => r.json())
      .then((data) => { setSessions(data); setLoading(false); });
  }, [authSession]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes séances</h1>
          <p className="text-gray-500 mt-1">Gérez et suivez vos séances de cours</p>
        </div>
        <Link href="/professor/sessions/new">
          <Button><Plus className="h-4 w-4" /> Nouvelle séance</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : sessions.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <CalendarDays className="h-12 w-12 mb-4 text-gray-300" />
          <p className="font-medium">Aucune seance</p>
          <p className="text-sm">Creez votre premiere seance pour commencer</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const cfg = statusConfig[s.status] || statusConfig.SCHEDULED;
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gray-100 text-center">
                        <span className="text-xs font-medium text-gray-500">{formatDate(s.date).split("/")[1]}/{formatDate(s.date).split("/")[2]}</span>
                        <span className="text-lg font-bold text-gray-900">{formatDate(s.date).split("/")[0]}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{s.course.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(s.startTime)} - {formatTime(s.endTime)}
                          <span>&middot;</span>
                          {s.room.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {s.status === "ACTIVE" && (
                        <Link href={`/professor/sessions/${s.id}/live`}>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <Play className="h-3.5 w-3.5" /> QR Code
                          </Button>
                        </Link>
                      )}
                      <Link href={`/professor/sessions/${s.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
