'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      setSession(token, user);

      if (user.role === 'OPERATOR') {
        router.push('/admin/checkin');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brandDark text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-brandDark to-brandDark"></div>

      <div className="relative z-10 bg-brandCard border border-purple-500/30 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl glow-purple">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-black text-xl text-white mx-auto mb-3 shadow-lg glow-pink">
            PX
          </div>
          <h1 className="text-2xl font-black text-white">Painel ProjetoX</h1>
          <p className="text-xs text-gray-400 mt-1">Acesso administrativo e portaria digital</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">E-mail de Acesso</label>
            <input
              type="email"
              required
              placeholder="admin@projetox.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">Senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3.5 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-xl glow-pink hover:scale-[1.02] transition-transform disabled:opacity-50 mt-4"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-[10px] text-gray-500">
          Acesso restrito a operadores e administradores autorizados.
        </div>
      </div>
    </main>
  );
}
