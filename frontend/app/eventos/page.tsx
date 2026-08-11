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

export default function EventosPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [cityFilter]);

  const fetchEvents = () => {
    setLoading(true);
    const params = cityFilter ? { city: cityFilter } : {};
    api.get('/events', { params })
      .then((res) => setEvents(res.data.events || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full flex-grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-white">
              Catálogo de <span className="gradient-text-pink-purple">Eventos</span>
            </h1>
            <p className="text-sm text-gray-400 mt-2">Escolha sua festa e garanta seu ingresso com QR Code de uso único.</p>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2 bg-brandCard p-2 rounded-xl border border-white/10 max-w-xs">
            <i className="fa-solid fa-filter text-pink-500 text-sm ml-2"></i>
            <input
              type="text"
              placeholder="Filtrar por cidade..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-full px-2 py-1"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Buscando eventos...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-400 py-16 bg-brandCard rounded-3xl border border-white/10">
            Nenhum evento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              const minPrice = event.ticketTypes.length > 0
                ? Math.min(...event.ticketTypes.map((t) => t.price))
                : 0;

              return (
                <div key={event.id} className="bg-brandCard rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-pink-500/50 hover:-translate-y-2 transition-all duration-300">
                  <div>
                    <div className="h-64 relative overflow-hidden bg-black">
                      <img
                        src={posterMap[event.slug] || '/images/event_neon_night.png'}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent"></div>
                      <span className="absolute top-4 left-4 bg-pink-500 text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded-full glow-pink">
                        🔥 Vendas Abertas
                      </span>
                    </div>

                    <div className="p-6">
                      <p className="text-xs text-gray-400 line-clamp-3 mb-4">{event.description}</p>
                      <p className="text-xs text-gray-300 font-semibold">
                        <i className="fa-solid fa-location-dot text-pink-500 mr-1"></i>
                        {event.location} — {event.city}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">A partir de</span>
                      <span className="text-xl font-black text-green-400">{formatCurrency(minPrice)}</span>
                    </div>
                    <Link href={`/eventos/${event.slug}`} className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl glow-pink">
                      Garantir Ingresso
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
