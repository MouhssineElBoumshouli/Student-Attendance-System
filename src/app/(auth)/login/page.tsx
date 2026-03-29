import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { QrCode } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20 mb-2">
          <QrCode className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          UEMF Presence
        </h1>
        <p className="text-sm text-gray-500">
          Systeme de gestion des presences
        </p>
      </div>

      {/* Login Card */}
      <Card className="shadow-lg border-gray-200/80">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte universitaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400">
        Universite Euro-Mediterraneenne de Fes
      </p>
    </div>
  );
}
