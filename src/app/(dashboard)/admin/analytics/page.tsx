"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytiques</h1>
        <p className="text-gray-500 mt-1">Statistiques de presence a l&apos;echelle de l&apos;universite</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord analytique</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <BarChart3 className="h-16 w-16 mb-4 text-gray-300" />
          <p className="font-medium text-lg">Bientot disponible</p>
          <p className="text-sm mt-1">Les analytiques seront disponibles une fois des seances creees</p>
        </CardContent>
      </Card>
    </div>
  );
}
