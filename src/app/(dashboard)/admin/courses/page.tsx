"use client";

import { useState, useEffect } from "react";
import { useCrud } from "@/hooks/use-crud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, BookOpen, Loader2 } from "lucide-react";

interface Program { id: string; name: string; code: string }
interface Professor { id: string; user: { firstName: string; lastName: string } }
interface Group { id: string; name: string; programId: string }
interface Course {
  id: string; name: string; code: string; semester: number; academicYear: string; totalHours: number | null;
  professor: Professor;
  program: Program & { department: { code: string } };
  groups: { group: { id: string; name: string } }[];
  _count: { sessions: number };
}

export default function CoursesPage() {
  const { data, loading, dialogOpen, setDialogOpen, create, remove } =
    useCrud<Course>("/api/courses");

  const [programs, setPrograms] = useState<Program[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [form, setForm] = useState({
    name: "", code: "", programId: "", professorId: "", semester: "", academicYear: "2025-2026", totalHours: "", groupIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/programs").then((r) => r.json()),
      fetch("/api/professors").then((r) => r.json()),
      fetch("/api/groups").then((r) => r.json()),
    ]).then(([p, pr, g]) => {
      setPrograms(p);
      setProfessors(pr);
      setAllGroups(g);
    });
  }, []);

  const updateForm = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const filteredGroups = allGroups.filter((g) => g.programId === form.programId);

  const toggleGroup = (groupId: string) => {
    setForm((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await create(form);
    if (ok) setForm({ name: "", code: "", programId: "", professorId: "", semester: "", academicYear: "2025-2026", totalHours: "", groupIds: [] });
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cours</h1>
          <p className="text-gray-500 mt-1">Gerez les cours et leurs attributions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : data.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <BookOpen className="h-12 w-12 mb-4 text-gray-300" /><p className="font-medium">Aucun cours</p>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Cours</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Professeur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Filiere</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Groupes</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">S.</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((course) => (
                <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-medium text-gray-900">{course.name}</span>
                      <p className="text-xs text-gray-400">{course.code}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {course.professor.user.firstName} {course.professor.user.lastName}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">{course.program.code}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    {course.groups.map((cg) => (
                      <Badge key={cg.group.id} variant="outline" className="mr-1">{cg.group.name}</Badge>
                    ))}
                  </td>
                  <td className="py-3 px-4 text-gray-500">S{course.semester}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600"
                      onClick={() => { if (confirm("Supprimer ce cours ?")) remove(course.id, `/api/courses/${course.id}`); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Nouveau cours</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nom du cours</Label>
                <Input placeholder="Ex: Recherche Operationnelle" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
              </div>
              <div className="space-y-2"><Label>Code</Label>
                <Input placeholder="Ex: RO-501" value={form.code} onChange={(e) => updateForm("code", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Filiere</Label>
                <Select value={form.programId} onValueChange={(v) => { updateForm("programId", v); updateForm("groupIds", []); }}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Professeur</Label>
                <Select value={form.professorId} onValueChange={(v) => updateForm("professorId", v)}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{professors.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Semestre</Label>
                <Select value={form.semester} onValueChange={(v) => updateForm("semester", v)}>
                  <SelectTrigger><SelectValue placeholder="S" /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,7,8,9,10].map((s) => (
                    <SelectItem key={s} value={s.toString()}>S{s}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Annee</Label>
                <Input value={form.academicYear} onChange={(e) => updateForm("academicYear", e.target.value)} required />
              </div>
              <div className="space-y-2"><Label>Heures totales</Label>
                <Input type="number" placeholder="Optionnel" value={form.totalHours} onChange={(e) => updateForm("totalHours", e.target.value)} />
              </div>
            </div>
            {form.programId && filteredGroups.length > 0 && (
              <div className="space-y-2">
                <Label>Groupes concernes</Label>
                <div className="flex flex-wrap gap-2">
                  {filteredGroups.map((g) => (
                    <button key={g.id} type="button"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                        form.groupIds.includes(g.id)
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                      onClick={() => toggleGroup(g.id)}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting || !form.programId || !form.professorId || !form.semester}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
