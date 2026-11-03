// Rótulos legíveis para os campos exibidos nas telas de detalhe (a API usa nomes de coluna; o usuário não precisa vê-los).
const ROTULOS: Record<string, string> = {
  area_comum_capacidade: "Capacidade",
  area_comum_descricao: "Descrição",
  area_comum_nome: "Nome",
  area_comum_status: "Status",
  bloco_descricao: "Descrição",
  bloco_id: "Bloco",
  bloco_nome: "Nome",
  bloco_status: "Status",
  boleto_data_emissao: "Emissão do boleto",
  boleto_linha_digitavel: "Linha digitável",
  cobranca_competencia: "Competência",
  cobranca_data_criacao: "Criada em",
  cobranca_descricao: "Descrição",
  cobranca_status: "Status",
  cobranca_tipo: "Situação",
  cobranca_valor: "Valor",
  cobranca_vencimento: "Vencimento",
  "estado (derivado)": "Situação da relação",
  imovel: "Imóvel",
  imovel_IPTU: "IPTU",
  imovel_andar: "Andar",
  imovel_area_m2: "Área",
  imovel_garagem: "Vagas de garagem",
  imovel_matricula: "Matrícula",
  imovel_numero: "Número",
  imovel_status: "Status",
  imovel_tipo: "Tipo",
  morador: "Morador",
  morador_cpf: "CPF",
  morador_data_cadastro: "Cadastrado em",
  morador_data_nascimento: "Nascimento",
  morador_deficiencia_locomocao: "Deficiência de locomoção",
  morador_email: "E-mail",
  morador_imovel_data_fim: "Fim da relação",
  morador_imovel_data_inicio: "Início da relação",
  morador_imovel_status: "Status",
  morador_imovel_tipo_relacao: "Tipo de relação",
  morador_nome: "Nome",
  morador_telefone: "Telefone",
  ocorrencia_data_ocorrencia: "Data",
  ocorrencia_descricao: "Descrição",
  ocorrencia_morador_id: "Reportada por",
  ocorrencia_status: "Status",
  ocorrencia_tipo: "Situação",
  ocorrencia_titulo: "Título",
  usuario_id: "Acesso ao portal",
};

/** Converte um nome de coluna em texto para o usuário. Sem entrada no mapa: troca "_" por espaço. */
export function rotulo(k: string): string {
  if (ROTULOS[k]) return ROTULOS[k];
  if (!k.includes("_")) return k;
  const t = k.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
