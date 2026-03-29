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
import { Plus, Trash2, Users, Loader2, Search } from "lucide-react";

interface Group { id: string; name: string; program: { code: string } }
interface Student {
  id: string; studentId: string; enrollmentYear: number;
  user: { id: string; email: string; firstName: string; lastName: string };
  groups: { group: Group }[];
}

export default function StudentsPage() {
  const { data, loading, dialogOpen, setDialogOpen, create, remove } =
    useCrud<Student>("/api/students");

  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", studentId: "", enrollmentYear: new Date().getFullYear().toString(), groupId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then(setGroups);
  }, []);

  const updateForm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await create(form);
    if (ok) setForm({ firstName: "", lastName: "", email: "", studentId: "", enrollmentYear: new Date().getFullYear().toString(), groupId: "" });
    setSubmitting(false);
  };

  const filtered = data.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.user.firstName.toLowerCase().includes(q) ||
      s.user.lastName.toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etudiants</h1>
          <p className="text-gray-500 mt-1">{data.length} etudiant{data.length !== 1 ? "s" : ""} inscrits</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un etudiant..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Users className="h-12 w-12 mb-4 text-gray-300" />
          <p className="font-medium">{search ? "Aucun resultat" : "Aucun etudiant"}</p>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nom</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">N° etudiant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Groupe</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                        {student.user.firstName[0]}{student.user.lastName[0]}
                      </div>
                      <span className="font-medium text-gray-900">{student.user.firstName} {student.user.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{student.user.email}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{student.studentId}</Badge></td>
                  <td className="py-3 px-4">
                    {student.groups.map((sg) => (
                      <Badge key={sg.group.id} variant="secondary" className="mr-1">{sg.group.name}</Badge>
                    ))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600"
                      onClick={() => { if (confirm("Supprimer cet etudiant ?")) remove(student.id); }}>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvel etudiant</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Prenom</Label>
                <Input value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2"><Label>Nom</Label>
                <Input value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2"><Label>Email</Label>
              <Input type="email" placeholder="prenom.nom@ueuromed.org" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>N° etudiant</Label>
                <Input placeholder="Ex: STU-021" value={form.studentId} onChange={(e) => updateForm("studentId", e.target.value)} required />
              </div>
              <div className="space-y-2"><Label>Annee d&apos;inscription</Label>
                <Input type="number" value={form.enrollmentYear} onChange={(e) => updateForm("enrollmentYear", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2"><Label>Groupe</Label>
              <Select value={form.groupId} onValueChange={(v) => updateForm("groupId", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir un groupe (optionnel)" /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-400">Mot de passe par defaut: uemf2024</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
