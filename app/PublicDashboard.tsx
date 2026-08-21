'use client';

import { useEffect, useState } from 'react';
import { motion, animate, Variants, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { socialLinks } from '@/lib/public-page-config';

// ─── Types ───────────────────────────────────────────────────
interface PublicDashboardData {
  committeeName: string;
  year: string;
  totalCollection: number;
  totalExpense: number;
  balance: number;
  youtubeLiveUrl?: string;
  announcement?: { text: string; date: string } | null;
}

// ─── Animated Counter ────────────────────────────────────────
function AnimatedCounter({
  value,
  prefix = '',
  delay = 0,
  className = '',
}: {
  value: number;
  prefix?: string;
  delay?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2.5,
      ease: [0.16, 1, 0.3, 1],
      delay,
      onUpdate: (v) =>
        setDisplay(new Intl.NumberFormat('en-IN').format(Math.round(v))),
    });
    return () => controls.stop();
  }, [value, delay]);

  return (
    <span className={className}>
      {prefix}
      {display}
    </span>
  );
}

// ─── Floating Particles ──────────────────────────────────────
function Particles() {
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<
    {
      id: number;
      left: string;
      size: number;
      duration: number;
      delay: number;
      xOffsets: string[];
    }[]
  >([]);
  useEffect(() => {
    if (shouldReduceMotion) return;
    setParticles(
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1.5,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 10,
        xOffsets: [
          '0px',
          `${Math.random() * 100 - 50}px`,
          `${Math.random() * 100 - 50}px`,
        ],
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bottom-[-20px] rounded-full bg-[#F59E0B]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            boxShadow: '0 0 10px 2px rgba(245, 158, 11, 0.6)',
          }}
          animate={{
            y: ['0vh', '-120vh'],
            x: p.xOffsets,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ─── Mandala Background ──────────────────────────────────────
function MandalaBackground() {
  return (
    <motion.div
      className="absolute top-[10%] left-1/2 -ml-[500px] w-[1000px] h-[1000px] pointer-events-none opacity-[0.04] z-0 flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
    >
      <svg
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <circle
          cx="500"
          cy="500"
          r="450"
          stroke="#F0B84D"
          strokeWidth="2"
          strokeDasharray="10 15"
        />
        <circle cx="500" cy="500" r="350" stroke="#F0B84D" strokeWidth="1" />
        <circle
          cx="500"
          cy="500"
          r="250"
          stroke="#F0B84D"
          strokeWidth="2"
          strokeDasharray="4 8"
        />
        <circle cx="500" cy="500" r="150" stroke="#F0B84D" strokeWidth="1" />
        <circle cx="500" cy="500" r="50" stroke="#F0B84D" strokeWidth="1" />
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 30} 500 500)`}>
            <path
              d="M 500 50 L 520 250 L 480 250 Z"
              stroke="#F0B84D"
              strokeWidth="1"
            />
          </g>
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <circle
            key={`c-${i}`}
            cx="500"
            cy="300"
            r="40"
            transform={`rotate(${i * 45} 500 500)`}
            stroke="#F0B84D"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <polygon
            key={`p-${i}`}
            points="500,150 530,220 470,220"
            transform={`rotate(${i * 60 + 30} 500 500)`}
            stroke="#F0B84D"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ─── Temple Illustration (SVG) ───────────────────────────────
function TempleIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main dome */}
      <path
        d="M100 10 L60 70 L140 70 Z"
        stroke="#D4A353"
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Kalash on top */}
      <circle
        cx="100"
        cy="10"
        r="6"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M97 4 L100 0 L103 4"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Side domes */}
      <path
        d="M55 50 L35 85 L75 85 Z"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M145 50 L125 85 L165 85 Z"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Main body */}
      <rect
        x="40"
        y="70"
        width="120"
        height="90"
        stroke="#D4A353"
        strokeWidth="1.5"
        opacity="0.5"
        rx="2"
      />
      {/* Pillars */}
      <line
        x1="60"
        y1="70"
        x2="60"
        y2="160"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.4"
      />
      <line
        x1="80"
        y1="70"
        x2="80"
        y2="160"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="120"
        y1="70"
        x2="120"
        y2="160"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="140"
        y1="70"
        x2="140"
        y2="160"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Door */}
      <path
        d="M85 160 L85 120 Q100 105 115 120 L115 160"
        stroke="#D4A353"
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Steps */}
      <rect
        x="30"
        y="160"
        width="140"
        height="8"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.4"
        rx="1"
      />
      <rect
        x="20"
        y="168"
        width="160"
        height="8"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.3"
        rx="1"
      />
      <rect
        x="10"
        y="176"
        width="180"
        height="8"
        stroke="#D4A353"
        strokeWidth="1"
        opacity="0.25"
        rx="1"
      />
      {/* Decorative arches */}
      <path
        d="M60 85 Q70 75 80 85"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <path
        d="M120 85 Q130 75 140 85"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
      {/* Small kalash accents */}
      <circle
        cx="55"
        cy="48"
        r="3"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <circle
        cx="145"
        cy="48"
        r="3"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
      {/* Flags */}
      <line
        x1="40"
        y1="70"
        x2="40"
        y2="55"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <path
        d="M40 55 L50 58 L40 61"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <line
        x1="160"
        y1="70"
        x2="160"
        y2="55"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
      <path
        d="M160 55 L170 58 L160 61"
        stroke="#D4A353"
        strokeWidth="0.8"
        opacity="0.3"
      />
    </svg>
  );
}

// ─── Section Divider ─────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 my-6 sm:my-8">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#D4A353]/30" />
      <div className="flex flex-col items-center gap-1">
        <span
          className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-[#D4A353] uppercase"
          style={{ fontFamily: 'var(--font-dm-mono)' }}
        >
          {label}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" className="opacity-40">
          <path d="M12 2l3 7h7l-6 5 2 7-6-5-6 5 2-7-6-5h7z" fill="#D4A353" />
        </svg>
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#D4A353]/30" />
    </div>
  );
}

// ─── Live Stream Badge ───────────────────────────────────────
function LiveStreamBadge({ hasUrl }: { hasUrl: boolean }) {
  if (hasUrl) {
    return (
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2 bg-[#D4A353]/90 backdrop-blur-sm text-[#0C0918] text-[11px] sm:text-[12px] font-bold tracking-[0.12em] uppercase px-3 py-1.5 rounded-lg shadow-lg">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
          <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
        LIVE DARSHAN
      </div>
    );
  }

  return (
    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/70 text-[11px] sm:text-[12px] font-bold tracking-[0.12em] uppercase px-3 py-1.5 rounded-lg shadow-lg">
      LIVE STREAM
    </div>
  );
}

// ─── YouTube Play Button ─────────────────────────────────────
function YouTubePlayButton() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        className="w-[60px] h-[42px] sm:w-[68px] sm:h-[48px] bg-red-600 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(255,0,0,0.4)] cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className="w-6 h-6 sm:w-7 sm:h-7 ml-1"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC DASHBOARD — MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function PublicDashboard() {
  const [dashData, setDashData] = useState<PublicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/public');
      const json = await res.json();

      if (!res.ok) {
        // Server already retried; surface a clean message
        setError(json.message || 'Could not load dashboard — please try again');
        return;
      }

      if (json.success && json.data) {
        const d = json.data as Partial<PublicDashboardData>;
        // Validate that the required numeric fields are present
        if (
          typeof d.totalCollection === 'number' &&
          typeof d.totalExpense === 'number' &&
          typeof d.balance === 'number'
        ) {
          setDashData(json.data as PublicDashboardData);
        } else {
          // success:true but data is structurally incomplete — treat as error
          console.error(
            '[GPMS Dashboard] Malformed data shape from backend',
            json.data
          );
          setError('Could not load dashboard — please try again');
        }
      } else {
        // Log the machine-readable code for debugging without exposing it to users
        if (json.code) {
          console.error('[GPMS Dashboard] Backend error code:', json.code);
        }
        setError(json.message || 'Could not load dashboard');
      }
    } catch {
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { stiffness: 90, damping: 20 },
    },
  };

  const activeSocials = Object.entries(socialLinks).filter(
    ([, url]) => url.trim() !== ''
  );

  return (
    <div
      className="min-h-screen bg-[#0C0918] flex flex-col text-white relative overflow-hidden"
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] max-w-4xl h-[600px] bg-[radial-gradient(ellipse_at_top,_rgba(85,45,115,0.4),_transparent_70%)] pointer-events-none z-0" />
      <MandalaBackground />
      <Particles />

      {/* Content container — mobile-first, widens on desktop */}
      <div className="relative z-10 flex flex-col flex-1 h-full max-w-lg lg:max-w-3xl mx-auto w-full px-4 sm:px-5 lg:px-8">
        {/* ─── HEADER ─────────────────────────────────────── */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex items-center justify-between py-4 sm:py-5 lg:py-6 relative z-20 border-b border-[#D4A353]/10"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Pulsing seal logo */}
            <div className="relative w-[48px] h-[48px] sm:w-[54px] sm:h-[54px] rounded-full border-[1.5px] border-[#D4A353]/50 flex items-center justify-center bg-[#0C0918] overflow-hidden">
              <motion.div
                className="absolute inset-[-4px] border border-[#D4A353]/20 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <Image
                src="/seal.svg"
                alt=""
                width={40}
                height={40}
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span
                className="font-bold text-[20px] sm:text-[22px] text-[#E5B560] tracking-[0.08em] leading-tight"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                GPMS
              </span>
              <span
                className="text-[7px] sm:text-[8px] text-[#B88636]/80 tracking-[0.12em] uppercase font-medium leading-tight"
                style={{ fontFamily: 'var(--font-dm-mono)' }}
              >
                GANESH PUJA MANAGEMENT SYSTEM
              </span>
            </div>
          </div>

          <a
            href="/login"
            className="group relative overflow-hidden text-[12px] sm:text-[13px] font-bold text-[#E5B560] flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#E5B560]/30 bg-[#E5B560]/5 hover:bg-[#E5B560]/10 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B560]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            Login
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <path d="M15 3h4v18h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </a>
        </motion.header>

        {/* ─── MAIN CONTENT ───────────────────────────────── */}
        <main className="flex-1 flex flex-col pb-6 sm:pb-8">
          {loading ? (
            <div className="p-5 space-y-6 animate-pulse mt-8">
              <div className="space-y-3 text-center">
                <div className="h-5 w-40 bg-white/5 rounded mx-auto" />
                <div className="h-16 w-48 bg-white/5 rounded-lg mx-auto" />
                <div className="h-4 w-56 bg-white/5 rounded mx-auto" />
              </div>
              <div className="h-52 bg-white/5 rounded-2xl mt-6" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
              </div>
            </div>
          ) : error ? (
            <div className="mt-8 bg-red-900/20 border border-red-900/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 font-medium mb-3">{error}</p>
              <button
                onClick={fetchData}
                className="text-[12px] font-bold text-[#E5B560] border border-[#E5B560]/30 px-4 py-2 rounded-full hover:bg-[#E5B560]/10 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : dashData ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* ─── HERO SECTION ───────────────────────── */}
              <motion.div
                variants={itemVariants}
                className="pt-6 sm:pt-8 lg:pt-10 text-center"
              >
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
                  <div className="h-[1px] bg-gradient-to-r from-transparent to-[#B88636]/40 w-8 sm:w-12" />
                  <div className="flex items-center gap-2">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="#D4A353"
                      opacity="0.6"
                    >
                      <path d="M12 2l3 7h7l-6 5 2 7-6-5-6 5 2-7-6-5h7z" />
                    </svg>
                    <p
                      className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-[#B88636] uppercase"
                      style={{ fontFamily: 'var(--font-dm-mono)' }}
                    >
                      Our committee
                    </p>
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="#D4A353"
                      opacity="0.6"
                    >
                      <path d="M12 2l3 7h7l-6 5 2 7-6-5-6 5 2-7-6-5h7z" />
                    </svg>
                  </div>
                  <div className="h-[1px] bg-gradient-to-l from-transparent to-[#B88636]/40 w-8 sm:w-12" />
                </div>

                <motion.h1
                  className="font-bold text-[56px] sm:text-[68px] lg:text-[80px] leading-tight bg-clip-text text-transparent bg-gradient-to-r from-[#D4A353] via-[#FFF3D4] to-[#D4A353] bg-[length:200%_auto]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                  animate={{
                    backgroundPosition: ['200% center', '-200% center'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  {dashData.year}
                </motion.h1>

                <p
                  className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] text-[#B88636] uppercase"
                  style={{ fontFamily: 'var(--font-dm-mono)' }}
                >
                  Financial transparency
                </p>
                <p className="text-[12px] sm:text-[13px] text-[#A29EAB]/70 mt-2 font-medium">
                  Building trust through clarity and accountability.
                </p>
              </motion.div>

              {/* ─── LIVE STREAM SECTION ─────────────────── */}
              <motion.div variants={itemVariants} className="mt-6 sm:mt-8">
                <a
                  href={dashData.youtubeLiveUrl || socialLinks.youtube || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative rounded-2xl overflow-hidden border border-[#D4A353]/25 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.7)] group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] sm:aspect-video bg-[#16102A] overflow-hidden">
                    <Image
                      src="/ganesh-darshan.jpg"
                      alt=""
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {/* Graceful fallback gradient if image fails */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2D1B4E] via-[#1A0F2E] to-[#0C0918] -z-10" />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0918]/70 via-[#0C0918]/15 to-transparent" />

                    {/* Status badge */}
                    <LiveStreamBadge hasUrl={!!dashData.youtubeLiveUrl} />

                    {/* Play button */}
                    <YouTubePlayButton />
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center justify-between bg-[#16102A]/95 backdrop-blur-md px-4 py-3 border-t border-[#D4A353]/10">
                    <div className="flex items-center gap-2.5">
                      {/* YouTube icon */}
                      <svg
                        viewBox="0 0 24 24"
                        className="w-[20px] h-[20px]"
                        fill="none"
                      >
                        <rect width="24" height="24" rx="4" fill="#FF0000" />
                        <path d="M10 8.5v7l6-3.5-6-3.5z" fill="white" />
                      </svg>
                      <span className="text-[12px] sm:text-[13px] font-medium text-white/80">
                        Watch Live on YouTube
                      </span>
                    </div>
                    {/* External link icon */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#A29EAB"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-50 group-hover:opacity-100 transition-opacity"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                </a>
              </motion.div>

              {/* ─── ANNOUNCEMENT SECTION ────────────────── */}
              {dashData?.announcement && (
                <motion.div
                  variants={itemVariants}
                  className="mt-5 sm:mt-6 bg-[#16102A] border border-[#D4A353]/15 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-lg"
                >
                  {/* Bell icon */}
                  <div className="w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] rounded-full bg-[#D4A353]/10 flex items-center justify-center shrink-0 border border-[#D4A353]/15">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D4A353"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#D4A353] uppercase mb-1"
                      style={{ fontFamily: 'var(--font-dm-mono)' }}
                    >
                      Update
                    </p>
                    <p className="text-[13px] sm:text-[14px] text-white/85 font-medium leading-snug">
                      {dashData.announcement.text}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 shrink-0 text-[#A29EAB]/60">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {dashData.announcement.date && (
                      <span className="text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
                        {dashData.announcement.date}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─── FINANCIAL OVERVIEW ──────────────────── */}
              <motion.div variants={itemVariants}>
                <SectionDivider label="Financial Overview" />

                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  {/* Total Donations Card */}
                  <div className="bg-[#16102A] border border-emerald-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(16,185,129,0.08),_transparent_60%)] pointer-events-none" />

                    {/* Icon */}
                    <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 sm:mb-3 border border-emerald-500/15">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="sm:w-[18px] sm:h-[18px]"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>

                    <p
                      className="text-[8px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-emerald-400 uppercase mb-0.5 sm:mb-1"
                      style={{ fontFamily: 'var(--font-dm-mono)' }}
                    >
                      Total Donations
                    </p>

                    <div
                      className="font-bold text-[22px] sm:text-[28px] text-white relative z-10 tracking-tight"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      <span
                        className="text-[16px] sm:text-[20px] mr-0.5 opacity-80"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        ₹
                      </span>
                      <AnimatedCounter
                        value={dashData.totalCollection}
                        delay={0.4}
                      />
                    </div>

                    <div className="h-[1px] bg-emerald-500/15 my-2 sm:my-2.5" />
                    <p className="text-[9px] sm:text-[11px] text-[#A29EAB]/70 font-medium">
                      Thank you for your generosity!
                    </p>
                  </div>

                  {/* Total Expenses Card */}
                  <div className="bg-[#16102A] border border-[#D4A353]/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,_rgba(212,163,83,0.08),_transparent_60%)] pointer-events-none" />

                    {/* Icon */}
                    <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#D4A353]/10 flex items-center justify-center mb-2 sm:mb-3 border border-[#D4A353]/15">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#D4A353"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="sm:w-[18px] sm:h-[18px]"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>

                    <p
                      className="text-[8px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-[#D4A353] uppercase mb-0.5 sm:mb-1"
                      style={{ fontFamily: 'var(--font-dm-mono)' }}
                    >
                      Total Expenses
                    </p>

                    <div
                      className="font-bold text-[22px] sm:text-[28px] text-white relative z-10 tracking-tight"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      <span
                        className="text-[16px] sm:text-[20px] mr-0.5 opacity-80"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        ₹
                      </span>
                      <AnimatedCounter
                        value={dashData.totalExpense}
                        delay={0.6}
                      />
                    </div>

                    <div className="h-[1px] bg-[#D4A353]/15 my-2 sm:my-2.5" />
                    <p className="text-[9px] sm:text-[11px] text-[#A29EAB]/70 font-medium">
                      Every expense is recorded.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* ─── TRANSPARENCY NOTICE ─────────────────── */}
              <motion.div
                variants={itemVariants}
                className="mt-5 sm:mt-6 bg-[#16102A] border border-[#D4A353]/25 rounded-2xl p-5 sm:p-6 flex items-center gap-3 sm:gap-4 shadow-lg relative overflow-hidden"
              >
                {/* Shield icon */}
                <div className="w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] rounded-full bg-[#D4A353]/15 flex items-center justify-center shrink-0 border border-[#D4A353]/25 relative z-10">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D4A353"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex-1 relative z-10">
                  <p className="text-[12px] sm:text-[13px] text-white/95 leading-[1.6] font-semibold">
                    All funds are managed by the organizing committee.
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-[#A29EAB]/80 leading-[1.6] font-medium mt-1">
                    Donations and expenses are tracked digitally for full
                    transparency.
                  </p>
                </div>
                {/* Temple illustration */}
                <TempleIllustration className="w-[80px] sm:w-[100px] h-auto shrink-0 opacity-70" />
              </motion.div>
            </motion.div>
          ) : null}

          {/* ─── FOOTER ───────────────────────────────────── */}
          <div className="mt-auto pt-10 sm:pt-14 pb-6 sm:pb-8 relative z-10">
            {/* Divider */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-[#D4A353]/20 to-transparent mb-6" />

            <div className="flex items-end justify-between">
              {/* Social links */}
              {activeSocials.length > 0 && (
                <div>
                  <p
                    className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] text-[#A29EAB]/80 uppercase mb-3"
                    style={{ fontFamily: 'var(--font-dm-mono)' }}
                  >
                    Follow us
                  </p>
                  <div className="flex items-center gap-2.5">
                    {activeSocials.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        aria-label={platform}
                        style={{
                          background:
                            platform === 'youtube'
                              ? '#FF0000'
                              : platform === 'instagram'
                                ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
                                : '#1877F2',
                        }}
                      >
                        {platform === 'youtube' && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="white"
                            className="w-[15px] h-[15px]"
                          >
                            <path d="M10 8.5v7l6-3.5-6-3.5z" />
                          </svg>
                        )}
                        {platform === 'instagram' && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            className="w-[15px] h-[15px]"
                          >
                            <rect x="2" y="2" width="20" height="20" rx="5" />
                            <circle cx="12" cy="12" r="5" />
                            <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
                          </svg>
                        )}
                        {platform === 'facebook' && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="white"
                            className="w-[15px] h-[15px]"
                          >
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                          </svg>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Built by TechGenDM */}
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p
                    className="text-[8px] sm:text-[9px] font-bold tracking-[0.15em] text-[#D4A353] uppercase"
                    style={{ fontFamily: 'var(--font-dm-mono)' }}
                  >
                    Built by TechGenDM
                  </p>
                  <p
                    className="text-[6.5px] sm:text-[7px] tracking-[0.1em] text-[#B88636]/70 uppercase font-medium"
                    style={{ fontFamily: 'var(--font-dm-mono)' }}
                  >
                    Software Developer
                  </p>
                </div>
                <div className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-full border border-[#D4A353]/40 flex items-center justify-center bg-[#0C0918] overflow-hidden">
                  <img
                    src="/seal.svg"
                    alt=""
                    className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
