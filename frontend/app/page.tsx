'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  location: string;
  city: string;
  startDate: string;
  ticketTypes: { id: string; price: number }[];
}

const posterMap: Record<string, string> = {
  'projetox-neon-night': '/images/event_neon_night.png',
  'black-party': '/images/event_black_party.png',
  'festival-infinity': '/images/event_festival_infinity.png',
  'sunset-open-air': '/images/event_sunset_open_air.png',
  'funk-house-mashup': '/images/event_funk_house.png',
  'white-party-edition': '/images/event_white_party.png',
};

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 22, seconds: 45 });

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // VIP Form state
  const [vipName, setVipName] = useState('');
  const [vipPhone, setVipPhone] = useState('');
  const [vipSubmitted, setVipSubmitted] = useState(false);

  useEffect(() => {
    // Fetch real events from backend
    api.get('/events')
      .then((res) => setEvents(res.data.events || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Live countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vipName && vipPhone) {
      setVipSubmitted(true);
    }
  };

  const galleryImages = [
    { src: '/images/hero_party_bg.png', title: 'Mainstage Neon Festival' },
    { src: '/images/event_neon_night.png', title: 'Laser Show & FX' },
    { src: '/images/event_festival_infinity.png', title: 'Crowd & Energy' },
    { src: '/images/event_black_party.png', title: 'VIP Area Lounge' },
    { src: '/images/event_sunset_open_air.png', title: 'Sunset Open Air Stage' },
    { src: '/images/event_white_party.png', title: 'Special Guest DJ Set' },
  ];

  return (
    <>
      <Navbar />

      {/* 1. HERO SECTION WITH IMAGE BACKGROUND & COUNTDOWN */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background Image with Dark Glow Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_party_bg.png"
            alt="Festa Neon Background"
            className="w-full h-full object-cover opacity-30 scale-105 animate-float"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brandDark via-brandDark/80 to-transparent"></div>
          <div className="absolute inset-0 hero-glow-overlay"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider glow-pink">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
            <span>🔥 VENDAS LIBERADAS · PROJETO<span className="text-white">X</span> PRODUÇÕES</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none">
            SINTA A ENERGIA DAS <br />
            <span className="gradient-text-neon">MELHORES NOITES</span>
          </h1>

          <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Plataforma própria de ingressos para festas, baladas e grandes eventos noturnos com **QR Code de uso único** e entrada instantânea.
          </p>

          {/* Countdown Timer Component */}
          <div className="pt-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-pink-400 block mb-3">
              ⏰ Próxima Festa Começa Em:
            </span>
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              {[
                { label: 'DIAS', val: timeLeft.days },
                { label: 'HORAS', val: timeLeft.hours },
                { label: 'MINS', val: timeLeft.minutes },
                { label: 'SEGS', val: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-brandCard/90 border border-white/15 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl glow-purple text-center min-w-[70px] sm:min-w-[90px]">
                  <span className="text-2xl sm:text-4xl font-black text-white font-mono block">
                    {String(item.val).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-pink-400 uppercase tracking-widest block mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/eventos"
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white font-extrabold rounded-full text-sm uppercase tracking-wider glow-pink btn-pulse-neon hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-ticket text-lg"></i> GARANTIR INGRESSO AGORA
            </Link>
            <Link
              href="#eventos-catalogo"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-sm uppercase tracking-wider border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-calendar-days text-purple-400"></i> VER PROGRAMAÇÃO
            </Link>
          </div>
        </div>
      </section>

      {/* 2. SOCIAL PROOF TICKER / URGENCY BAR */}
      <section className="bg-gradient-to-r from-purple-950/80 via-black to-pink-950/80 border-y border-white/10 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-6 text-xs font-bold text-gray-300">
          <div className="flex items-center gap-2 text-pink-400">
            <i className="fa-solid fa-fire text-lg"></i>
            <span>85% dos Ingressos do 1º Lote Já Vendidos</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <i className="fa-solid fa-qrcode text-lg"></i>
            <span>QR Code Criptografado de Uso Único</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <i className="fa-solid fa-bolt text-lg"></i>
            <span>Catraca Digital & Entrada Express</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <i className="fa-solid fa-shield-halved text-lg"></i>
            <span>Compra 100% Segura & Anti-Fraude</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURED DYNAMIC EVENTS CATALOG */}
      <section id="eventos-catalogo" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-3">
          <span className="text-pink-500 text-xs font-bold uppercase tracking-widest bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20">
            🔥 AGENDA DE FESTAS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Próximos <span className="gradient-text-pink-purple">Eventos Confirmados</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Escolha sua festa favorita, selecione seu setor (Pista, Camarote ou Backstage) e receba seu ingresso no celular na hora.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Buscando eventos da temporada...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-400 py-16 bg-brandCard rounded-3xl border border-white/10">
            Nenhum evento publicado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              const minPrice = event.ticketTypes?.length > 0
                ? Math.min(...event.ticketTypes.map((t) => t.price))
                : 80;

              const posterImg = posterMap[event.slug] || '/images/event_neon_night.png';

              return (
                <div
                  key={event.id}
                  className="event-card rounded-3xl overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Poster Header */}
                    <div className="relative h-72 overflow-hidden bg-black">
                      <img
                        src={posterImg}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent"></div>
                      <span className="absolute top-4 left-4 badge-hot text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                        🔥 1º LOTE LIBERADO
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <span className="text-xs font-bold text-pink-400 block mb-1">
                        <i className="fa-regular fa-calendar-days mr-1.5"></i>
                        {new Date(event.startDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <h3 className="text-2xl font-black text-white mb-2 group-hover:text-pink-400 transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                        {event.description}
                      </p>

                      <p className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                        <i className="fa-solid fa-location-dot text-pink-500"></i>
                        {event.location} — {event.city}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">A partir de</span>
                      <span className="text-xl font-black text-green-400">{formatCurrency(minPrice)}</span>
                    </div>

                    <Link
                      href={`/eventos/${event.slug}`}
                      className="px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl glow-pink hover:scale-105 transition-transform"
                    >
                      Comprar Ingresso
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. PROMO BANNER URGENCY */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-purple-950 border border-pink-500/40 rounded-3xl p-8 sm:p-12 glow-pink shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left z-10">
            <span className="bg-pink-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full inline-block">
              🎁 CUPOM DE DESCONTO EXCLUSIVO
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Use o cupom <span className="text-yellow-300 underline font-mono">PROMO10</span> e ganhe 10% OFF
            </h3>
            <p className="text-xs sm:text-sm text-gray-200">
              Válido para compras de ingressos Pista VIP e Camarote realizadas hoje.
            </p>
          </div>

          <Link
            href="/eventos"
            className="z-10 px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest rounded-full shadow-xl hover:scale-105 transition-transform flex-shrink-0"
          >
            APLICAR CUPOM E COMPRAR
          </Link>
        </div>
      </section>

      {/* 5. TIMELINE DA PROGRAMAÇÃO DA NOITE */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16 space-y-3">
          <span className="text-purple-400 text-xs font-bold uppercase tracking-widest bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20">
            🎧 PROGRAMAÇÃO DA NOITE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Line-Up & <span className="gradient-text-neon">Experiência da Festa</span>
          </h2>
        </div>

        <div className="relative space-y-8 timeline-container pl-8 md:pl-0">
          {[
            { time: '22:00', title: 'Abertura dos Portões & Warm-Up Ambient', desc: 'Boas-vindas com iluminação neon fluorescente, recepção express por QR Code e welcome drink.' },
            { time: '00:00', title: 'Mainstage — DJ Set Eletro & Deep House', desc: 'Início do show de iluminação 4D e os maiores sucessos das pistas nacionais.' },
            { time: '02:00', title: 'Show de Lasers, Pirotecnia & Tinta Neon', desc: 'Distribuição gratuita de tinta neon fluorescente e espetáculo de efeitos especiais.' },
            { time: '04:00', title: 'Underground Tech House & Afterhours', desc: 'Sets estendidos nos 2 palcos simultâneos para quem fica até o amanhecer.' },
          ].map((item, idx) => (
            <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-brandCard p-6 rounded-2xl border border-white/10">
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono font-extrabold text-sm rounded-xl glow-purple">
                  {item.time}
                </span>
                <div>
                  <h4 className="text-base font-extrabold text-white">{item.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. GALLERY & LIGHTBOX MODAL */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-3">
          <span className="text-pink-400 text-xs font-bold uppercase tracking-widest bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20">
            📸 GALERIA DA FESTA
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Confira a Vibe do <span className="gradient-text-pink-purple">ProjetoX</span>
          </h2>
          <p className="text-xs text-gray-400">Clique na foto para expandir o preview em tela cheia.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPhoto(img.src)}
              className="relative h-56 sm:h-64 rounded-2xl overflow-hidden cursor-pointer group border border-white/10 hover:border-pink-500/50 transition-all shadow-lg"
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-expand text-pink-400"></i> {img.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <img src={selectedPhoto} alt="Foto Expandida" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white text-3xl hover:text-pink-500"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      {/* 7. DIFERENCIAIS PROJETO X */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: 'fa-qrcode', title: 'QR Code de Uso Único', desc: 'Token único criptografado. Entrada individual garantida com leitura instantânea na portaria.' },
            { icon: 'fa-bolt', title: 'Entrada Express', desc: 'Catraca digital sem filas. Apresente o código no celular e entre em poucos segundos.' },
            { icon: 'fa-wand-magic-sparkles', title: 'Iluminação & Som 4D', desc: 'Estrutura profissional com mais de 20.000 watts de som e espetáculo de lasers.' },
            { icon: 'fa-crown', title: 'Área VIP & Backstage', desc: 'Camarotes exclusivos com visão privilegiada do DJ, lounges e bares dedicados.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-brandCard p-6 rounded-3xl border border-white/10 hover:border-purple-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xl text-white shadow-lg glow-purple">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <h3 className="text-lg font-black text-white">{item.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CARROSSEL DE DEPOIMENTOS */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16 space-y-3">
          <span className="text-purple-400 text-xs font-bold uppercase tracking-widest bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20">
            ⭐ PROVA SOCIAL
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Quem Foi <span className="gradient-text-neon">Recomenda</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Lucas Andrade', text: 'Melhor festa do ano! A entrada por QR Code foi hiper rápida e o show de luzes surpreendeu todo mundo.', role: 'Cliente VIP' },
            { name: 'Mariana Lima', text: 'Comprei meu ingresso pelo CPF e recebi na hora no WhatsApp. Organização 10/10 na portaria!', role: 'Frequentadora' },
            { name: 'Gabriel Torres', text: 'Som pesado, estrutura gigante e público incrível. O setor Backstage valeu cada centavo!', role: 'Cliente Backstage' },
          ].map((item, idx) => (
            <div key={idx} className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex text-yellow-400 gap-1 text-xs">
                {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
              </div>
              <p className="text-xs text-gray-300 italic leading-relaxed">"{item.text}"</p>
              <div className="border-t border-white/10 pt-3">
                <span className="text-xs font-bold text-white block">{item.name}</span>
                <span className="text-[10px] text-pink-400 font-semibold">{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16 space-y-3">
          <span className="text-pink-400 text-xs font-bold uppercase tracking-widest bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20">
            ❓ PERGUNTAS FREQUENTES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Tira-Dúvidas Sobre <span className="gradient-text-pink-purple">Seu Ingresso</span>
          </h2>
        </div>

        <div className="space-y-4">
          {[
            { q: 'Como recebo meu ingresso após a compra?', a: 'Assim que o pagamento via Pix ou Cartão for aprovado, seu QR Code único é exibido na tela na hora e enviado para seu e-mail cadastrado. Você também pode consultar qualquer ingresso digitando seu CPF na área "Meus Ingressos".' },
            { q: 'O QR Code pode ser reutilizado ou compartilhado?', a: 'Não! Cada ingresso possui um token criptográfico único. Após a primeira leitura na portaria, o status muda para UTILIZADO com data e hora registradas. Tentativas de reutilização serão recusadas pela portaria.' },
            { q: 'Qual a classificação etária do evento?', a: 'Todos os nossos eventos são estritamente maiores de 18 anos (+18). Apresentação de documento oficial de identidade com foto é obrigatória na entrada.' },
            { q: 'Posso comprar ingressos para meus amigos?', a: 'Sim! Você pode comprar até 10 ingressos por pedido. Cada ingresso terá seu próprio QR Code individual gerado na hora.' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="bg-brandCard border border-white/10 rounded-2xl p-6 cursor-pointer transition-all hover:border-pink-500/40"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">{item.q}</h3>
                <i className={`fa-solid fa-chevron-down text-pink-400 text-xs transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}></i>
              </div>
              {openFaq === idx && (
                <p className="text-xs text-gray-300 mt-3 pt-3 border-t border-white/10 leading-relaxed">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 10. LISTA VIP CAPTURE FORM */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="bg-brandCard border border-purple-500/30 rounded-3xl p-8 sm:p-12 text-center glow-purple space-y-6">
          <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">
            📲 LISTA VIP WHATSAPP
          </span>
          <h2 className="text-3xl font-black text-white">Entre para a Lista VIP Exclusiva</h2>
          <p className="text-xs text-gray-300 max-w-lg mx-auto">
            Receba aviso antecipado do lançamento de novos lotes e cupons de desconto secretos no seu celular.
          </p>

          {vipSubmitted ? (
            <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-2xl text-green-300 text-xs font-bold">
              ✅ Cadastro realizado com sucesso! Você está na Lista VIP.
            </div>
          ) : (
            <form onSubmit={handleVipSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                required
                placeholder="Seu Nome"
                value={vipName}
                onChange={(e) => setVipName(e.target.value)}
                className="bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none flex-1"
              />
              <input
                type="tel"
                required
                placeholder="WhatsApp (11) 99999-9999"
                value={vipPhone}
                onChange={(e) => setVipPhone(e.target.value)}
                className="bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none flex-1"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl glow-pink"
              >
                Cadastrar
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
