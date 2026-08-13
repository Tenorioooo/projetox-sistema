'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

interface EventOption {
  id: string;
  title: string;
}

interface Metrics {
  revenueTotal: number;
  ticketsSoldTotal: number;
  checkinsTotal: number;
  pendingOrders: number;
  approvedOrders: number;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<{
    metrics: Metrics;
    recentOrders: any[];
    checkinChart: { hour: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Events options for dropdown filter
  const [eventsList, setEventsList] = useState<EventOption[]>([]);

  // Filter States
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    setMounted(true);

    // Fetch available events for filter dropdown
    api.get('/events/admin/all')
      .then((res) => setEventsList(res.data || []))
      .catch((err) => console.error(err));

    fetchDashboardData();
  }, []);

  const fetchDashboardData = (overrideParams?: Record<string, string>) => {
    setLoading(true);

    const params: Record<string, string> = {
      eventId: overrideParams?.eventId ?? selectedEventId,
      period: overrideParams?.period ?? selectedPeriod,
    };

    if (params.period === 'custom') {
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
    }

    api.get('/admin/dashboard', { params })
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleResetFilters = () => {
    setSelectedEventId('all');
    setSelectedPeriod('all');
    setStartDate('');
    setEndDate('');
    fetchDashboardData({ eventId: 'all', period: 'all' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <i className="fa-solid fa-chart-line text-pink-500"></i> Dashboard Geral
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Métricas de receita, vendas e fluxo de entradas filtradas por eventos e período.
          </p>
        </div>
      </div>

      {/* FILTER BAR SECTION */}
      <form onSubmit={handleApplyFilter} className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-pink-400 flex items-center gap-2">
            <i className="fa-solid fa-filter text-sm"></i> Filtros de Análise
          </span>

          {(selectedEventId !== 'all' || selectedPeriod !== 'all' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <i className="fa-solid fa-rotate-left"></i> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Event Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Evento</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none font-bold"
            >
              <option value="all">🎉 Todos os Eventos</option>
              {eventsList.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Period Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Período de Data</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none font-bold"
            >
              <option value="all">🌐 Todo o Período</option>
              <option value="today">📅 Hoje</option>
              <option value="7days">⚡ Últimos 7 Dias</option>
              <option value="30days">🗓️ Últimos 30 Dias</option>
              <option value="month">📊 Este Mês</option>
              <option value="custom">🛠️ Intervalo Personalizado</option>
            </select>
          </div>

          {/* 3. Custom Start Date (if custom period selected) */}
          {selectedPeriod === 'custom' ? (
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>
          ) : (
            <div className="hidden lg:block"></div>
          )}

          {/* 4. Custom End Date (if custom period selected) */}
          {selectedPeriod === 'custom' ? (
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>
          ) : null}

          {/* Filter Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl glow-pink hover:scale-[1.02] transition-transform"
            >
              <i className="fa-solid fa-magnifying-glass mr-1.5"></i> Aplicar Filtros
            </button>
          </div>
        </div>
      </form>

      {/* DASHBOARD CONTENT */}
      {!mounted || loading || !data ? (
        <SkeletonDashboard />
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-2 glow-purple">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Receita (Filtrado)</span>
              <p className="text-3xl font-black text-green-400">{formatCurrency(data.metrics.revenueTotal)}</p>
              <span className="text-[10px] text-gray-400 block font-semibold">
                {data.metrics.approvedOrders} pedidos aprovados
              </span>
            </div>

            <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Ingressos Vendidos</span>
              <p className="text-3xl font-black text-purple-400">{data.metrics.ticketsSoldTotal}</p>
              <span className="text-[10px] text-gray-400 block font-semibold">Ingressos Válidos e Utilizados</span>
            </div>

            <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Entradas / Check-ins</span>
              <p className="text-3xl font-black text-pink-400">{data.metrics.checkinsTotal}</p>
              <span className="text-[10px] text-gray-400 block font-semibold">Entradas validadas na portaria</span>
            </div>

            <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Pedidos Pendentes</span>
              <p className="text-3xl font-black text-yellow-400">{data.metrics.pendingOrders}</p>
              <span className="text-[10px] text-gray-400 block font-semibold">Aguardando pagamento Pix/Cartão</span>
            </div>
          </div>

          {/* CHECK-IN CHART */}
          <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-chart-simple text-pink-400"></i> Fluxo de Entradas no Período
              </h2>
              <span className="text-xs text-gray-400 font-medium">Total: {data.metrics.checkinsTotal} check-ins</span>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.checkinChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="hour" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0d0d14', borderColor: '#333', color: '#fff', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#EC4899" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT ORDERS TABLE */}
          <div className="bg-brandCard p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-receipt text-purple-400"></i> Pedidos Recentes
            </h2>

            {data.recentOrders.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">Nenhum pedido encontrado para estes filtros.</p>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/60 border-b border-white/10 text-gray-400 uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Comprador</th>
                        <th className="py-3 px-4">Evento</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Método</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {data.recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-bold text-white">{o.buyerName}</td>
                          <td className="py-3 px-4 text-purple-400 font-semibold">
                            {o.tickets?.[0]?.ticketType?.event?.title || 'ProjetoX Evento'}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-green-400">{formatCurrency(o.total)}</td>
                          <td className="py-3 px-4 uppercase text-[10px] font-mono text-gray-400">{o.paymentMethod || 'PIX'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                o.paymentStatus === 'APPROVED'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {data.recentOrders.map((o) => (
                    <div key={o.id} className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm">{o.buyerName}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            o.paymentStatus === 'APPROVED'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </div>
                      <div className="text-xs text-purple-400 font-semibold">
                        {o.tickets?.[0]?.ticketType?.event?.title || 'ProjetoX Evento'}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-gray-400">
                        <span>Valor: <strong className="text-green-400 font-black">{formatCurrency(o.total)}</strong></span>
                        <span className="uppercase text-[10px] font-mono">{o.paymentMethod || 'PIX'}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 text-right">
                        {new Date(o.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
