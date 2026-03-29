"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  History, Loader2, CheckCircle2, XCircle, AlertTriangle, MinusCircle,
  BookOpen, BarChart3,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface AttendanceRecord {
  id: string; status: string; scannedAt: string | null; verified: boolean;
  session: {
    id: string; date: string; startTime: string; endTime: string; status: string;
    course: { name: string; code: string };
    room: { name: string };
  };
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "success" | "destructive" | "warning" | "default" }> = {
  PRESENT: { label: "Present", icon: <CheckCircle2 className="h-4 w-4" />, variant: "success" },
  ABSENT: { label: "Absent", icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
  LATE: { label: "En retard", icon: <AlertTriangle className="h-4 w-4" />, variant: "warning" },
  EXCUSED: { label: "Excuse", icon: <MinusCircle className="h-4 w-4" />, variant: "default" },
};

export default function StudentHistoryPage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.studentId) return;

    // Fetch all sessions and find this student's attendance
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(async (sessions) => {
        const allRecords: AttendanceRecord[] = [];

        for (const s of sessions) {
          if (s.status === "SCHEDULED") continue;
          try {
            const res = await fetch(`/api/sessions/${s.id}/attendance`);
            if (res.ok) {
              const attendances = await res.json();
              const mine = attendances.find(
                (a: { student: { id: string } }) => a.student.id === session.user.studentId
              );
              if (mine) {
                allRecords.push({
                  ...mine,
                  session: {
                    id: s.id,
                    date: s.date,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    status: s.status,
                    course: s.course,
                    room: s.room,
                  },
                });
              }
            }
          } catch { /* ignore */ }
        }

        // Sort by date descending
        allRecords.sort((a, b) =>
          new Date(b.session.date).getTime() - new Date(a.session.date).getTime()
        );

        setRecords(allRecords);
        setLoading(false);
      });
  }, [session]);

  // Calculate stats
  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  // Group by course
  const byCourse = records.reduce((acc, r) => {
    const code = r.session.course.code;
    if (!acc[code]) {
      acc[code] = { name: r.session.course.name, code, total: 0, present: 0, late: 0 };
    }
    acc[code].total++;
    if (r.status === "PRESENT") acc[code].present++;
    if (r.status === "LATE") acc[code].late++;
    return acc;
  }, {} as Record<string, { name: string; code: string; total: number; present: number; late: number }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon historique</h1>
        <p className="text-gray-500 mt-1">Consultez votre historique de presences</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Taux global", value: `${rate}%`, color: rate >= 80 ? "text-emerald-600" : rate >= 60 ? "text-amber-600" : "text-red-600" },
              { label: "Presents", value: present, color: "text-emerald-600" },
              { label: "En retard", value: late, color: "text-amber-600" },
              { label: "Absents", value: absent, color: "text-red-600" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Per-course breakdown */}
          {Object.keys(byCourse).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" /> Par cours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.values(byCourse).map((course) => {
                  const courseRate = Math.round(((course.present + course.late) / course.total) * 100);
                  return (
                    <div key={course.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{course.name}</span>
                        <Badge variant="outline" className="text-xs">{course.code}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${courseRate >= 80 ? "bg-emerald-500" : courseRate >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${courseRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-10 text-right">{courseRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* History list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" /> Historique ({total} seances)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {total === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucune seance enregistree
                </div>
              ) : (
                <div className="divide-y">
                  {records.map((record) => {
                    const cfg = statusConfig[record.status] || statusConfig.ABSENT;
                    return (
                      <div key={record.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`${cfg.variant === "success" ? "text-emerald-600" : cfg.variant === "destructive" ? "text-red-500" : cfg.variant === "warning" ? "text-amber-500" : "text-blue-500"}`}>
                            {cfg.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{record.session.course.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(record.session.date)} &middot; {formatTime(record.session.startTime)}
                              {record.scannedAt && ` &middot; Scanne a ${formatTime(record.scannedAt)}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
