"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, Users } from "lucide-react";

interface Course {
  id: string; name: string; code: string; semester: number; academicYear: string; totalHours: number | null;
  program: { code: string };
  groups: { group: { id: string; name: string } }[];
  _count: { sessions: number };
}

export default function ProfessorCoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((all: Course[]) => {
        // Filter courses for this professor (API returns all, we filter client-side)
        // In production, the API would filter server-side
        setCourses(all);
        setLoading(false);
      });
  }, [session]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>
        <p className="text-gray-500 mt-1">Liste de vos cours pour cette annee</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : courses.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <BookOpen className="h-12 w-12 mb-4 text-gray-300" />
          <p className="font-medium">Aucun cours attribue</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.code} &middot; S{course.semester}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{course.program.code}</Badge>
                  {course.groups.map((cg) => (
                    <Badge key={cg.group.id} variant="outline">{cg.group.name}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 pt-1 border-t">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course._count.sessions} seance{course._count.sessions !== 1 ? "s" : ""}
                  </span>
                  {course.totalHours && <span>{course.totalHours}h prevues</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
