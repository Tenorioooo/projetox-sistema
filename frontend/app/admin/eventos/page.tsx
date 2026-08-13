'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface TicketTypeItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  location: string;
  address?: string;
  city: string;
  state?: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED';
  capacity?: number;
  ageRating?: number;
  ticketTypes: TicketTypeItem[];
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State: 'create' | 'edit' | 'delete' | null
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED'>('PUBLISHED');
  const [capacity, setCapacity] = useState(5000);
  const [ageRating, setAgeRating] = useState(18);

  // Ticket types in modal form
  const [ticketTypes, setTicketTypes] = useState<TicketTypeItem[]>([
    { name: 'Pista VIP', price: 80, quantity: 1500 },
    { name: 'Camarote Frontstage', price: 140, quantity: 500 },
    { name: 'Backstage Experience', price: 260, quantity: 100 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/admin/all');
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedEvent(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setBannerUrl('');
    setLocation('');
    setAddress('');
    setCity('');
    setState('SP');
    setStartDate('');
    setEndDate('');
    setStatus('PUBLISHED');
    setCapacity(5000);
    setAgeRating(18);
    setTicketTypes([
      { name: 'Pista VIP', price: 80, quantity: 1500 },
      { name: 'Camarote Frontstage', price: 140, quantity: 500 },
      { name: 'Backstage Experience', price: 260, quantity: 100 },
    ]);
    setActiveModal('create');
  };

  const openEditModal = (eventItem: EventItem) => {
    setSelectedEvent(eventItem);
    setTitle(eventItem.title || '');
    setSlug(eventItem.slug || '');
    setDescription(eventItem.description || '');
    setBannerUrl(eventItem.bannerUrl || '');
    setLocation(eventItem.location || '');
    setAddress(eventItem.address || '');
    setCity(eventItem.city || '');
    setState(eventItem.state || 'SP');

    // Format ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
    setStartDate(eventItem.startDate ? new Date(eventItem.startDate).toISOString().slice(0, 16) : '');
    setEndDate(eventItem.endDate ? new Date(eventItem.endDate).toISOString().slice(0, 16) : '');

    setStatus(eventItem.status || 'PUBLISHED');
    setCapacity(eventItem.capacity || 5000);
    setAgeRating(eventItem.ageRating || 18);
    setTicketTypes(
      eventItem.ticketTypes && eventItem.ticketTypes.length > 0
        ? eventItem.ticketTypes
        : [
            { name: 'Pista VIP', price: 80, quantity: 1500 },
            { name: 'Camarote Frontstage', price: 140, quantity: 500 },
          ]
    );

    setActiveModal('edit');
  };

  const openDeleteModal = (eventItem: EventItem) => {
    setSelectedEvent(eventItem);
    setActiveModal('delete');
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);

    const payload = {
      title,
      slug,
      description,
      bannerUrl: bannerUrl || undefined,
      location,
      address,
      city,
      state,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      status,
      capacity: Number(capacity),
      ageRating: Number(ageRating),
      ticketTypes,
    };

    try {
      if (activeModal === 'create') {
        await api.post('/events', payload);
        setFeedbackMsg({ type: 'success', text: 'Evento criado com sucesso!' });
      } else if (activeModal === 'edit' && selectedEvent) {
        await api.put(`/events/${selectedEvent.id}`, payload);
        setFeedbackMsg({ type: 'success', text: 'Evento atualizado com sucesso!' });
      }

      setActiveModal(null);
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || 'Erro ao salvar alterações no evento.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    setSubmitting(true);

    try {
      await api.delete(`/events/${selectedEvent.id}`);
      setFeedbackMsg({ type: 'success', text: `Evento "${selectedEvent.title}" excluído com sucesso!` });
      setActiveModal(null);
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao excluir evento');
    } finally {
      setSubmitting(false);
    }
  };

  // Ticket types form management inside modal
  const handleTicketTypeChange = (index: number, field: keyof TicketTypeItem, value: any) => {
    setTicketTypes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTicketTypeField = () => {
    setTicketTypes((prev) => [...prev, { name: 'Novo Setor', price: 100, quantity: 500 }]);
  };

  const removeTicketTypeField = (index: number) => {
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <i className="fa-solid fa-calendar-days text-pink-500"></i> Gerenciador de Eventos
          </h1>
          <p className="text-xs text-gray-400 mt-1">Crie, edite todos os detalhes ou exclua festas e festivais.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl glow-pink hover:scale-105 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-plus text-sm"></i> Criar Novo Evento
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-gray-400 hover:text-white">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Events Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : events.length === 0 ? (
        <div className="bg-brandCard p-12 rounded-3xl border border-white/10 text-center text-gray-400 space-y-4">
          <p className="text-sm font-bold text-white">Nenhum evento encontrado.</p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 bg-pink-600 text-white font-bold text-xs uppercase rounded-xl"
          >
            Cadastrar Primeiro Evento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-brandCard rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 border-b border-white/10 text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-4 px-5">Evento & Banner</th>
                    <th className="py-4 px-5">Cidade & Local</th>
                    <th className="py-4 px-5">Data & Hora</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Lotes Registrados</th>
                    <th className="py-4 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Title & Banner */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black overflow-hidden flex-shrink-0 border border-white/10">
                            <img
                              src={e.bannerUrl || `/images/event_${e.slug.replace(/-/g, '_')}.png`}
                              alt={e.title}
                              className="w-full h-full object-cover"
                              onError={(err) => {
                                (err.target as HTMLElement).setAttribute('src', '/images/event_neon_night.png');
                              }}
                            />
                          </div>
                          <div>
                            <strong className="text-white text-sm font-black block">{e.title}</strong>
                            <span className="text-[10px] text-gray-500 font-mono">/{e.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-5">
                        <span className="text-white font-semibold block">{e.location}</span>
                        <span className="text-gray-400 text-[10px]">{e.city} - {e.state || 'SP'}</span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5">
                        <span className="text-pink-400 font-bold block">
                          {new Date(e.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-gray-400 text-[10px]">
                          {new Date(e.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5 font-bold">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider ${
                            e.status === 'PUBLISHED'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : e.status === 'DRAFT'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : e.status === 'CANCELLED'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>

                      {/* Ticket Tiers */}
                      <td className="py-4 px-5">
                        {e.ticketTypes && e.ticketTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {e.ticketTypes.map((tt, idx) => (
                              <span key={idx} className="bg-white/10 text-gray-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {tt.name}: {formatCurrency(tt.price)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Sem lotes</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(e)}
                          className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl border border-purple-500/30 font-bold transition-all"
                          title="Editar Evento"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1"></i> Editar
                        </button>

                        <button
                          onClick={() => openDeleteModal(e)}
                          className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl border border-red-500/30 font-bold transition-all"
                          title="Excluir Evento"
                        >
                          <i className="fa-solid fa-trash-can mr-1"></i> Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {events.map((e) => (
              <div key={e.id} className="bg-brandCard p-4 rounded-2xl border border-white/10 space-y-3 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-black overflow-hidden flex-shrink-0 border border-white/10">
                    <img
                      src={e.bannerUrl || `/images/event_${e.slug.replace(/-/g, '_')}.png`}
                      alt={e.title}
                      className="w-full h-full object-cover"
                      onError={(err) => {
                        (err.target as HTMLElement).setAttribute('src', '/images/event_neon_night.png');
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-white text-base font-black block truncate">{e.title}</strong>
                    <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                      <i className="fa-solid fa-location-dot text-pink-500"></i> {e.location} ({e.city})
                    </span>
                    <span className="text-[11px] text-pink-400 font-bold block mt-0.5">
                      <i className="fa-regular fa-clock mr-1"></i>
                      {new Date(e.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {new Date(e.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider ${
                      e.status === 'PUBLISHED'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : e.status === 'DRAFT'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : e.status === 'CANCELLED'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {e.status}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(e)}
                      className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs rounded-xl font-bold border border-purple-500/40"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i> Editar
                    </button>
                    <button
                      onClick={() => openDeleteModal(e)}
                      className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600 text-red-200 text-xs rounded-xl font-bold border border-red-500/40"
                    >
                      <i className="fa-solid fa-trash-can mr-1"></i> Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT EVENT */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-brandCard border border-pink-500/30 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl glow-purple max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <i className={`fa-solid ${activeModal === 'create' ? 'fa-plus text-pink-500' : 'fa-pen-to-square text-purple-400'}`}></i>
                {activeModal === 'create' ? 'Cadastrar Novo Evento' : `Editar: ${selectedEvent?.title}`}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white text-xl p-2">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider">1. Informações Principais</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Título do Evento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: ProjetoX Neon Night"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (activeModal === 'create') {
                          setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
                        }
                      }}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Slug (URL amigável)</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: projetox-neon-night"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">URL da Imagem do Cartaz / Banner</label>
                  <input
                    type="text"
                    placeholder="Ex: /images/event_neon_night.png ou https://..."
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Descrição & Line-Up Completo</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Descreva a experiência, atrações, palcos e atrações do evento..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Location & Dates */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">2. Localização & Datas</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Nome do Local</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Expo Barra Funda"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Cidade</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      placeholder="SP"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Endereço Completo (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Francisco Matarazzo, 1500 - Água Branca"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Data & Hora de Início</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Data & Hora de Encerramento</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Restrictions */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">3. Status & Regras</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Status na Plataforma</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none font-bold"
                    >
                      <option value="PUBLISHED">PUBLICADO (Visível para compra)</option>
                      <option value="DRAFT">RASCUNHO (Oculto)</option>
                      <option value="CANCELLED">CANCELADO</option>
                      <option value="FINISHED">FINALIZADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Capacidade Total</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Classificação Etária</label>
                    <input
                      type="number"
                      value={ageRating}
                      onChange={(e) => setAgeRating(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Types Manager */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider">4. Lotes de Ingressos</h3>
                  <button
                    type="button"
                    onClick={addTicketTypeField}
                    className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg font-bold hover:bg-green-500/30"
                  >
                    + Adicionar Lote
                  </button>
                </div>

                <div className="space-y-2">
                  {ticketTypes.map((tt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/10">
                      <input
                        type="text"
                        placeholder="Nome do Setor (ex: Pista VIP)"
                        value={tt.name}
                        onChange={(e) => handleTicketTypeChange(idx, 'name', e.target.value)}
                        className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white flex-2"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 font-bold">R$</span>
                        <input
                          type="number"
                          placeholder="Preço"
                          value={tt.price}
                          onChange={(e) => handleTicketTypeChange(idx, 'price', Number(e.target.value))}
                          className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white w-24 font-bold text-green-400"
                        />
                      </div>
                      <input
                        type="number"
                        placeholder="Qtd"
                        value={tt.quantity}
                        onChange={(e) => handleTicketTypeChange(idx, 'quantity', Number(e.target.value))}
                        className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white w-20"
                      />
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketTypeField(idx)}
                          className="text-red-400 hover:text-red-300 p-1.5"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl glow-pink hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {submitting ? 'Salvando Alterações...' : activeModal === 'create' ? 'Cadastrar Evento' : 'Salvar Edição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {activeModal === 'delete' && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-brandCard border border-red-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-3xl mx-auto animate-pulse">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Excluir Evento?</h2>
              <p className="text-xs text-gray-300 mt-2">
                Tem certeza que deseja apagar permanentemente o evento <strong className="text-pink-400">"{selectedEvent.title}"</strong>?
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Esta ação apagará todos os dados vinculados a este evento.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={submitting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
