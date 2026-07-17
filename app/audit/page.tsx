import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { Activity } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Audit Logs | GPMS',
};

export default async function AuditPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only Admins and SuperAdmins can view Audit Logs
  if (session.user.role === 'Volunteer') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                System Audit Logs
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <AuditLogTable />
        </div>
      </main>
    </div>
  );
}
