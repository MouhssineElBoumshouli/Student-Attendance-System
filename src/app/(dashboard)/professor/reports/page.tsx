"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, Download, Loader2, FileSpreadsheet,
  CheckCircle2, XCircle, AlertTriangle, MinusCircle,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";

interface Course {
  id: string; name: string; code: string; professorId: string;
}

interface SessionRecord {
  id: string; date: string; startTime: string; endTime: string; status: string;
  course: { name: string; code: string };
  room: { name: string };
  _count: { attendances: number };
}

interface AttendanceRecord {
  id: string; status: string; scannedAt: string | null; verified: boolean;
  student: { id: string; studentId: string; user: { firstName: string; lastName: string; email: string } };
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "success" | "destructive" | "warning" | "default" }> = {
  PRESENT: { label: "Present", icon: <CheckCircle2 className="h-4 w-4" />, variant: "success" },
  ABSENT: { label: "Absent", icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
  LATE: { label: "En retard", icon: <AlertTriangle className="h-4 w-4" />, variant: "warning" },
  EXCUSED: { label: "Excuse", icon: <MinusCircle className="h-4 w-4" />, variant: "default" },
};

export default function ProfessorReportsPage() {
  const { data: authSession } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (!authSession?.user?.professorId) return;
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch(`/api/sessions?professorId=${authSession.user.professorId}`).then((r) => r.json()),
    ]).then(([c, s]) => {
      const myCourses = c.filter((course: Course) => course.professorId === authSession.user.professorId);
      setCourses(myCourses);
      setSessions(s.filter((sess: SessionRecord) => sess.status === "COMPLETED"));
      setLoading(false);
    });
  }, [authSession]);

  const filteredSessions = selectedCourse
    ? sessions.filter((s) => s.course.code === courses.find((c) => c.id === selectedCourse)?.code)
    : sessions;

  useEffect(() => {
    if (!selectedSession) { setAttendances([]); return; }
    setLoadingAttendance(true);
    fetch(`/api/sessions/${selectedSession}/attendance`)
      .then((r) => r.json())
      .then((data) => { setAttendances(data); setLoadingAttendance(false); });
  }, [selectedSession]);

  const exportCsv = () => {
    if (attendances.length === 0) { toast.error("Aucune donnee a exporter"); return; }

    const session = sessions.find((s) => s.id === selectedSession);
    const headers = ["Nom", "Prenom", "Email", "N° Etudiant", "Statut", "Heure scan", "Verifie"];
    const rows = attendances.map((a) => [
      a.student.user.lastName,
      a.student.user.firstName,
      a.student.user.email,
      a.student.studentId,
      statusConfig[a.status]?.label || a.status,
      a.scannedAt ? formatTime(a.scannedAt) : "",
      a.verified ? "Oui" : "Non",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presence_${session?.course.code}_${session?.date ? formatDate(session.date).replace(/\//g, "-") : "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV telecharge");
  };

  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;
  const total = attendances.length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-500 mt-1">Consultez et exportez les rapports de presence</p>
        </div>
        {attendances.length > 0 && (
          <Button onClick={exportCsv} variant="outline">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedSession(""); }}>
          <SelectTrigger><SelectValue placeholder="Filtrer par cours" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les cours</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger><SelectValue placeholder="Choisir une seance" /></SelectTrigger>
          <SelectContent>
            {filteredSessions.length === 0 ? (
              <SelectItem value="none" disabled>Aucune seance terminee</SelectItem>
            ) : (
              filteredSessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.course.name} - {formatDate(s.date)} ({formatTime(s.startTime)})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : !selectedSession ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileSpreadsheet className="h-12 w-12 mb-4 text-gray-300" />
            <p className="font-medium">Selectionnez une seance</p>
            <p className="text-sm">Choisissez une seance pour voir le rapport de presence</p>
          </CardContent>
        </Card>
      ) : loadingAttendance ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Presents", value: present, color: "text-emerald-600" },
              { label: "En retard", value: late, color: "text-amber-600" },
              { label: "Absents", value: total - present - late - attendances.filter((a) => a.status === "EXCUSED").length, color: "text-red-600" },
              { label: "Taux", value: `${rate}%`, color: "text-gray-900" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Attendance table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" /> Details ({total} etudiants)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Etudiant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">N°</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Heure</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((att) => {
                      const cfg = statusConfig[att.status] || statusConfig.ABSENT;
                      return (
                        <tr key={att.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {att.student.user.lastName} {att.student.user.firstName}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{att.student.studentId}</td>
                          <td className="py-3 px-4">
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {att.scannedAt ? formatTime(att.scannedAt) : "—"}
                          </td>
                          <td className="py-3 px-4">
                            {att.scannedAt && (
                              att.verified
                                ? <Badge variant="success">OK</Badge>
                                : <Badge variant="warning">Non</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
