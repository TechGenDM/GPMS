import React from 'react';
import { auth, signOut } from '@/auth';
import { LogOut } from 'lucide-react';

export async function UserNav() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-[14px] font-bold text-ink leading-tight">
          {session.user.name || session.user.email}
        </span>
        <span className="text-[12px] font-bold text-muted-ink bg-hair/50 px-2 py-0.5 rounded-full mt-0.5">
          {session.user.role || 'Volunteer'}
        </span>
      </div>

      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <button
          type="submit"
          className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-[14px] font-bold text-ink bg-white border border-hair rounded-[12px] hover:bg-cream transition-colors shadow-sm"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 sm:mr-2 text-muted-ink" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}
