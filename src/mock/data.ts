import { createMock } from './store';

// Dados de demonstração do módulo Serviços (mock no navegador). O Financeiro usa a API real (MS Financeiro).

export const areaStore = createMock(
  'area_comum',
  () => [
    { area_comum_nome: 'Salão de Festas', area_comum_descricao: 'Salão climatizado com cozinha e som ambiente', area_comum_capacidade: 80, area_comum_status: 1 },
    { area_comum_nome: 'Churrasqueira 1', area_comum_descricao: 'Churrasqueira coberta com pia e mesas', area_comum_capacidade: 30, area_comum_status: 1 },
    { area_comum_nome: 'Quadra Poliesportiva', area_comum_descricao: 'Quadra com iluminação noturna', area_comum_capacidade: 20, area_comum_status: 1 },
    { area_comum_nome: 'Espaço Gourmet (em reforma)', area_comum_descricao: 'Fechado para reforma', area_comum_capacidade: 40, area_comum_status: 0 },
  ],
  ['area_comum_nome', 'area_comum_descricao'],
  'area_comum_status',
);

export const reservaStore = createMock(
  'reserva',
  () => [
    { area_comum_id: 1, area_comum_label: 'Salão de Festas', reserva_morador_id: null, morador_nome: 'Ana Beatriz Souza', reserva_data_reserva: '2026-09-20', reserva_horario_inicio: '19:00', reserva_horario_fim: '23:00', reserva_tipo: 'CONFIRMADA', reserva_status: 1 },
    { area_comum_id: 2, area_comum_label: 'Churrasqueira 1', reserva_morador_id: null, morador_nome: 'Carlos Eduardo Lima', reserva_data_reserva: '2026-09-21', reserva_horario_inicio: '12:00', reserva_horario_fim: '16:00', reserva_tipo: 'PENDENTE', reserva_status: 1 },
    { area_comum_id: 3, area_comum_label: 'Quadra Poliesportiva', reserva_morador_id: null, morador_nome: 'Lucas Mendes Rocha', reserva_data_reserva: '2026-09-19', reserva_horario_inicio: '09:00', reserva_horario_fim: '10:00', reserva_tipo: 'CANCELADA', reserva_status: 0 },
  ],
  ['area_comum_label', 'morador_nome'],
  'reserva_status',
);

export const ocorrenciaStore = createMock(
  'ocorrencia',
  () => [
    { ocorrencia_morador_id: null, morador_nome: 'Carlos Eduardo Lima', ocorrencia_titulo: 'Vazamento no teto da garagem', ocorrencia_descricao: 'Infiltração próxima à vaga 12, nível -1', ocorrencia_data_ocorrencia: '2026-09-10T08:15', ocorrencia_tipo: 'ABERTA', ocorrencia_status: 1 },
    { ocorrencia_morador_id: null, morador_nome: 'Ana Beatriz Souza', ocorrencia_titulo: 'Barulho excessivo — Apto 201', ocorrencia_descricao: 'Som alto após as 22h', ocorrencia_data_ocorrencia: '2026-09-08T22:40', ocorrencia_tipo: 'EM_ANDAMENTO', ocorrencia_status: 1 },
    { ocorrencia_morador_id: null, morador_nome: 'Lucas Mendes Rocha', ocorrencia_titulo: 'Lâmpada queimada no corredor B', ocorrencia_descricao: 'Corredor do 3º andar', ocorrencia_data_ocorrencia: '2026-09-02T18:00', ocorrencia_tipo: 'FINALIZADA', ocorrencia_status: 1 },
  ],
  ['ocorrencia_titulo', 'morador_nome'],
  'ocorrencia_status',
);

