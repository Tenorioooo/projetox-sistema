'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CheckinsHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/checkin/recent?limit=50');
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Histórico de Check-ins</h1>
          <p className="text-xs text-gray-400 mt-1">Registro de todas as leituras de ingressos realizadas na portaria em tempo real.</p>
        </div>
        <button onClick={fetchLogs} className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20">
          <i className="fa-solid fa-arrows-rotate mr-1"></i> Atualizar Agora
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 py-12">Carregando histórico...</div>
      ) : (
        <div className="bg-brandCard rounded-3xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/10 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Evento</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 px-4 font-bold">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {log.success ? 'APROVADO' : 'RECUSADO'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{log.ticket?.order?.buyerName || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono text-pink-400">{log.ticket?.code || '-'}</td>
                  <td className="py-3 px-4">{log.ticket?.ticketType?.event?.title || 'N/A'}</td>
                  <td className="py-3 px-4">{log.operator?.name || 'Sistema'}</td>
                  <td className="py-3 px-4 text-gray-400">{new Date(log.checkedAt).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
