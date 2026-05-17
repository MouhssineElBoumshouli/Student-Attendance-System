import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

type AuthOk = { session: Session };
type AuthError = { error: NextResponse };

/**
 * Returns the session if the request is authenticated, otherwise an
 * error response ready to be returned from the route handler.
 *
 *   const auth = await requireApiAuth();
 *   if ("error" in auth) return auth.error;
 *   // use auth.session
 */
export async function requireApiAuth(): Promise<AuthOk | AuthError> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  return { session };
}

export async function requireApiRole(
  roles: string[]
): Promise<AuthOk | AuthError> {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth;
  if (!roles.includes(auth.session.user.role)) {
    return {
      error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
    };
  }
  return auth;
}
