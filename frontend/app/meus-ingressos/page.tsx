'use client';

import React, { useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Ticket {
  id: string;
  code: string;
  qrToken: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  checkedInAt?: string;
  createdAt: string;
  ticketType: {
    name: string;
    price: number;
    event: {
      title: string;
      startDate: string;
      location: string;
      city: string;
    };
  };
}

export default function MeusIngressosPage() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Format CPF mask: 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    setCpf(value);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCpf = cpf.trim();

    if (!rawCpf) {
      setErrorMsg('Digite seu CPF ou E-mail para consultar.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(true);

    try {
      const res = await api.get(`/orders/my-tickets?cpf=${encodeURIComponent(rawCpf)}`);
      setTickets(res.data.tickets || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Erro ao buscar ingressos. Verifique o CPF informado.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto w-full flex-grow">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <span className="text-xs text-pink-400 font-extrabold uppercase bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20">
            🎟️ Área do Cliente
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Meus Ingressos</h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
            Consulte seus ingressos comprados informando o seu **CPF** ou **E-mail** utilizado no momento da compra.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-brandCard border border-pink-500/30 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl glow-purple mb-12">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">
                Digite seu CPF ou E-mail cadastrado
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="000.000.000-00 ou seu@email.com"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-2xl p-4 pl-11 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-semibold text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 hover:from-purple-600 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl glow-pink transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span><i className="fa-solid fa-spinner animate-spin mr-2"></i> Buscando...</span>
              ) : (
                <span><i className="fa-solid fa-magnifying-glass mr-2"></i> Buscar Meus Ingressos</span>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {searched && !loading && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white mb-4 border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Ingressos Encontrados ({tickets.length})</span>
              {tickets.length > 0 && (
                <span className="text-xs text-pink-400 font-medium">QR Code pronto para o evento</span>
              )}
            </h2>

            {tickets.length === 0 ? (
              <div className="text-center py-12 px-6 bg-brandCard rounded-3xl border border-white/10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 text-gray-400 flex items-center justify-center text-2xl mx-auto">
                  <i className="fa-solid fa-ticket-simple"></i>
                </div>
                <h3 className="text-lg font-bold text-white">Nenhum ingresso encontrado</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Não encontramos ingressos aprovados para o documento ou e-mail digitado. Verifique se o pagamento foi confirmado ou tente consultar com outro dado.
                </p>
                <Link href="/eventos" className="inline-block px-6 py-2.5 bg-pink-600 text-white text-xs font-bold rounded-full">
                  Ver Festas Disponíveis
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="bg-brandCard border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-pink-500/40 transition-all shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
                  >
                    {/* Ticket Details */}
                    <div className="space-y-4 text-center md:text-left flex-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                          {t.ticketType.name}
                        </span>

                        {t.status === 'VALID' && (
                          <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                            <i className="fa-solid fa-circle-check mr-1"></i> VÁLIDO
                          </span>
                        )}

                        {t.status === 'USED' && (
                          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                            <i className="fa-solid fa-user-check mr-1"></i> JÁ UTILIZADO NA PORTARIA
                          </span>
                        )}

                        {t.status === 'CANCELLED' && (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                            <i className="fa-solid fa-ban mr-1"></i> CANCELADO
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-black text-white">{t.ticketType.event.title}</h3>

                      <div className="space-y-1 text-xs text-gray-300">
                        <p><i className="fa-regular fa-calendar text-pink-400 mr-2"></i> {new Date(t.ticketType.event.startDate).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        <p><i className="fa-solid fa-location-dot text-purple-400 mr-2"></i> {t.ticketType.event.location} — {t.ticketType.event.city}</p>
                        {t.checkedInAt && (
                          <p className="text-blue-400"><i className="fa-solid fa-clock mr-2"></i> Entrou em: {new Date(t.checkedInAt).toLocaleString('pt-BR')}</p>
                        )}
                      </div>

                      <div className="bg-black/60 p-3 rounded-xl border border-white/10 text-center md:text-left inline-block">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Código Único do Ingresso</span>
                        <span className="text-base font-mono font-black text-pink-400 tracking-wider">{t.code}</span>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white p-4 rounded-2xl text-center shadow-xl flex-shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`http://localhost/checkin/${t.qrToken}`)}`}
                        alt="QR Code do Ingresso"
                        className="w-40 h-40 mx-auto"
                      />
                      <span className="text-[9px] font-bold text-gray-800 uppercase block mt-2">Apresente na Entrada</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
