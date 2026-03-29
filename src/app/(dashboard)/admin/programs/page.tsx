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
import { Plus, Trash2, Layers, Loader2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  department: Department;
  _count: { groups: number; courses: number };
}

export default function ProgramsPage() {
  const { data, loading, dialogOpen, setDialogOpen, create, remove } =
    useCrud<Program>("/api/programs");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await create({ name, code, departmentId });
    if (ok) { setName(""); setCode(""); setDepartmentId(""); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filieres</h1>
          <p className="text-gray-500 mt-1">Gerez les filieres et programmes d&apos;etudes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Layers className="h-12 w-12 mb-4 text-gray-300" />
            <p className="font-medium">Aucune filiere</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((program) => (
            <Card key={program.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-500">{program.code}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                    onClick={() => { if (confirm("Supprimer cette filiere ?")) remove(program.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{program.department.code}</Badge>
                  <span className="text-sm text-gray-500">
                    {program._count.groups} groupe{program._count.groups !== 1 ? "s" : ""} &middot; {program._count.courses} cours
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle filiere</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input placeholder="Ex: Genie Informatique" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input placeholder="Ex: GI" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Departement</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Choisir un departement" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting || !departmentId}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
