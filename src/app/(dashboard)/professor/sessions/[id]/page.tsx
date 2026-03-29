"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Play, Square, Loader2, Users, Clock, MapPin,
  CheckCircle2, XCircle, AlertTriangle, MinusCircle,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";

interface Attendance {
  id: string; status: string; scannedAt: string | null; verified: boolean;
  student: { id: string; studentId: string; user: { firstName: string; lastName: string } };
}

interface SessionDetail {
  id: string; date: string; startTime: string; endTime: string; status: string;
  course: { name: string; code: string };
  room: { name: string; building: string | null };
  attendances: Attendance[];
}

const statusIcon: Record<string, React.ReactNode> = {
  PRESENT: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  ABSENT: <XCircle className="h-4 w-4 text-red-500" />,
  LATE: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  EXCUSED: <MinusCircle className="h-4 w-4 text-blue-500" />,
};

const statusLabel: Record<string, string> = {
  PRESENT: "Present", ABSENT: "Absent", LATE: "En retard", EXCUSED: "Excuse",
};

const statusBadge: Record<string, "success" | "destructive" | "warning" | "default"> = {
  PRESENT: "success", ABSENT: "destructive", LATE: "warning", EXCUSED: "default",
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setSession(data);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    // Poll every 10s if session is active
    const interval = setInterval(() => {
      fetchSession();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/activate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetchSession();
      } else {
        toast.error(data.error);
      }
    } catch { toast.error("Erreur serveur"); }
    finally { setActivating(false); }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/deactivate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        await fetchSession();
      } else {
        toast.error(data.error);
      }
    } catch { toast.error("Erreur serveur"); }
    finally { setDeactivating(false); }
  };

  const handleStatusChange = async (attendanceId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, status: newStatus }),
      });
      if (res.ok) {
        toast.success("Statut mis a jour");
        await fetchSession();
      }
    } catch { toast.error("Erreur"); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  if (!session) {
    return <div className="text-center py-12 text-gray-500">Seance non trouvee</div>;
  }

  const present = session.attendances.filter((a) => a.status === "PRESENT").length;
  const late = session.attendances.filter((a) => a.status === "LATE").length;
  const absent = session.attendances.filter((a) => a.status === "ABSENT").length;
  const excused = session.attendances.filter((a) => a.status === "EXCUSED").length;
  const total = session.attendances.length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.course.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(session.date)} &middot; {formatTime(session.startTime)} - {formatTime(session.endTime)}
              <span>&middot;</span>
              <MapPin className="h-3.5 w-3.5" /> {session.room.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "SCHEDULED" && (
            <Button onClick={handleActivate} disabled={activating} className="bg-emerald-600 hover:bg-emerald-700">
              {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Activer la seance
            </Button>
          )}
          {session.status === "ACTIVE" && (
            <>
              <Link href={`/professor/sessions/${sessionId}/live`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="h-4 w-4" /> Afficher QR
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDeactivate} disabled={deactivating}>
                {deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                Terminer
              </Button>
            </>
          )}
          <Badge variant={session.status === "ACTIVE" ? "success" : session.status === "COMPLETED" ? "default" : "secondary"}>
            {session.status === "ACTIVE" ? "En cours" : session.status === "COMPLETED" ? "Terminee" : session.status === "CANCELLED" ? "Annulee" : "Planifiee"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Presents", value: present, color: "text-emerald-600 bg-emerald-50" },
          { label: "En retard", value: late, color: "text-amber-600 bg-amber-50" },
          { label: "Absents", value: absent, color: "text-red-600 bg-red-50" },
          { label: "Excuses", value: excused, color: "text-blue-600 bg-blue-50" },
          { label: "Taux", value: `${rate}%`, color: "text-gray-900 bg-gray-50" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color.split(" ")[0]}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste de presence ({total} etudiants)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {total === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {session.status === "SCHEDULED"
                ? "Activez la seance pour generer la liste de presence"
                : "Aucun etudiant inscrit"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Etudiant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Heure</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Verifie</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {session.attendances.map((att) => (
                    <tr key={att.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {statusIcon[att.status]}
                          <span className="font-medium text-gray-900">
                            {att.student.user.lastName} {att.student.user.firstName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusBadge[att.status]}>
                          {statusLabel[att.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {att.scannedAt ? formatTime(att.scannedAt) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {att.scannedAt && (
                          att.verified
                            ? <Badge variant="success">GPS OK</Badge>
                            : <Badge variant="warning">Non verifie</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Select
                          value={att.status}
                          onValueChange={(v) => handleStatusChange(att.id, v)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">Present</SelectItem>
                            <SelectItem value="ABSENT">Absent</SelectItem>
                            <SelectItem value="LATE">En retard</SelectItem>
                            <SelectItem value="EXCUSED">Excuse</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
