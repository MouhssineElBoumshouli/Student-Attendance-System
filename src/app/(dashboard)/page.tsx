import { requireAuth } from "@/lib/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  QrCode,
  BarChart3,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();
  const { role, firstName } = session.user;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          {role === "ADMIN" && "Vue d'ensemble de la plateforme"}
          {role === "PROFESSOR" && "Gerez vos seances et suivez les presences"}
          {role === "STUDENT" && "Consultez vos presences et scannez les QR codes"}
        </p>
      </div>

      {/* Stats Grid */}
      {role === "ADMIN" && <AdminDashboard />}
      {role === "PROFESSOR" && <ProfessorDashboard />}
      {role === "STUDENT" && <StudentDashboard />}
    </div>
  );
}

function AdminDashboard() {
  const stats = [
    { label: "Etudiants", value: "--", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Professeurs", value: "--", icon: GraduationCap, color: "bg-emerald-50 text-emerald-600" },
    { label: "Cours", value: "--", icon: BookOpen, color: "bg-violet-50 text-violet-600" },
    { label: "Seances actives", value: "--", icon: CalendarDays, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProfessorDashboard() {
  const stats = [
    { label: "Mes cours", value: "--", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { label: "Seances ce mois", value: "--", icon: CalendarDays, color: "bg-emerald-50 text-emerald-600" },
    { label: "Taux de presence", value: "--%", icon: BarChart3, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StudentDashboard() {
  const stats = [
    { label: "Taux de presence", value: "--%", icon: BarChart3, color: "bg-blue-50 text-blue-600" },
    { label: "Presences ce mois", value: "--", icon: CalendarDays, color: "bg-emerald-50 text-emerald-600" },
    { label: "Scanner QR", value: "Pret", icon: QrCode, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
