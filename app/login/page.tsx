import React from 'react';
import Image from 'next/image';
import { signIn } from '@/auth';
import { AlertCircle } from 'lucide-react';
import sealLogo from '@/public/seal.png';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error as string | undefined;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-ink"
         style={{
           background: `radial-gradient(circle at 30% 24%, var(--color-ink-glow), transparent 55%), radial-gradient(circle at 75% 80%, #241736, transparent 50%), var(--color-ink)`
         }}>
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 opacity-[0.18]"
           style={{
             backgroundImage: 'radial-gradient(rgba(240,184,77,.3) 1px, transparent 1px)',
             backgroundSize: '18px 18px'
           }} 
      />

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Seal and glow */}
        <div className="relative z-10 mb-6">
          <div className="absolute -inset-8 rounded-full -z-10"
               style={{ background: 'radial-gradient(circle, rgba(240,184,77,.28), transparent 70%)' }} />
          <Image
            src={sealLogo}
            alt="GPMS Seal"
            width={96}
            height={96}
            className="rounded-full border-[2.5px] border-gold drop-shadow-md"
          />
        </div>

        {/* Titles */}
        <h1 className="font-playfair font-bold text-3xl relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-gold-soft to-ember">
          Ganesh Puja
        </h1>
        <p className="text-xs tracking-[0.1em] uppercase text-[#CBBBD8] mt-2 relative z-10">
          Management system (GPMS)
        </p>

        {/* Alerts */}
        {error === 'AccessDenied' && (
          <div className="w-full mt-6 bg-[#F4E9EB] border border-maroon/20 rounded-xl p-4 text-left shadow-sm backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-2 mb-2 text-maroon font-semibold text-[14px]">
              <AlertCircle className="w-5 h-5" />
              <p>Access Denied</p>
            </div>
            <p className="text-[13px] text-maroon/80 leading-relaxed mb-2 font-bold">
              This Google account is not authorized to access the GPMS management system.
            </p>
            <p className="text-[13px] text-maroon/80 leading-relaxed font-bold">
              Please contact a GPMS administrator to have your account added.
            </p>
          </div>
        )}

        {error && error !== 'AccessDenied' && (
          <div className="w-full mt-6 bg-[#F4E9EB] border border-maroon/20 rounded-xl p-4 text-left shadow-sm backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-2 mb-2 text-maroon font-semibold text-[14px]">
              <AlertCircle className="w-5 h-5" />
              <p>Authentication Error</p>
            </div>
            <p className="text-[13px] text-maroon/80 font-bold">
              There was a problem signing you in. Please try again or use a different account.
            </p>
          </div>
        )}

        {/* Login Card */}
        <div className="w-full bg-cream rounded-[20px] p-[26px_22px] mt-[30px] border border-[rgba(240,184,77,.4)] relative z-10 shadow-xl">
          <h4 className="font-playfair text-base font-bold text-ink mb-4">
            Committee member login
          </h4>
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/dashboard' });
            }}
          >
            <button
              type="submit"
              className="w-full bg-white border border-[#DDD8CC] rounded-xl py-3 flex items-center justify-center gap-2.5 font-semibold text-sm text-[#3a3540] hover:bg-slate-50 transition-colors active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.6 9.2c0-.6-.05-1.2-.15-1.75H9v3.3h4.8a4.1 4.1 0 0 1-1.78 2.7v2.2h2.88C16.5 14 17.6 11.85 17.6 9.2z"/>
                <path fill="#34A853" d="M9 18c2.4 0 4.42-.8 5.9-2.15l-2.88-2.2c-.8.55-1.83.87-3.02.87-2.32 0-4.28-1.57-4.98-3.68H1.05v2.3A9 9 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M4.02 10.84A5.4 5.4 0 0 1 3.74 9c0-.64.11-1.26.28-1.84V4.86H1.05A9 9 0 0 0 0 9c0 1.45.35 2.83 1.05 4.14l3-2.3z"/>
                <path fill="#EA4335" d="M9 3.58c1.3 0 2.48.45 3.4 1.32l2.55-2.55C13.4.9 11.4 0 9 0A9 9 0 0 0 1.05 4.86l3 2.3C4.72 5.05 6.68 3.58 9 3.58z"/>
              </svg>
              Sign in with Google
            </button>
          </form>
          <div className="text-[11px] text-muted-ink mt-4 leading-[1.6]">
            Authorized volunteers only. By signing in, you agree to the committee's data policies.
          </div>
        </div>
      </div>
    </div>
  );
}
