import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserManagement } from '@/components/user/UserManagement';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-cream pb-20">
      <header className="flex items-center p-[18px_20px] bg-cream border-b border-hair sticky top-0 z-10">
        <div className="max-w-5xl mx-auto w-full flex items-center">
          <Link
            href="/dashboard"
            className="p-1 -ml-1 mr-3 text-muted-ink hover:text-ink transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-playfair font-bold text-[20px] text-ink tracking-[0.02em]">
              User Management
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-5 py-6">
        <UserManagement currentUserRole={role} />
      </main>
    </div>
  );
}
