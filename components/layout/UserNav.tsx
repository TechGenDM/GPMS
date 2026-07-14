import React from 'react';
import { auth, signOut } from '@/auth';
import { LogOut } from 'lucide-react';

export async function UserNav() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-sm font-semibold text-slate-900 leading-tight">
          {session.user.name || session.user.email}
        </span>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5">
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
          className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}
