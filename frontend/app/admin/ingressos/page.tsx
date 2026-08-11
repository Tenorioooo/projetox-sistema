'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async (codeFilter = '') => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tickets', { params: { code: codeFilter } });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets(searchCode);
  };

  const handleCancelTicket = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este ingresso?')) return;

    try {
      await api.put(`/admin/tickets/${id}/cancel`);
      alert('Ingresso cancelado com sucesso');
      fetchTickets(searchCode);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao cancelar ingresso');
    }
  };

  const handleResendEmail = async (id: string) => {
    try {
      await api.post(`/admin/tickets/${id}/resend-email`);
      alert('E-mail com QR Code reenviado com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao reenviar e-mail');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Buscar & Gerenciar Ingressos</h1>
          <p className="text-xs text-gray-400 mt-1">Busca individual por código, cancelamento e reenvio de e-mail.</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Código PX-2024-..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="bg-brandCard border border-white/15 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl">
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-gray-400 py-12">Carregando ingressos...</div>
      ) : (
        <div className="bg-brandCard rounded-3xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Evento / Tipo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="py-3 px-4 font-mono font-bold text-pink-400">{t.code}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{t.order.buyerName}</span>
                    <span className="text-[10px] text-gray-400">{t.order.buyerEmail}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="block font-bold text-white">{t.ticketType.event.title}</span>
                    <span className="text-[10px] text-purple-400 font-semibold">{t.ticketType.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'VALID' ? 'bg-green-500/20 text-green-400' :
                      t.status === 'USED' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <button
                      onClick={() => handleResendEmail(t.id)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded-lg font-bold"
                      title="Reenviar E-mail com QR Code"
                    >
                      <i className="fa-solid fa-paper-plane mr-1"></i> E-mail
                    </button>
                    {t.status === 'VALID' && (
                      <button
                        onClick={() => handleCancelTicket(t.id)}
                        className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] rounded-lg font-bold"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
