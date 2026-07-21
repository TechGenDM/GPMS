'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, animate, Variants } from 'motion/react';
import sealLogo from '@/public/seal.png';

interface PublicDashboardData {
  committeeName: string;
  year: string;
  totalCollection: number;
  totalExpense: number;
  balance: number;
}

function AnimatedCounter({ value, prefix = '', delay = 0, className = '' }: { value: number, prefix?: string, delay?: number, className?: string }) {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2.5,
      ease: [0.16, 1, 0.3, 1], // quartic ease-out
      delay,
      onUpdate: (v) => setDisplay(new Intl.NumberFormat('en-IN').format(Math.round(v)))
    });
    return () => controls.stop();
  }, [value, delay]);

  return <span className={className}>{prefix}{display}</span>;
}

function Particles() {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1.5,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 10,
        xOffsets: ['0px', `${Math.random() * 100 - 50}px`, `${Math.random() * 100 - 50}px`]
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute bottom-[-20px] rounded-full bg-[#F59E0B]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            boxShadow: '0 0 10px 2px rgba(245, 158, 11, 0.6)'
          }}
          animate={{
            y: ['0vh', '-120vh'],
            x: p.xOffsets
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

function MandalaBackground() {
  return (
    <motion.div 
      className="absolute top-[10%] left-1/2 -ml-[500px] w-[1000px] h-[1000px] pointer-events-none opacity-[0.04] z-0 flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
         <circle cx="500" cy="500" r="450" stroke="#F0B84D" strokeWidth="2" strokeDasharray="10 15" />
         <circle cx="500" cy="500" r="350" stroke="#F0B84D" strokeWidth="1" />
         <circle cx="500" cy="500" r="250" stroke="#F0B84D" strokeWidth="2" strokeDasharray="4 8" />
         <circle cx="500" cy="500" r="150" stroke="#F0B84D" strokeWidth="1" />
         <circle cx="500" cy="500" r="50" stroke="#F0B84D" strokeWidth="1" />
         {Array.from({length: 12}).map((_, i) => (
           <g key={i} transform={`rotate(${i * 30} 500 500)`}>
             <path d="M 500 50 L 520 250 L 480 250 Z" stroke="#F0B84D" strokeWidth="1" />
           </g>
         ))}
         {Array.from({length: 8}).map((_, i) => (
           <circle key={`c-${i}`} cx="500" cy="300" r="40" transform={`rotate(${i * 45} 500 500)`} stroke="#F0B84D" strokeWidth="1" />
         ))}
         {Array.from({length: 6}).map((_, i) => (
           <polygon key={`p-${i}`} points="500,150 530,220 470,220" transform={`rotate(${i * 60 + 30} 500 500)`} stroke="#F0B84D" strokeWidth="1.5" />
         ))}
      </svg>
    </motion.div>
  );
}

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
      if (json.success && json.data) {
        setDashData(json.data);
      } else {
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
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { stiffness: 90, damping: 20 } }
  };

  const leftSlideVariants: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { stiffness: 90, damping: 20 } }
  };

  const rightSlideVariants: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { stiffness: 90, damping: 20 } }
  };

  return (
    <div 
      className="min-h-screen bg-[#0C0918] flex flex-col text-white relative overflow-hidden"
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] max-w-4xl h-[600px] bg-[radial-gradient(ellipse_at_top,_rgba(85,45,115,0.4),_transparent_70%)] pointer-events-none z-0" />
      <MandalaBackground />
      <Particles />

      <div className="relative z-10 flex flex-col flex-1 h-full max-w-lg mx-auto w-full px-4 sm:px-5 border-x border-white/[0.02] bg-[#0C0918]/10 backdrop-blur-[2px]">
      
        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center justify-between py-5 sm:py-6 relative z-20"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full border border-[#D4A353]/30 flex items-center justify-center">
              <motion.div 
                className="absolute inset-[-4px] border border-[#D4A353]/20 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute inset-[-8px] border border-[#D4A353]/10 rounded-full"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
              <Image src={sealLogo} alt="Seal Logo" width={22} height={22} className="opacity-90" />
            </div>
            <span className="font-bold text-[15px] sm:text-[17px] tracking-[0.25em] text-[#E5B560] pl-1" style={{ fontFamily: 'var(--font-dm-mono)' }}>
              GPMS
            </span>
          </div>
          <a
            href="/login"
            className="group relative overflow-hidden text-[11px] sm:text-[12px] font-bold text-[#E5B560] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border border-[#E5B560]/20 bg-[#E5B560]/5 hover:bg-[#E5B560]/10 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B560]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <span className="hidden xs:inline">Committee</span> Login
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M15 3h4v18h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </a>
        </motion.header>

        <main className="flex-1 flex flex-col pb-8">
          {loading ? (
            <div className="p-5 space-y-6 animate-pulse mt-8">
              <div className="h-40 bg-white/5 rounded-2xl mt-8" />
            </div>
          ) : error ? (
            <div className="mt-8 bg-red-900/20 border border-red-900/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          ) : dashData ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              
              <motion.div variants={itemVariants} className="pt-6 sm:pt-8 text-center">
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
                  <div className="h-[1px] bg-gradient-to-r from-transparent to-[#B88636]/40 w-8 sm:w-12" />
                  <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-[#B88636] uppercase" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                    Our committee
                  </p>
                  <div className="h-[1px] bg-gradient-to-l from-transparent to-[#B88636]/40 w-8 sm:w-12" />
                </div>
                
                <motion.h1 
                  className="font-bold text-[52px] sm:text-[64px] leading-tight bg-clip-text text-transparent bg-gradient-to-r from-[#D4A353] via-[#FFF3D4] to-[#D4A353] bg-[length:200%_auto]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                  animate={{ backgroundPosition: ['200% center', '-200% center'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                >
                  {dashData.year}
                </motion.h1>
                <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] text-[#B88636] uppercase" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                  Financial transparency
                </p>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                transition={{ 
                  scale: { damping: 20 },
                  y: { duration: 7, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mt-8 sm:mt-10 relative p-[1.5px] rounded-2xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]"
              >
                {/* Rotating Border Gradient */}
                <motion.div 
                  className="absolute inset-[-50%] z-0"
                  style={{ background: 'conic-gradient(from 0deg, transparent 0%, #E89E28 25%, #A855F7 50%, #E89E28 75%, transparent 100%)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Card Inner */}
                <div className="relative z-10 bg-[#120C23]/95 backdrop-blur-xl rounded-[15px] p-6 sm:p-8 pb-8 sm:pb-10 text-center flex flex-col items-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(245,158,11,0.08),_transparent_70%)] pointer-events-none rounded-[15px]" />
                  
                  <div className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-[#D4A353] uppercase relative z-10 mb-3 mt-1" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                    Current balance
                  </div>

                  {dashData.balance < 0 && (
                    <div className="px-3 py-1 mb-2 bg-[#451A25]/60 border border-[#F43F5E]/30 text-[#F43F5E] rounded-full text-[9px] font-bold tracking-[0.2em] relative z-10">
                      DEFICIT
                    </div>
                  )}

                  <motion.div 
                    className="text-[44px] sm:text-[52px] font-bold relative z-10 tracking-tight flex justify-center items-center text-orange-400 mt-2"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                    animate={{ textShadow: ['0px 0px 5px rgba(249,115,22,0.1)', '0px 0px 25px rgba(249,115,22,0.7)', '0px 0px 5px rgba(249,115,22,0.1)'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {dashData.balance < 0 && <span className="mr-1">−</span>}
                    <span className="text-[34px] sm:text-[40px] mr-1" style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>₹</span>
                    <AnimatedCounter value={Math.abs(dashData.balance)} delay={0.2} />
                  </motion.div>

                  <div className="flex items-center gap-2 mt-4 opacity-70">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#D4A353"><path d="M12 2l3 7h7l-6 5 2 7-6-5-6 5 2-7-6-5h7z"/></svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4A353"><path d="M12 2l3 7h7l-6 5 2 7-6-5-6 5 2-7-6-5h7z"/></svg>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#D4A353"><path d="M12 2l3 7h7l-6 5 2 7-6-5-6 5 2-7-6-5h7z"/></svg>
                  </div>
                  <div className="mt-3 text-[9px] sm:text-[10px] text-white/30 tracking-widest uppercase font-mono">as of today</div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5 sm:mt-6">
                <motion.div variants={leftSlideVariants} className="group bg-[#16102A] border border-white/[0.04] rounded-2xl p-4 sm:p-[18px] relative overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.1),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium text-[#A29EAB] mb-2 sm:mb-3 relative z-10" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" className="sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7l-7 7-4-4-6 6" /><path d="M21 7v6" /><path d="M21 7h-6" /></svg>
                    </div>
                    Collection
                  </div>
                  <div className="font-bold text-[22px] sm:text-[26px] text-white relative z-10" style={{ fontFamily: 'var(--font-playfair)' }}>
                    <span className="text-[16px] sm:text-[20px] mr-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>₹</span>
                    <AnimatedCounter value={dashData.totalCollection} delay={0.4} />
                  </div>
                  <div className="absolute left-4 right-4 sm:left-[18px] sm:right-[18px] bottom-4 sm:bottom-5 h-[2px] bg-white/5 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-emerald-500 rounded-full" />
                  </div>
                </motion.div>

                <motion.div variants={rightSlideVariants} className="group bg-[#16102A] border border-white/[0.04] rounded-2xl p-4 sm:p-[18px] relative overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(249,115,22,0.1),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium text-[#A29EAB] mb-2 sm:mb-3 relative z-10" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" className="sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 17l-7-7-4 4-6-6" /><path d="M21 17v-6" /><path d="M21 17h-6" /></svg>
                    </div>
                    Expenses
                  </div>
                  <div className="font-bold text-[22px] sm:text-[26px] text-white relative z-10" style={{ fontFamily: 'var(--font-playfair)' }}>
                    <span className="text-[16px] sm:text-[20px] mr-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>₹</span>
                    <AnimatedCounter value={dashData.totalExpense} delay={0.6} />
                  </div>
                  <div className="absolute left-4 right-4 sm:left-[18px] sm:right-[18px] bottom-4 sm:bottom-5 h-[2px] bg-white/5 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-orange-500 rounded-full" />
                  </div>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <motion.div variants={itemVariants} className="mt-6 sm:mt-8 mb-2 px-1">
                <div className="flex justify-between items-end text-[8px] sm:text-[9px] font-bold tracking-[0.2em] text-[#867B96] uppercase mb-2" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                  <span className="text-emerald-500/80">Collected</span>
                  <span className="text-[#D4A353] text-[9px] sm:text-[10px]">
                    {dashData.totalExpense > 0 ? Math.round((dashData.totalCollection / dashData.totalExpense) * 100) : 0}% funded
                  </span>
                  <span className="text-orange-500/80">Goal</span>
                </div>
                <div className="h-[6px] w-full bg-[#181325] rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div 
                    className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-500 to-[#E89E28] rounded-full"
                    style={{ boxShadow: '0 0 12px rgba(232, 158, 40, 0.5)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, dashData.totalExpense > 0 ? (dashData.totalCollection / dashData.totalExpense) * 100 : 0)}%` }}
                    transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>

              {/* Transparency Notice */}
              <motion.div variants={itemVariants} className="mt-6 sm:mt-8 bg-[#F59E0B]/[0.06] backdrop-blur-md border border-[#F59E0B]/10 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 flex items-start gap-3 sm:gap-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                <div className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#F59E0B]/10 flex items-center justify-center shrink-0 border border-[#F59E0B]/20 mt-0.5">
                  <svg className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5">
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <path d="M3 10h18M7 14h3" />
                  </svg>
                </div>
                <p className="text-[12px] sm:text-[13.5px] text-[#F3E8FF] leading-[1.6] sm:leading-[1.7] opacity-90 font-medium">
                  All funds are managed by the organizing committee. Donations and expenses are tracked digitally for full transparency.
                </p>
              </motion.div>

            </motion.div>
          ) : null}

          {/* Footer */}
          <div className="mt-auto pt-16 sm:pt-20 pb-6 sm:pb-8 text-center relative z-10">
            <div className="flex items-center justify-center mb-5 sm:mb-7 opacity-50">
              <div className="w-[40px] sm:w-[80px] h-[1px] bg-gradient-to-r from-transparent to-[#B88636]" />
              <div className="mx-3 sm:mx-4 flex gap-1">
                <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rotate-45 bg-[#B88636]" />
                <div className="w-[4px] h-[4px] sm:w-[6px] sm:h-[6px] rotate-45 bg-[#B88636]" />
                <div className="w-[6px] h-[10px] sm:w-[8px] sm:h-[12px] bg-[#B88636]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                <div className="w-[4px] h-[4px] sm:w-[6px] sm:h-[6px] rotate-45 bg-[#B88636]" />
                <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rotate-45 bg-[#B88636]" />
              </div>
              <div className="w-[40px] sm:w-[80px] h-[1px] bg-gradient-to-l from-transparent to-[#B88636]" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] sm:tracking-[0.3em] text-[#B88636] uppercase px-4" style={{ fontFamily: 'var(--font-dm-mono)' }}>
              Powered by GPMS — Ganesh Puja Management System
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
