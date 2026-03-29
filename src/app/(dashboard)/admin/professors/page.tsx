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
import { Plus, Trash2, GraduationCap, Loader2 } from "lucide-react";

interface Department { id: string; name: string; code: string }
interface Professor {
  id: string; employeeId: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  _count: { courses: number };
}

export default function ProfessorsPage() {
  const { data, loading, dialogOpen, setDialogOpen, create, remove } =
    useCrud<Professor>("/api/professors");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", employeeId: "", departmentId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
  }, []);

  const updateForm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await create(form);
    if (ok) setForm({ firstName: "", lastName: "", email: "", employeeId: "", departmentId: "" });
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Professeurs</h1>
          <p className="text-gray-500 mt-1">Gerez les comptes des professeurs</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : data.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <GraduationCap className="h-12 w-12 mb-4 text-gray-300" /><p className="font-medium">Aucun professeur</p>
        </CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nom</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Matricule</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Cours</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((prof) => (
                <tr key={prof.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                        {prof.user.firstName[0]}{prof.user.lastName[0]}
                      </div>
                      <span className="font-medium text-gray-900">{prof.user.firstName} {prof.user.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{prof.user.email}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{prof.employeeId}</Badge></td>
                  <td className="py-3 px-4">{prof._count.courses} cours</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600"
                      onClick={() => { if (confirm("Supprimer ce professeur ?")) remove(prof.id); }}>
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
          <DialogHeader><DialogTitle>Nouveau professeur</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="prenom.nom@ueuromed.org" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input placeholder="Ex: PROF-004" value={form.employeeId} onChange={(e) => updateForm("employeeId", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Departement</Label>
                <Select value={form.departmentId} onValueChange={(v) => updateForm("departmentId", v)}>
                  <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
