import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    firstName: string;
    lastName: string;
    professorId: string | null;
    studentId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      firstName: string;
      lastName: string;
      professorId: string | null;
      studentId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    firstName: string;
    lastName: string;
    professorId: string | null;
    studentId: string | null;
  }
}