export const manutencaoStore = createMock(
  'manutencao',
  () => [
    { ocorrencia_id: 1, ocorrencia_label: 'Vazamento no teto da garagem', manutencao_descricao: 'Reparo de impermeabilização da laje', manutencao_responsavel: 'ElevaTech Manutenção Ltda', manutencao_data_solicitacao: '2026-09-10', manutencao_data_conclusao: '', manutencao_tipo: 'EM_EXECUCAO', manutencao_status: 1 },
    { ocorrencia_id: 2, ocorrencia_label: 'Barulho excessivo — Apto 201', manutencao_descricao: 'Notificação formal ao morador', manutencao_responsavel: 'Síndico(a)', manutencao_data_solicitacao: '2026-09-08', manutencao_data_conclusao: '2026-09-09', manutencao_tipo: 'CONCLUIDA', manutencao_status: 1 },
    { ocorrencia_id: 3, ocorrencia_label: 'Lâmpada queimada no corredor B', manutencao_descricao: 'Troca de lâmpadas do corredor', manutencao_responsavel: 'Equipe de manutenção interna', manutencao_data_solicitacao: '2026-09-02', manutencao_data_conclusao: '', manutencao_tipo: 'PENDENTE', manutencao_status: 1 },
  ],
  ['ocorrencia_label', 'manutencao_responsavel', 'manutencao_descricao'],
  'manutencao_status',
);

export const avisoStore = createMock(
  'avisos',
  () => [
    { avisos_titulo: 'Manutenção programada do elevador — Bloco A', avisos_mensagem: 'O elevador do Bloco A ficará parado das 8h às 17h na próxima semana.', avisos_data_publicacao: '2026-09-05T08:00', avisos_data_expiracao: '2026-09-12T23:59', avisos_status: 1 },
    { avisos_titulo: 'Assembleia geral ordinária — 28/09', avisos_mensagem: 'Pauta: prestação de contas e eleição do conselho. Salão de festas, 20h.', avisos_data_publicacao: '2026-09-01T10:00', avisos_data_expiracao: '2026-09-28T20:00', avisos_status: 1 },
    { avisos_titulo: 'Dedetização das áreas comuns concluída', avisos_mensagem: 'Serviço finalizado. Áreas liberadas.', avisos_data_publicacao: '2026-08-20T09:00', avisos_data_expiracao: '2026-08-27T23:59', avisos_status: 0 },
  ],
  ['avisos_titulo', 'avisos_mensagem'],
  'avisos_status',
);

/**
 * Portal do morador: na primeira entrada de um morador, cria exemplos ligados a ele
 * (reservas e ocorrências) para a tela não ficar vazia na demonstração.
 */
export function semearPortal(moradorId: number, nome: string) {
  const jaTem = reservaStore.all().some((r) => r.reserva_morador_id === moradorId);
  if (jaTem) return;
  reservaStore.insertMany([
    { area_comum_id: 3, area_comum_label: 'Quadra Poliesportiva', reserva_morador_id: moradorId, morador_nome: nome, reserva_data_reserva: '2026-08-05', reserva_horario_inicio: '09:00', reserva_horario_fim: '10:00', reserva_tipo: 'CANCELADA', reserva_status: 0 },
    { area_comum_id: 2, area_comum_label: 'Churrasqueira 1', reserva_morador_id: moradorId, morador_nome: nome, reserva_data_reserva: '2026-09-21', reserva_horario_inicio: '12:00', reserva_horario_fim: '16:00', reserva_tipo: 'PENDENTE', reserva_status: 1 },
    { area_comum_id: 1, area_comum_label: 'Salão de Festas', reserva_morador_id: moradorId, morador_nome: nome, reserva_data_reserva: '2026-09-20', reserva_horario_inicio: '19:00', reserva_horario_fim: '23:00', reserva_tipo: 'CONFIRMADA', reserva_status: 1 },
  ]);
  ocorrenciaStore.insertMany([
    { ocorrencia_morador_id: moradorId, morador_nome: nome, ocorrencia_titulo: 'Lâmpada queimada no corredor B', ocorrencia_descricao: 'Corredor do 3º andar', ocorrencia_data_ocorrencia: '2026-09-02T18:00', ocorrencia_tipo: 'FINALIZADA', ocorrencia_status: 1 },
    { ocorrencia_morador_id: moradorId, morador_nome: nome, ocorrencia_titulo: 'Barulho excessivo — Apto 201', ocorrencia_descricao: 'Som alto após as 22h', ocorrencia_data_ocorrencia: '2026-09-08T22:40', ocorrencia_tipo: 'EM_ANDAMENTO', ocorrencia_status: 1 },
  ]);
}
