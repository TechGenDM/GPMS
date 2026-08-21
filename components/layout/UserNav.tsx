import React from 'react';
import { auth, signOut } from '@/auth';
import { LogOut } from 'lucide-react';
import { cookies } from 'next/headers';
import { en } from '@/translations/en';
import { hi } from '@/translations/hi';

export async function UserNav() {
  const session = await auth();

  if (!session?.user) return null;

  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const dict = locale === 'hi' ? hi : en;

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-[14px] font-bold text-ink leading-tight">
          {session.user.name || session.user.email}
        </span>
        <span className="text-[12px] font-bold text-muted-ink bg-hair/50 px-2 py-0.5 rounded-full mt-0.5">
          {session.user.role || dict.dashboard.volunteer}
        </span>
      </div>

      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}
      >
        <button
          type="submit"
          className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-[14px] font-bold text-ink bg-white border border-hair rounded-[12px] hover:bg-cream transition-colors shadow-sm"
          title={dict.dashboard.signOut}
        >
          <LogOut className="h-4 w-4 sm:mr-2 text-muted-ink" />
          <span className="hidden sm:inline">{dict.dashboard.signOut}</span>
        </button>
      </form>
    </div>
  );
}
