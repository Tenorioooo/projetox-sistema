'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
  active: boolean;
  forcePasswordChange?: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State: 'create' | 'edit' | 'delete' | null
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'OPERATOR'>('OPERATOR');
  const [active, setActive] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('OPERATOR');
    setActive(true);
    setForcePasswordChange(false);
    setActiveModal('create');
  };

  const openEditModal = (userItem: UserItem) => {
    setSelectedUser(userItem);
    setName(userItem.name || '');
    setEmail(userItem.email || '');
    setPassword(''); // Empty = keep current password
    setRole(userItem.role || 'OPERATOR');
    setActive(userItem.active !== undefined ? userItem.active : true);
    setForcePasswordChange(userItem.forcePasswordChange || false);
    setActiveModal('edit');
  };

  const openDeleteModal = (userItem: UserItem) => {
    setSelectedUser(userItem);
    setActiveModal('delete');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      if (activeModal === 'create') {
        await api.post('/admin/users', {
          name,
          email,
          password,
          role,
          active,
        });
        setFeedbackMsg({ type: 'success', text: `Usuário "${name}" criado com sucesso!` });
      } else if (activeModal === 'edit' && selectedUser) {
        const payload: Record<string, any> = {
          name,
          email,
          role,
          active,
          forcePasswordChange,
        };
        if (password && password.trim().length >= 8) {
          payload.password = password;
        }

        await api.put(`/admin/users/${selectedUser.id}`, payload);
        setFeedbackMsg({ type: 'success', text: `Usuário "${name}" atualizado com sucesso!` });
      }

      setActiveModal(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || 'Erro ao salvar usuário.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);

    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setFeedbackMsg({ type: 'success', text: `Usuário "${selectedUser.name}" excluído com sucesso!` });
      setActiveModal(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao excluir usuário');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <i className="fa-solid fa-users-gear text-purple-400"></i> Usuários & Operadores
          </h1>
          <p className="text-xs text-gray-400 mt-1">Gerenciamento de acessos administrativos e operadores de portaria.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl glow-pink hover:scale-105 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-user-plus text-sm"></i> Criar Novo Operador
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

      {/* Users List Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : users.length === 0 ? (
        <div className="bg-brandCard p-12 rounded-3xl border border-white/10 text-center text-gray-400 space-y-4">
          <p className="text-sm font-bold text-white">Nenhum usuário cadastrado.</p>
          <button onClick={openCreateModal} className="px-6 py-2.5 bg-pink-600 text-white font-bold text-xs uppercase rounded-xl">
            Criar Primeiro Operador
          </button>
        </div>
      ) : (
        <div className="bg-brandCard rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 border-b border-white/10 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-4 px-5">Nome do Usuário</th>
                  <th className="py-4 px-5">E-mail de Acesso</th>
                  <th className="py-4 px-5">Perfil / Função</th>
                  <th className="py-4 px-5">Status da Conta</th>
                  <th className="py-4 px-5">Data de Criação</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-xs shadow-md">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-white text-sm font-bold block">{u.name}</strong>
                          {u.forcePasswordChange && (
                            <span className="text-[9px] text-yellow-400 font-semibold block">⚠️ Troca de senha pendente</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-5 font-mono text-gray-300">{u.email}</td>

                    {/* Role Badge */}
                    <td className="py-4 px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {u.role === 'ADMIN' ? '👑 Administrador' : '📱 Operador Portaria'}
                      </span>
                    </td>

                    {/* Active Status */}
                    <td className="py-4 px-5 font-bold">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-black ${
                          u.active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl border border-purple-500/30 font-bold transition-all"
                        title="Editar Usuário"
                      >
                        <i className="fa-solid fa-pen-to-square mr-1"></i> Editar
                      </button>

                      <button
                        onClick={() => openDeleteModal(u)}
                        className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl border border-red-500/30 font-bold transition-all"
                        title="Excluir Usuário"
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
      )}

      {/* MODAL: CREATE / EDIT USER */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-brandCard border border-purple-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl glow-purple space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <i className={`fa-solid ${activeModal === 'create' ? 'fa-user-plus text-pink-500' : 'fa-user-pen text-purple-400'}`}></i>
                {activeModal === 'create' ? 'Cadastrar Usuário / Operador' : `Editar: ${selectedUser?.name}`}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white text-xl p-2">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">E-mail de Login</label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@projetox.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">
                  {activeModal === 'create' ? 'Senha Inicial (mínimo 8 caracteres)' : 'Nova Senha (deixe em branco para manter a atual)'}
                </label>
                <input
                  type="password"
                  required={activeModal === 'create'}
                  placeholder={activeModal === 'create' ? 'Digite a senha inicial' : '•••••••• (apenas para redefinir)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Perfil / Função do Usuário</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white focus:outline-none font-bold"
                >
                  <option value="OPERATOR">📱 OPERADOR DE PORTARIA (Leitura de QR Code)</option>
                  <option value="ADMIN">👑 ADMINISTRADOR TOTAL (Acesso completo ao painel)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Status da Conta</label>
                  <select
                    value={active ? 'true' : 'false'}
                    onChange={(e) => setActive(e.target.value === 'true')}
                    className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-xl p-3 text-xs text-white focus:outline-none font-bold"
                  >
                    <option value="true">✅ ATIVO</option>
                    <option value="false">⛔ INATIVO (Acesso bloqueado)</option>
                  </select>
                </div>

                {activeModal === 'edit' && (
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Exigir Troca de Senha</label>
                    <select
                      value={forcePasswordChange ? 'true' : 'false'}
                      onChange={(e) => setForcePasswordChange(e.target.value === 'true')}
                      className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-xl p-3 text-xs text-white focus:outline-none font-bold"
                    >
                      <option value="false">NÃO</option>
                      <option value="true">SIM (No próximo acesso)</option>
                    </select>
                  </div>
                )}
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
                  {submitting ? 'Salvando...' : activeModal === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {activeModal === 'delete' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-brandCard border border-red-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-3xl mx-auto animate-pulse">
              <i className="fa-solid fa-user-xmark"></i>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Excluir Usuário?</h2>
              <p className="text-xs text-gray-300 mt-2">
                Tem certeza que deseja apagar permanentemente a conta de <strong className="text-pink-400">"{selectedUser.name}"</strong> ({selectedUser.email})?
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Esta ação revogará o acesso deste operador imediatamente.
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
                onClick={handleDeleteUser}
                disabled={submitting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Excluindo...' : 'Sim, Excluir Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
