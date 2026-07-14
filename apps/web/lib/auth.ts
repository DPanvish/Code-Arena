import { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "../../../packages/db/index"; 
import bcrypt from "bcryptjs";

const SUPERUSER_EMAIL = process.env.SUPERUSER_EMAIL;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: { 
    signIn: '/login' 
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;
        
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        
        if (!isValid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          ratingTier: user.ratingTier ?? undefined,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (SUPERUSER_EMAIL && user.email === SUPERUSER_EMAIL) {
        try {
          await prisma.user.update({
            where: { email: SUPERUSER_EMAIL },
            data: { role: "ADMIN" }
          });
          (user as any).role = "ADMIN";
          console.log(`👑 Superuser privileges granted to ${SUPERUSER_EMAIL}`);
        } catch (error) {
          console.error("Superuser promotion error:", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = String(user.id);
        token.role = (user as any).role;
        if ((user as any).ratingTier) {
          token.ratingTier = String((user as any).ratingTier);
        }
      }
      
      if (SUPERUSER_EMAIL && token.email === SUPERUSER_EMAIL) {
        token.role = "ADMIN";
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = String(token.id);
        (session.user as any).role = token.role as string;
        
        if (token.ratingTier) {
          (session.user as any).ratingTier = String(token.ratingTier);
        }

        if (SUPERUSER_EMAIL && session.user.email === SUPERUSER_EMAIL) {
          (session.user as any).role = "ADMIN";
        }
      }
      return session;
    }
  },
};