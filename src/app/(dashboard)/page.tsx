"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, GraduationCap, BookOpen, CalendarDays, QrCode, BarChart3, Plus, Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  if (!session?.user) return null;

  const { role, firstName } = session.user;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {firstName}</h1>
        <p className="text-gray-500 mt-1">
          {role === "ADMIN" && "Vue d'ensemble de la plateforme"}
          {role === "PROFESSOR" && "Gerez vos seances et suivez les presences"}
          {role === "STUDENT" && "Consultez vos presences et scannez les QR codes"}
        </p>
      </div>

      {role === "ADMIN" && <AdminDashboard />}
      {role === "PROFESSOR" && <ProfessorDashboard professorId={session.user.professorId} />}
      {role === "STUDENT" && <StudentDashboard studentId={session.user.studentId} />}
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, professors: 0, courses: 0, activeSessions: 0 });

  useEffect(() => {
    fetch("/api/analytics?role=ADMIN").then((r) => r.json()).then(setStats);
  }, []);

  const items = [
    { label: "Etudiants", value: stats.students, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Professeurs", value: stats.professors, icon: GraduationCap, color: "bg-emerald-50 text-emerald-600" },
    { label: "Cours", value: stats.courses, icon: BookOpen, color: "bg-violet-50 text-violet-600" },
    { label: "Seances actives", value: stats.activeSessions, icon: CalendarDays, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}><Icon className="h-5 w-5" /></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProfessorDashboard({ professorId }: { professorId: string | null }) {
  const [stats, setStats] = useState({ courses: 0, monthSessions: 0, attendanceRate: 0 });

  useEffect(() => {
    if (!professorId) return;
    fetch(`/api/analytics?role=PROFESSOR&professorId=${professorId}`).then((r) => r.json()).then(setStats);
  }, [professorId]);

  const items = [
    { label: "Mes cours", value: stats.courses, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { label: "Seances ce mois", value: stats.monthSessions, icon: CalendarDays, color: "bg-emerald-50 text-emerald-600" },
    { label: "Taux de presence", value: `${stats.attendanceRate}%`, icon: BarChart3, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}><Icon className="h-5 w-5" /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Link href="/professor/sessions/new">
        <Button size="lg"><Plus className="h-4 w-4" /> Nouvelle seance</Button>
      </Link>
    </div>
  );
}

function StudentDashboard({ studentId }: { studentId: string | null }) {
  const [stats, setStats] = useState({ attendanceRate: 0, monthPresent: 0, total: 0 });

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/analytics?role=STUDENT&studentId=${studentId}`).then((r) => r.json()).then(setStats);
  }, [studentId]);

  const rateColor = stats.attendanceRate >= 80 ? "text-emerald-600" : stats.attendanceRate >= 60 ? "text-amber-600" : "text-red-600";

  const items = [
    { label: "Taux de presence", value: `${stats.attendanceRate}%`, icon: BarChart3, color: "bg-blue-50 text-blue-600", textColor: rateColor },
    { label: "Presences ce mois", value: stats.monthPresent, icon: CalendarDays, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total seances", value: stats.total, icon: BookOpen, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${"textColor" in stat ? stat.textColor : "text-gray-900"}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}><Icon className="h-5 w-5" /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Link href="/student/scan">
        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
          <QrCode className="h-4 w-4" /> Scanner un QR code
        </Button>
      </Link>
    </div>
  );
}
