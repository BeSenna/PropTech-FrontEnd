import { fmtDate, fmtDateTime } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { trocarSenha, usuarioApi } from '@/services/moradorService';
import { idFmt, ativoTxt, sv } from './shared';

// ---------------------------------------------------------------- Usuários (contas de acesso)
export const usuarioCfg: ResourceConfig = {
  key: 'usuario',
  path: '/usuarios',
  singular: 'usuário',
  plural: 'Usuários',
  gender: 'm',
  endpoint: 'GET /usuario',
  idKey: 'usuarioId',
  adapter: usuarioApi,
  columns: [
    { key: 'usuarioLogin', label: 'Login', strong: true, sortValue: sv((r) => r.usuarioLogin) },
    { key: 'usuarioPerfil', label: 'Perfil', render: (r) => <Badge>{r.usuarioPerfil}</Badge> },
    { key: 'usuarioDataCriacao', label: 'Criado em', render: (r) => fmtDate(r.usuarioDataCriacao) },
    { key: 'usuarioUltimoAcesso', label: 'Último acesso', render: (r) => fmtDateTime(r.usuarioUltimoAcesso) },
    { key: 'usuarioStatus', label: 'Status', render: (r) => <Badge>{ativoTxt(r.usuarioStatus)}</Badge> },
  ],
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Síndicos', filters: { perfil: 'SINDICO' } },
    { label: 'Moradores', filters: { perfil: 'MORADOR' } },
  ],
  searchable: false,
  fields: [
    { name: 'usuarioLogin', label: 'Login', col: 'usuario_login', type: 'text', required: true, maxLength: 100, placeholder: 'seu.login' },
    { name: 'senha', label: 'Senha', col: 'senha (mín. 8 caracteres)', type: 'password', required: true, mode: 'create', placeholder: '••••••••', validate: (v) => (String(v).length >= 8 ? null : 'A senha deve ter pelo menos 8 caracteres.') },
    { name: 'novaSenha', label: 'Nova senha (opcional)', col: 'trocar senha', type: 'password', mode: 'edit', placeholder: 'Deixe em branco para manter', validate: (v) => (String(v).length >= 8 ? null : 'A senha deve ter pelo menos 8 caracteres.') },
    {
      name: 'usuarioPerfil',
      label: 'Perfil',
      col: 'usuario_perfil',
      type: 'radio',
      options: [
        { value: 'MORADOR', label: 'MORADOR' },
        { value: 'SINDICO', label: 'SINDICO' },
      ],
    },
    { name: 'usuarioStatus', label: 'Status', col: 'usuario_status', type: 'toggle', toggleTitle: 'Conta ativa', toggleHint: 'Desativar bloqueia também os tokens já emitidos' },
  ],
  formSubtitle: 'Contas de acesso ao sistema. A senha nunca é exibida.',
  defaults: { usuarioLogin: '', senha: '', novaSenha: '', usuarioPerfil: 'MORADOR', usuarioStatus: 1 },
  toForm: (r) => ({ usuarioLogin: r.usuarioLogin, novaSenha: '', usuarioPerfil: r.usuarioPerfil, usuarioStatus: r.usuarioStatus }),
  toPayload: (v, mode) => ({
    usuarioLogin: String(v.usuarioLogin).trim(),
    usuarioPerfil: v.usuarioPerfil,
    usuarioStatus: v.usuarioStatus,
    ...(mode === 'create' ? { senha: v.senha } : {}),
  }),
  afterSave: async (saved, v, mode) => {
    if (mode === 'edit' && v.novaSenha) await trocarSenha(saved.usuarioId, v.novaSenha);
  },
  rowTitle: (r) => r.usuarioLogin,
  idLabel: (r) => `Código ${idFmt(r.usuarioId)}`,
  hasDetail: false,
  statusOf: (r) => r.usuarioStatus,
  inactivate: { label: 'Desativar', confirm: 'O acesso será revogado imediatamente (inclusive tokens já emitidos).' },
};
