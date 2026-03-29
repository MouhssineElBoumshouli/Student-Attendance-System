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
import { Plus, Trash2, UsersRound, Loader2 } from "lucide-react";

interface Program { id: string; name: string; code: string; department: { code: string } }
interface Group {
  id: string; name: string; semester: number;
  program: Program;
  _count: { students: number };
}

export default function GroupsPage() {
  const { data, loading, dialogOpen, setDialogOpen, create, remove } =
    useCrud<Group>("/api/groups");

  const [programs, setPrograms] = useState<Program[]>([]);
  const [name, setName] = useState("");
  const [programId, setProgramId] = useState("");
  const [semester, setSemester] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/programs").then((r) => r.json()).then(setPrograms);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await create({ name, programId, semester });
    if (ok) { setName(""); setProgramId(""); setSemester(""); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groupes</h1>
          <p className="text-gray-500 mt-1">Gerez les groupes d&apos;etudiants</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : data.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <UsersRound className="h-12 w-12 mb-4 text-gray-300" /><p className="font-medium">Aucun groupe</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((group) => (
            <Card key={group.id} className="group/card hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <UsersRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">Semestre {group.semester}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"
                    className="opacity-0 group-hover/card:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                    onClick={() => { if (confirm("Supprimer ce groupe ?")) remove(group.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{group.program.code}</Badge>
                  <span className="text-sm text-gray-500">
                    {group._count.students} etudiant{group._count.students !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau groupe</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du groupe</Label>
              <Input placeholder="Ex: GI-S5-A" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Filiere</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger><SelectValue placeholder="Choisir une filiere" /></SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semestre</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue placeholder="Choisir le semestre" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                    <SelectItem key={s} value={s.toString()}>Semestre {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting || !programId || !semester}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
