'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function AdminReportsPage() {
  const [salesReport, setSalesReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports/sales')
      .then((res) => setSalesReport(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadCSV = () => {
    window.open('/api/admin/reports/export-csv', '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Relatórios & Exportação</h1>
          <p className="text-xs text-gray-400 mt-1">Consolidado financeiro por evento e download da lista de ingressos em CSV.</p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl glow-green"
        >
          <i className="fa-solid fa-file-csv mr-2"></i> Exportar Ingressos (CSV)
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 py-12">Carregando dados dos relatórios...</div>
      ) : (
        <div className="space-y-8">
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-brandCard p-6 rounded-3xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400">Faturamento Bruto Acumulado</span>
              <p className="text-3xl font-black text-green-400 mt-2">{formatCurrency(salesReport?.totalRevenue || 0)}</p>
            </div>
            <div className="bg-brandCard p-6 rounded-3xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total de Pedidos Aprovados</span>
              <p className="text-3xl font-black text-purple-400 mt-2">{salesReport?.totalOrders || 0}</p>
            </div>
          </div>

          {/* Sales By Event */}
          <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-4">
            <h2 className="text-lg font-bold text-white">Vendas por Evento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 border-b border-white/10 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Evento</th>
                    <th className="py-3 px-4">Ingressos Vendidos</th>
                    <th className="py-3 px-4">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {salesReport?.byEvent?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-bold text-white">{item.eventTitle}</td>
                      <td className="py-3 px-4 font-semibold text-purple-400">{item.tickets} ingressos</td>
                      <td className="py-3 px-4 font-black text-green-400">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
