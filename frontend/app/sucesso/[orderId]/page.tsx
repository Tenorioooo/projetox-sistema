'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { api } from '@/lib/api';

interface Ticket {
  id: string;
  code: string;
  qrToken: string;
  qrCodeUrl?: string;
  status: string;
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

interface OrderData {
  id: string;
  buyerName: string;
  buyerEmail: string;
  total: number;
  paymentStatus: string;
  tickets: Ticket[];
}

export default function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${resolvedParams.orderId}`)
      .then((res) => setOrder(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brandDark text-white flex items-center justify-center">
        Carregando comprovante do pedido...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brandDark text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Pedido não encontrado</h2>
        <Link href="/" className="px-6 py-2 bg-pink-600 rounded-full font-bold">Voltar para Início</Link>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto w-full flex-grow">
        {/* Success Banner */}
        <div className="text-center mb-10 space-y-3">
          <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center text-3xl mx-auto glow-green">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Ingresso Confirmado!</h1>
          <p className="text-sm text-gray-300">
            Parabéns, <strong className="text-white">{order.buyerName}</strong>! Seu pedido <span className="font-mono text-pink-400">#{order.id.substring(0, 8).toUpperCase()}</span> foi processado com sucesso.
          </p>
        </div>

        {/* Tickets Showcase */}
        <div className="space-y-6">
          {order.tickets.map((t) => (
            <div key={t.id} className="bg-brandCard border border-pink-500/30 rounded-3xl p-6 sm:p-8 glow-purple shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                
                {/* Info */}
                <div className="space-y-4 text-center md:text-left flex-1">
                  <div>
                    <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                      {t.ticketType.name}
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2">{t.ticketType.event.title}</h2>
                  </div>

                  <div className="space-y-2 text-xs text-gray-300">
                    <p><i className="fa-regular fa-calendar text-pink-400 mr-2"></i> {new Date(t.ticketType.event.startDate).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                    <p><i className="fa-solid fa-location-dot text-purple-400 mr-2"></i> {t.ticketType.event.location} — {t.ticketType.event.city}</p>
                    <p><i className="fa-solid fa-user text-green-400 mr-2"></i> Titular: {order.buyerName}</p>
                  </div>

                  <div className="bg-black/60 p-3 rounded-xl border border-white/10 text-center md:text-left inline-block">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Código do Ingresso</span>
                    <span className="text-lg font-mono font-black text-pink-400 tracking-wider">{t.code}</span>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-white p-4 rounded-2xl text-center shadow-xl flex-shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://localhost/checkin/${t.qrToken}`)}`}
                    alt="QR Code do Ingresso"
                    className="w-48 h-48 mx-auto"
                  />
                  <span className="text-[10px] font-bold text-gray-800 uppercase block mt-2">Apresente na Portaria</span>
                </div>

              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-xs text-gray-400">
            Uma cópia do seu ingresso com o QR Code foi enviada para o e-mail: <strong className="text-white">{order.buyerEmail}</strong>
          </p>
          <Link href="/" className="inline-block px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-full border border-white/20">
            Voltar para a Página Inicial
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
