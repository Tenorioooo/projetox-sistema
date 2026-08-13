'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, clearSession } from '@/lib/auth';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'fa-chart-line', role: 'ALL' },
    { label: 'Portaria (Check-in)', href: '/admin/checkin', icon: 'fa-qrcode', role: 'ALL', highlight: true },
    { label: 'Eventos', href: '/admin/eventos', icon: 'fa-calendar-days', role: 'ADMIN' },
    { label: 'Ingressos', href: '/admin/ingressos', icon: 'fa-ticket', role: 'ADMIN' },
    { label: 'Histórico Check-ins', href: '/admin/checkins', icon: 'fa-list-check', role: 'ALL' },
    { label: 'Usuários Admin', href: '/admin/usuarios', icon: 'fa-users-gear', role: 'ADMIN' },
    { label: 'Relatórios', href: '/admin/relatorios', icon: 'fa-file-invoice-dollar', role: 'ADMIN' },
  ];

  return (
    <>
      {/* ───────────────────────────────────────────────────── */}
      {/* DESKTOP SIDEBAR (Visible on md screens and up)       */}
      {/* ───────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-brandCard border-r border-white/10 flex-col justify-between min-h-screen p-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg">
              PX
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm">PROJETO<span className="text-pink-500">X</span></h2>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Painel Admin</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              if (item.role === 'ADMIN' && user?.role !== 'ADMIN') return null;

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    item.highlight
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-900/30 glow-green'
                      : isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} text-base`}></i>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4">
          {user && (
            <div className="px-3 py-2 mb-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-white block truncate">{user.name}</span>
              <span className="text-[10px] text-pink-400 font-semibold uppercase">{user.role}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
          >
            <i className="fa-solid fa-right-from-bracket"></i> Sair da Conta
          </button>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────── */}
      {/* MOBILE TOP HEADER BAR (Visible only on mobile)        */}
      {/* ───────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-brandDark/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
            PX
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xs">PROJETO<span className="text-pink-500">X</span></h2>
            <span className="text-[9px] text-pink-400 font-bold uppercase block">
              {user ? user.role : 'ADMIN'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none"
          aria-label="Abrir Menu"
        >
          <i className={`fa-solid ${mobileDrawerOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
        </button>
      </header>

      {/* ───────────────────────────────────────────────────── */}
      {/* MOBILE SLIDE-OVER DRAWER (Visible when menu toggled)   */}
      {/* ───────────────────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto animate-fadeIn">
          <div>
            {/* Header in Drawer */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-sm shadow-lg">
                  PX
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-sm">PROJETO<span className="text-pink-500">X</span></h2>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Painel Administrativo</span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-300 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Nav Items */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                if (item.role === 'ADMIN' && user?.role !== 'ADMIN') return null;

                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                      item.highlight
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg glow-green'
                        : isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} text-lg w-6 text-center`}></i>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer User Info & Logout */}
          <div className="pt-6 border-t border-white/10 space-y-3 mt-6">
            {user && (
              <div className="px-4 py-3 bg-black/60 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{user.name}</span>
                  <span className="text-[10px] text-gray-400 block">{user.email}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-black uppercase">
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-extrabold text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-colors"
            >
              <i className="fa-solid fa-right-from-bracket text-base"></i> Sair do Painel
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MOBILE FLOATING BOTTOM BAR (Fast 1-Tap Mobile Nav)    */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brandCard/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex justify-around items-center text-center shadow-2xl">
        <Link
          href="/admin/dashboard"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            pathname === '/admin/dashboard' ? 'text-pink-400 font-extrabold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-chart-line text-lg"></i>
          <span className="text-[10px] mt-0.5 font-bold">Dash</span>
        </Link>

        <Link
          href="/admin/checkin"
          className="flex flex-col items-center py-1.5 px-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold shadow-lg glow-green -mt-3 border-2 border-brandDark"
        >
          <i className="fa-solid fa-qrcode text-xl"></i>
          <span className="text-[9px] uppercase tracking-wider font-black">Portaria</span>
        </Link>

        {user?.role === 'ADMIN' && (
          <Link
            href="/admin/eventos"
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              pathname === '/admin/eventos' ? 'text-pink-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-calendar-days text-lg"></i>
            <span className="text-[10px] mt-0.5 font-bold">Eventos</span>
          </Link>
        )}

        {user?.role === 'ADMIN' && (
          <Link
            href="/admin/ingressos"
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              pathname === '/admin/ingressos' ? 'text-pink-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-ticket text-lg"></i>
            <span className="text-[10px] mt-0.5 font-bold">Ingressos</span>
          </Link>
        )}

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-gray-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-ellipsis text-lg"></i>
          <span className="text-[10px] mt-0.5 font-bold">Mais</span>
        </button>
      </div>
    </>
  );
}

