'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  address?: string;
  city: string;
  startDate: string;
  endDate: string;
  ageRating: number;
  ticketTypes: TicketType[];
}

const posterMap: Record<string, string> = {
  'projetox-neon-night': '/images/event_neon_night.png',
  'black-party': '/images/event_black_party.png',
  'festival-infinity': '/images/event_festival_infinity.png',
  'sunset-open-air': '/images/event_sunset_open_air.png',
  'funk-house-mashup': '/images/event_funk_house.png',
  'white-party-edition': '/images/event_white_party.png',
};

const djsList = [
  { name: 'DJ KAZZ', genre: 'Tech House', time: '01:00 - 03:00', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80', color: 'pink' },
  { name: 'BEATRIX LUNA', genre: 'Afro House', time: '23:00 - 01:00', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80', color: 'purple' },
  { name: 'NEON PULSE', genre: 'EDM / Mainstage', time: '03:00 - 05:00', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80', color: 'blue' },
  { name: 'GROOVE MAFIA', genre: 'Bass & House', time: '05:00 - 07:00', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80', color: 'green' },
  { name: 'SUB ZERO', genre: 'Opening Set', time: '22:00 - 23:00', img: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=300&q=80', color: 'pink' },
];

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  // Ticket Quantities state: map of ticketType.id => count
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});

  // Coupon state
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Buyer Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerCpf, setBuyerCpf] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pixTime, setPixTime] = useState(899); // 15 mins
  const [copiedPix, setCopiedPix] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/events/${resolvedParams.slug}`)
      .then((res) => {
        setEvent(res.data);
        if (res.data.ticketTypes && res.data.ticketTypes.length > 0) {
          // Initialize first ticket tier with quantity 1
          const initialQty: Record<string, number> = {};
          res.data.ticketTypes.forEach((t: TicketType, idx: number) => {
            initialQty[t.id] = idx === 0 ? 1 : 0;
          });
          setTicketQuantities(initialQty);
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg('Evento não encontrado');
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.slug]);

  // Pix Countdown timer when modal is open
  useEffect(() => {
    if (!showCheckoutModal) return;
    const timer = setInterval(() => {
      setPixTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showCheckoutModal]);

  const updateQuantity = (typeId: string, delta: number) => {
    setTicketQuantities((prev) => {
      const current = prev[typeId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [typeId]: next };
    });
  };

  const applyCoupon = () => {
    const clean = coupon.trim().toUpperCase();
    if (clean === 'PROMO10') {
      setDiscountPercent(10);
      setCouponMsg({ text: 'Cupom PROMO10 aplicado! 10% de desconto concedido.', type: 'success' });
    } else if (clean === 'PROJETOX') {
      setDiscountPercent(15);
      setCouponMsg({ text: 'Cupom PROJETOX aplicado! 15% de desconto concedido.', type: 'success' });
    } else {
      setDiscountPercent(0);
      setCouponMsg({ text: 'Cupom inválido ou expirado.', type: 'error' });
    }
  };

  // Calculations
  const calculateTotals = () => {
    if (!event) return { subtotal: 0, discount: 0, total: 0, count: 0 };
    let subtotal = 0;
    let count = 0;

    event.ticketTypes.forEach((t) => {
      const qty = ticketQuantities[t.id] || 0;
      subtotal += t.price * qty;
      count += qty;
    });

    const discount = (subtotal * discountPercent) / 100;
    const total = Math.max(0, subtotal - discount);

    return { subtotal, discount, total, count };
  };

  const { subtotal, discount, total, count } = calculateTotals();

  const handleInitiateCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (count === 0) {
      setErrorMsg('Selecione pelo menos 1 ingresso para continuar.');
      return;
    }
    if (!buyerName || !buyerEmail || !buyerPhone || !buyerCpf) {
      setErrorMsg('Preencha todos os campos do comprador (Nome, E-mail, Celular e CPF).');
      return;
    }

    setErrorMsg('');
    setShowCheckoutModal(true);
  };

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      // Find first selected ticket type ID
      const selectedTypeId = Object.keys(ticketQuantities).find((id) => (ticketQuantities[id] || 0) > 0);
      const selectedQty = selectedTypeId ? ticketQuantities[selectedTypeId] : 1;

      const res = await api.post('/orders', {
        ticketTypeId: selectedTypeId,
        quantity: selectedQty,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerCpf,
        paymentMethod,
      });

      setCreatedOrderId(res.data.orderId);
      // Redirect to order success page
      router.push(`/sucesso/${res.data.orderId}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Erro ao gerar pedido. Tente novamente.');
      setShowCheckoutModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText('00020126580014BR.GOV.BCB.PIX0136projetox-ingressos-fe748a9c2b81520400005303986540588');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brandDark text-white flex items-center justify-center text-sm font-bold">
        <i className="fa-solid fa-spinner animate-spin text-pink-500 mr-2 text-xl"></i>
        Carregando detalhes da festa...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-brandDark text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Evento não encontrado</h2>
        <Link href="/eventos" className="px-6 py-2.5 bg-pink-600 rounded-full font-bold text-xs uppercase">
          Voltar para Eventos
        </Link>
      </div>
    );
  }

  const posterImg = posterMap[event.slug] || '/images/event_neon_night.png';

  return (
    <>
      {/* Header bar with Back button */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-4 sm:px-8 header-glass">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/eventos" className="w-9 h-9 rounded-full bg-white/10 hover:bg-pink-600 text-white flex items-center justify-center transition-colors">
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 p-0.5">
                <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center font-bold text-pink-500 text-xs">X</div>
              </div>
              <span className="font-extrabold text-lg text-white">PROJETO<span className="text-pink-500">X</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <i className="fa-solid fa-shield-halved"></i> Compra 100% Segura
            </span>
            <a href="#ingressos" className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-full glow-pink">
              Seleção de Ingressos
            </a>
          </div>
        </div>
      </header>

      {/* Hero Event Banner */}
      <section className="relative pt-24 pb-12 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={posterImg} alt={event.title} className="w-full h-full object-cover blur-sm opacity-40 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-brandDark via-brandDark/90 to-brandDark/60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-end pt-8">
          {/* Poster Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 glow-purple">
            <img src={posterImg} alt={event.title} className="w-full h-auto object-cover" />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 text-xs font-black uppercase text-white rounded-full badge-hot">
                🔥 Lote 1 — 85% Esgotado
              </span>
            </div>
          </div>

          {/* Event Header Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-pink-400 bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20">
              <i className="fa-solid fa-bolt"></i> Tech House & EDM Festival
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              {event.title} <span className="gradient-text-pink-purple block">Edição {event.city}</span>
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs sm:text-sm border-y border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <i className="fa-regular fa-calendar-check text-lg"></i>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Data & Hora</span>
                  <strong className="text-white">{new Date(event.startDate).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <i className="fa-solid fa-location-dot text-lg"></i>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Local</span>
                  <strong className="text-white">{event.location} — {event.city}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <i className="fa-solid fa-id-card text-lg"></i>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Classificação</span>
                  <strong className="text-white">Estritamente +{event.ageRating} Anos</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Details & Lineup & Map */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Event Description */}
          <section className="bg-brandCard p-8 rounded-3xl border border-white/10">
            <h2 className="text-2xl font-extrabold text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-pink-500"></i> Sobre o Evento
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </section>

          {/* Line-Up Showcase */}
          <section className="bg-brandCard p-8 rounded-3xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <i className="fa-solid fa-sliders text-purple-400"></i> Line-Up Oficial
              </h2>
              <span className="text-xs text-pink-400 font-semibold">5 DJs Confirmados</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {djsList.map((dj, idx) => (
                <div key={idx} className="bg-black/50 p-4 rounded-2xl border border-white/10 text-center hover:border-pink-500/50 transition-all">
                  <img src={dj.img} alt={dj.name} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-pink-500 p-0.5" />
                  <h3 className="font-bold text-white text-sm">{dj.name}</h3>
                  <span className="text-[10px] text-pink-400 font-semibold block uppercase">{dj.genre}</span>
                  <span className="text-[9px] text-gray-400 block mt-1">{dj.time}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Venue Map Showcase */}
          <section className="bg-brandCard p-8 rounded-3xl border border-white/10">
            <h2 className="text-2xl font-extrabold text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-map-location-dot text-blue-400"></i> Localização & Mapa
            </h2>
            <p className="text-xs text-gray-400 mb-6">{event.location} — {event.address || event.city}</p>
            
            <div className="relative h-64 rounded-2xl overflow-hidden border border-white/15 bg-black/80 flex items-center justify-center group">
              <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80" alt="Mapa" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              
              <div className="absolute z-10 text-center p-6">
                <div className="w-14 h-14 rounded-full bg-pink-500 text-white flex items-center justify-center text-2xl mx-auto mb-2 glow-pink animate-bounce">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <h4 className="text-white font-black text-lg">{event.location}</h4>
                <p className="text-xs text-gray-300 mt-1">Fácil acesso por transporte público e aplicativos</p>
                <a href="https://maps.google.com" target="_blank" className="inline-block mt-4 px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-full shadow-lg">
                  Abrir no GPS / Google Maps <i className="fa-solid fa-arrow-up-right-from-square ml-1"></i>
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Ticket Selection & Checkout Form */}
        <div id="ingressos" className="space-y-6">
          <form onSubmit={handleInitiateCheckout} className="bg-brandCard p-6 sm:p-8 rounded-3xl border border-pink-500/30 glow-purple sticky top-24 space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">Selecione seus Ingressos</h3>
                <p className="text-xs text-pink-400 font-semibold">Lote Promocional ABERTO</p>
              </div>
              <span className="text-xs bg-pink-500/20 text-pink-300 font-bold px-3 py-1 rounded-full border border-pink-500/30">
                Lote 1
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Ticket Tier Cards */}
            <div className="space-y-4">
              {event.ticketTypes.map((t) => {
                const qty = ticketQuantities[t.id] || 0;

                return (
                  <div key={t.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-pink-500/40 transition-all flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-white text-sm block">{t.name}</span>
                      <span className="text-[10px] text-gray-400 block">Restantes: {t.quantity - t.sold}</span>
                      <span className="text-base font-extrabold text-green-400 block mt-1">{formatCurrency(t.price)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateQuantity(t.id, -1)}
                        className="w-7 h-7 rounded-lg bg-black/50 text-white font-bold hover:bg-pink-600 transition-colors flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-white">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(t.id, 1)}
                        className="w-7 h-7 rounded-lg bg-black/50 text-white font-bold hover:bg-pink-600 transition-colors flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Section */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Possui cupom de desconto?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: PROMO10"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="uppercase w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="px-4 py-2 bg-white/10 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Aplicar
                </button>
              </div>
              {couponMsg && (
                <p className={`text-xs mt-1 font-medium ${couponMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Buyer Info Form */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dados do Comprador</h4>
              
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">E-mail (envio do QR Code)</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={buyerCpf}
                    onChange={(e) => setBuyerCpf(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Celular / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Ingressos ({count}):</span>
                <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-pink-400 font-semibold">
                  <span>Desconto cupom ({discountPercent}%):</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-black text-white border-t border-white/10 pt-2 mt-2">
                <span>Valor Total:</span>
                <span className="text-green-400 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-green-500 hover:from-purple-600 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl glow-pink btn-pulse-neon transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-lock text-base"></i> Finalizar e Ir Para Pagamento
            </button>

            <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
              <i className="fa-solid fa-bolt text-yellow-400"></i> QR Code imediato após a confirmação do pagamento.
            </p>
          </form>
        </div>

      </main>

      {/* CHECKOUT MODAL (Pix / Credit Card Simulator) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-brandCard border border-pink-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl glow-purple max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl p-2"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="text-center mb-6">
              <span className="text-xs text-green-400 font-extrabold uppercase bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                🔒 Ambiente Seguro de Pagamento
              </span>
              <h3 className="text-2xl font-black text-white mt-3">Finalizar Pedido</h3>
              <p className="text-xs text-gray-400">Valor Total: <strong className="text-green-400 text-base">{formatCurrency(total)}</strong></p>
            </div>

            {/* Payment Method Switcher */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  paymentMethod === 'pix'
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-gray-800 text-gray-400'
                }`}
              >
                <i className="fa-solid fa-pix text-green-400 text-base"></i> Pix (Imediato)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  paymentMethod === 'credit_card'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                    : 'border-gray-800 text-gray-400'
                }`}
              >
                <i className="fa-solid fa-credit-card text-base"></i> Cartão de Crédito
              </button>
            </div>

            {/* Content: Pix */}
            {paymentMethod === 'pix' && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020126580014BR.GOV.BCB.PIX0136projetox-ingressos-fe748a9c2b81520400005303986540588"
                    alt="QR Code Pix"
                    className="w-44 h-44 mx-auto"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-400">Código Pix Copia e Cola:</p>
                  <div className="mt-1 bg-black/80 p-3 rounded-xl border border-white/10 text-[11px] font-mono text-pink-400 break-all select-all flex items-center justify-between gap-2">
                    <span className="truncate">00020126580014BR.GOV.BCB.PIX0136projetox-ingressos-fe748a9c...</span>
                    <button
                      type="button"
                      onClick={copyPixCode}
                      className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold text-xs flex-shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                  {copiedPix && <p className="text-xs text-green-400 font-bold mt-1">Código Pix copiado!</p>}
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-gray-300">
                  ⏰ Tempo restante para pagamento: <strong className="text-pink-400 font-mono">{Math.floor(pixTime / 60)}:{String(pixTime % 60).padStart(2, '0')}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl glow-green hover:scale-[1.02] transition-transform disabled:opacity-50 mt-4"
                >
                  {submitting ? 'Confirmando Pagamento...' : 'Já Fiz o Pagamento — Gerar Ingresso'}
                </button>
              </div>
            )}

            {/* Content: Card */}
            {paymentMethod === 'credit_card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Número do Cartão</label>
                  <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Nome Impresso no Cartão</label>
                  <input type="text" placeholder="NOME COMO NO CARTÃO" className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Validade</label>
                    <input type="text" placeholder="MM/AA" className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">CVV</label>
                    <input type="text" placeholder="123" className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl glow-pink hover:scale-[1.02] transition-transform disabled:opacity-50 mt-4"
                >
                  {submitting ? 'Processando Cartão...' : 'Confirmar e Pagar com Cartão'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
