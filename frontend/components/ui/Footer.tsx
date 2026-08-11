import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <span className="font-extrabold text-lg text-white">PROJETO<span className="text-pink-500">X</span></span>
          </Link>
          <p className="text-xs leading-relaxed text-gray-400">
            Plataforma própria de venda de ingressos com QR Code de uso único. Segurança máxima para festas, festivais e grandes eventos.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Navegação</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-pink-400">Início</Link></li>
            <li><Link href="/eventos" className="hover:text-pink-400">Eventos em Destaque</Link></li>
            <li><Link href="/meus-ingressos" className="hover:text-pink-400">Meus Ingressos (CPF)</Link></li>
            <li><Link href="/admin/login" className="hover:text-pink-400">Acesso Restrito Admin</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contato & Suporte</h4>
          <ul className="space-y-3 text-xs">
            <li className="flex items-center gap-2">
              <i className="fa-brands fa-whatsapp text-green-500 text-base"></i> (11) 99999-9999
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-regular fa-envelope text-pink-500 text-base"></i> suporte@projetox.com.br
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Segurança</h4>
          <div className="flex items-center gap-3 text-gray-500 text-lg">
            <i className="fa-solid fa-qrcode text-pink-400" title="QR Code Único"></i>
            <i className="fa-solid fa-shield-halved text-green-400" title="Transações Atômicas"></i>
            <i className="fa-solid fa-lock text-blue-400" title="JWT & Encryption"></i>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 text-center text-xs text-gray-500">
        <p>© 2026 ProjetoX Produções — Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
