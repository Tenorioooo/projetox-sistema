'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-4 sm:px-8 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-blue-500 p-0.5 flex items-center justify-center glow-pink group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-xl">X</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-wider text-white">PROJETO<span className="text-pink-500">X</span></span>
              <span className="text-[9px] tracking-[0.25em] text-gray-400 font-medium uppercase -mt-1">PRODUÇÕES</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="text-white hover:text-pink-400 transition-colors">Início</Link>
            <Link href="/eventos" className="text-gray-300 hover:text-pink-400 transition-colors">Eventos</Link>
            <Link href="/meus-ingressos" className="text-pink-400 hover:text-pink-300 font-bold transition-colors">
              <i className="fa-solid fa-ticket mr-1"></i> Meus Ingressos
            </Link>
            <Link href="/#faq" className="text-gray-300 hover:text-pink-400 transition-colors">Dúvidas</Link>
            <Link href="/admin/login" className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg bg-purple-500/10">
              <i className="fa-solid fa-lock mr-1"></i> Painel Admin
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/eventos" className="px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 rounded-full glow-pink hover:scale-105 transition-all">
              <i className="fa-solid fa-ticket mr-2"></i> Comprar Ingresso
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white text-2xl p-2" aria-label="Menu">
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white">PROJETO<span className="text-pink-500">X</span></span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="text-gray-400 text-2xl">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <nav className="flex flex-col gap-6 text-center text-lg font-semibold my-auto">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-white">Início</Link>
            <Link href="/eventos" onClick={() => setMobileOpen(false)} className="text-gray-300">Catálogo de Eventos</Link>
            <Link href="/meus-ingressos" onClick={() => setMobileOpen(false)} className="text-pink-400">Meus Ingressos (CPF)</Link>
            <Link href="/admin/login" onClick={() => setMobileOpen(false)} className="text-purple-400">Área Restrita / Portaria</Link>
          </nav>

          <Link href="/eventos" onClick={() => setMobileOpen(false)} className="text-center py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full uppercase tracking-wider text-sm">
            Ver Todos os Ingressos
          </Link>
        </div>
      )}
    </>
  );
}
