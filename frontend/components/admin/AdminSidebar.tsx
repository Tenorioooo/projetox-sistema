'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, clearSession } from '@/lib/auth';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

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
    <aside className="w-64 bg-brandCard border-r border-white/10 flex flex-col justify-between min-h-screen p-4">
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
  );
}
