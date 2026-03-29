"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Course { id: string; name: string; code: string; professorId: string }
interface Room { id: string; name: string; building: string | null }

export default function NewSessionPage() {
  const { data: authSession } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    courseId: "",
    roomId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:30",
    endTime: "10:00",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/rooms").then((r) => r.json()),
    ]).then(([c, r]) => {
      // Filter courses for this professor
      const myCourses = authSession?.user?.professorId
        ? c.filter((course: Course) => course.professorId === authSession.user.professorId)
        : c;
      setCourses(myCourses);
      setRooms(r);
    });
  }, [authSession]);

  const updateForm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          professorId: authSession?.user?.professorId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la creation");
        return;
      }

      toast.success("Seance creee avec succes");
      router.push("/professor/sessions");
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/professor/sessions">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle seance</h1>
          <p className="text-gray-500 mt-1">Planifiez une seance de cours</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Details de la seance</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Cours</Label>
              <Select value={form.courseId} onValueChange={(v) => updateForm("courseId", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir un cours" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Salle</Label>
              <Select value={form.roomId} onValueChange={(v) => updateForm("roomId", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir une salle" /></SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}{r.building ? ` (${r.building})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure de debut</Label>
                <Input type="time" value={form.startTime} onChange={(e) => updateForm("startTime", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Input type="time" value={form.endTime} onChange={(e) => updateForm("endTime", e.target.value)} required />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/professor/sessions">
                <Button type="button" variant="outline">Annuler</Button>
              </Link>
              <Button type="submit" disabled={submitting || !form.courseId || !form.roomId}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creer la seance"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
