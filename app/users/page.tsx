import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserManagement } from '@/components/user/UserManagement';
import { Users } from 'lucide-react';

export default async function UsersPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role;
  if (role !== 'SuperAdmin' && role !== 'Admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Users className="w-6 h-6 text-slate-700" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <UserManagement currentUserRole={role} />
      </main>
    </div>
  );
}
