import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { dbConnect } from "./mongodb";
import User from "../models/User";
import { rateLimit } from "./rateLimit";

function ipFrom(req) {
  if (!req?.headers) return "unknown";
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.headers["x-real-ip"] || "unknown";
}

export function isAdminEmail(email) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email).toLowerCase());
}

export const authOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.password.length > 200) return null;
        const ip = ipFrom(req);
        const rl = rateLimit({ key: `login:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 });
        if (!rl.ok) return null;
        await dbConnect();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) {
          // Constant-time-ish: still hash to mask user-existence timing.
          await bcrypt.compare(credentials.password, "$2a$12$invalidsaltinvalidsaltinvCXXXXXXXXXXXXXXXXXXXXX");
          return null;
        }
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || "user",
          tokenVersion: user.tokenVersion || 0,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = (user?.email || profile?.email || "").toLowerCase();
      if (!email) return false;
      if (profile && profile.email_verified === false) return false;
      try {
        await dbConnect();
        await User.updateOne(
          { email },
          {
            $setOnInsert: {
              email,
              role: "user",
              tokenVersion: 0,
              provider: "google",
            },
            $set: {
              name: user?.name || profile?.name,
              image: user?.image || profile?.picture,
            },
          },
          { upsert: true }
        );
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.email = user.email;
        token.role = user.role;
        token.tokenVersion = user.tokenVersion || 0;
        token.checkedAt = Date.now();
      }

      // Recheck DB at most once per minute, or immediately on session update.
      // Without this the JWT callback fires on every request and hammers Mongo.
      const STALE_MS = 60 * 1000;
      const fresh = token.checkedAt && Date.now() - token.checkedAt < STALE_MS;
      if (token.email && (!fresh || trigger === "update")) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email })
            .select("role tokenVersion")
            .lean();
          if (!dbUser) {
            token.invalid = true;
          } else if ((dbUser.tokenVersion || 0) !== (token.tokenVersion || 0)) {
            token.invalid = true;
          } else {
            token.role = isAdminEmail(token.email) ? "admin" : dbUser.role || "user";
            token.checkedAt = Date.now();
          }
        } catch {
          // If DB is down, keep the existing role rather than locking everyone out.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.invalid) return { ...session, user: null, expires: new Date(0).toISOString() };
      if (session.user) {
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
