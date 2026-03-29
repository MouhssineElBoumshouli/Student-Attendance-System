import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireProfessor() {
  return requireRole(["PROFESSOR"]);
}

export async function requireStudent() {
  return requireRole(["STUDENT"]);
}
