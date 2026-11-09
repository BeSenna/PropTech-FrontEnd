import { fmtDate, fmtDateTime } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { loadRelacaoSemContaOptions, trocarSenha, usuarioApi } from '@/services/moradorService';
import { SENHA_DICA, validarSenha } from '@/lib/senha';
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
    { name: 'senha', label: 'Senha', col: 'senha', type: 'password', required: true, mode: 'create', placeholder: '••••••••', fkNote: SENHA_DICA, validate: (v) => validarSenha(String(v)) },
    { name: 'novaSenha', label: 'Nova senha (opcional)', col: 'trocar senha', type: 'password', mode: 'edit', placeholder: 'Deixe em branco para manter', fkNote: SENHA_DICA, validate: (v) => validarSenha(String(v)) },
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
    {
      name: 'moradorImovelId',
      label: 'Relação (opcional)',
      col: 'morador_imovel_id',
      type: 'select',
      mode: 'create',
      loadOptions: loadRelacaoSemContaOptions,
      visibleWhen: (v) => v.usuarioPerfil === 'MORADOR',
      fkNote: 'Liga esta conta a uma relação que ainda não tem acesso. Sem relação, o morador não consegue usar o portal.',
    },
    { name: 'usuarioStatus', label: 'Status', col: 'usuario_status', type: 'toggle', toggleTitle: 'Conta ativa', toggleHint: 'Desativar bloqueia também os tokens já emitidos' },
  ],
  formSubtitle: 'Contas de acesso ao sistema. A senha nunca é exibida.',
  defaults: { usuarioLogin: '', senha: '', novaSenha: '', usuarioPerfil: 'MORADOR', moradorImovelId: '', usuarioStatus: 1 },
  toForm: (r) => ({ usuarioLogin: r.usuarioLogin, novaSenha: '', usuarioPerfil: r.usuarioPerfil, usuarioStatus: r.usuarioStatus }),
  toPayload: (v, mode) => ({
    usuarioLogin: String(v.usuarioLogin).trim(),
    usuarioPerfil: v.usuarioPerfil,
    usuarioStatus: v.usuarioStatus,
    ...(mode === 'create' ? { senha: v.senha } : {}),
    // a relação só vale para conta MORADOR e só na criação (o back não religa depois)
    ...(mode === 'create' && v.usuarioPerfil === 'MORADOR' && v.moradorImovelId ? { moradorImovelId: Number(v.moradorImovelId) } : {}),
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
