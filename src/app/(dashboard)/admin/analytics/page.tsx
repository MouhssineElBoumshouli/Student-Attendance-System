"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, AlertTriangle, UserX, Users, Loader2, ChevronRight, GraduationCap,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface SessionMissingProf {
  id: string;
  date: string;
  startTime: string;
  course: { name: string; code: string };
  room: { name: string };
  professor: { firstName: string; lastName: string };
  studentsPresent: number;
  studentsTotal: number;
}

interface ProfRanking {
  professorId: string;
  firstName: string;
  lastName: string;
  totalSessions: number;
  absences: number;
  absenceRate: number;
}

interface SessionMissingStudents {
  id: string;
  date: string;
  startTime: string;
  course: { name: string; code: string };
  room: { name: string };
  professor: { firstName: string; lastName: string };
  enrolledCount: number;
}

interface Anomalies {
  summary: {
    windowStart: string;
    windowEnd: string;
    completedSessions: number;
    sessionsWithoutProfCount: number;
    sessionsWithoutStudentCount: number;
  };
  sessionsWithoutProfessor: SessionMissingProf[];
  professorAbsenceRanking: ProfRanking[];
  sessionsWithoutStudents: SessionMissingStudents[];
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AnalyticsPage() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState<Anomalies | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/anomalies?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytiques &amp; anomalies</h1>
        <p className="text-gray-500 mt-1">
          Audit de conformité des séances pour l&apos;administration
        </p>
      </div>

      {/* Date range filter */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-1 flex-1">
            <Label className="text-xs text-gray-500">Du</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs text-gray-500">Au</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Actualiser
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-500 text-sm">Erreur de chargement</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Séances terminées</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {data.summary.completedSessions}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 text-gray-700">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Sans professeur</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {data.summary.sessionsWithoutProfCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <UserX className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Sans étudiants</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {data.summary.sessionsWithoutStudentCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 text-red-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions without professor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserX className="h-4 w-4 text-amber-600" />
                Séances sans professeur ({data.sessionsWithoutProfessor.length})
              </CardTitle>
              <p className="text-xs text-gray-500">
                Séances terminées où le professeur n&apos;a pas enregistré sa présence.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {data.sessionsWithoutProfessor.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucune anomalie — tous les professeurs ont enregistré leur présence.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Cours</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Professeur</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Salle</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Étudiants</th>
                        <th className="text-right py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessionsWithoutProfessor.map((s) => (
                        <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-700">
                            {formatDate(s.date)} · {formatTime(s.startTime)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{s.course.name}</div>
                            <div className="text-xs text-gray-400">{s.course.code}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            Pr {s.professor.firstName} {s.professor.lastName}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{s.room.name}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={s.studentsPresent > 0 ? "success" : "secondary"}>
                              {s.studentsPresent} / {s.studentsTotal}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/professor/sessions/${s.id}`}>
                              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professor absence ranking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4 text-amber-600" />
                Classement des absences professeurs
              </CardTitle>
              <p className="text-xs text-gray-500">
                Nombre de séances absentes par professeur sur la période sélectionnée.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {data.professorAbsenceRanking.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Aucune donnée.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Professeur</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Séances</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Absences</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.professorAbsenceRanking.map((p) => (
                        <tr key={p.professorId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            Pr {p.firstName} {p.lastName}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-500">
                            {p.totalSessions}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={p.absences === 0 ? "success" : p.absences <= 2 ? "warning" : "destructive"}
                            >
                              {p.absences}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${p.absenceRate === 0 ? "bg-emerald-500" : p.absenceRate <= 20 ? "bg-amber-500" : "bg-red-500"}`}
                                  style={{ width: `${Math.max(4, p.absenceRate)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-gray-700 w-10 text-right">
                                {p.absenceRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessions without students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Séances sans étudiants ({data.sessionsWithoutStudents.length})
              </CardTitle>
              <p className="text-xs text-gray-500">
                Le professeur s&apos;est présenté mais aucun étudiant n&apos;a scanné. Peut indiquer un changement de salle ou une annulation informelle.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {data.sessionsWithoutStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Aucune anomalie.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Cours</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Professeur</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Salle</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500">Inscrits</th>
                        <th className="text-right py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessionsWithoutStudents.map((s) => (
                        <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-700">
                            {formatDate(s.date)} · {formatTime(s.startTime)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{s.course.name}</div>
                            <div className="text-xs text-gray-400">{s.course.code}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            Pr {s.professor.firstName} {s.professor.lastName}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{s.room.name}</td>
                          <td className="py-3 px-4 text-center text-gray-500">
                            {s.enrolledCount}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/professor/sessions/${s.id}`}>
                              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
