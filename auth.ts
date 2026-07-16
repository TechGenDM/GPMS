import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      status?: string;
    };
  }

  interface User {
    role?: string;
    status?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login', // Redirect back to login on error
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // In a real app, this ensures we only allow users registered in our Google Sheets DB
      if (!user.email) return false;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL; // e.g. /api proxy or full url
        // Wait, for server-side NextAuth we need the full absolute URL of the Apps Script web app
        // Since NEXT_PUBLIC_API_URL is empty in .env.local, we assume there's a proxy in Next.js or we hit it directly
        // The project plan said Next.js API Routes proxy to Apps Script.
        // For signIn, this runs SERVER-SIDE in Next.js. We can fetch our own Next.js API or just mock it temporarily
        // Let's use the local API route

        // Ensure we have an absolute URL for server-side fetches
        const appUrl = process.env.AUTH_URL || 'http://localhost:3000';

        const response = await fetch(`${appUrl}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });

        if (!response.ok) return false;

        const data = await response.json();

        if (data.success && data.data && data.data.status === 'Active') {
          // Temporarily attach role to user object to pass to jwt
          user.role = data.data.role;
          user.status = data.data.status;
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error during signIn verification:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // User is available during sign-in
      if (user) {
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
