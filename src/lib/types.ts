import type { ReactNode } from 'react';

// Registros chegam da API (camelCase) ou do mock (colunas snake_case); tratamos como mapas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Rec = Record<string, any>;

export interface Paged<T = Rec> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  busca?: string;
  filters?: Record<string, string | number | undefined>;
}

export interface Adapter {
  list(p: ListParams): Promise<Paged>;
  get(id: string | number): Promise<Rec>;
  create(v: Rec): Promise<Rec>;
  update(id: string | number, v: Rec): Promise<Rec>;
  remove(id: string | number): Promise<unknown>;
}

export interface Option {
  value: string | number;
  label: string;
}

export interface Column {
  key: string;
  label: string;
  render?: (row: Rec) => ReactNode;
  sortValue?: (row: Rec) => string | number;
  strong?: boolean;
}

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select' | 'radio' | 'toggle' | 'money' | 'password';

export interface FieldDef {
  name: string;
  label: string;
  col: string; // coluna do banco (mostrada junto ao rótulo, como no Figma)
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Option[];
  loadOptions?: () => Promise<Option[]>; // FK
  fkNote?: string;
  toggleTitle?: string;
  toggleHint?: string;
  half?: boolean;
  min?: number;
  step?: string;
  maxLength?: number;
  mode?: 'create' | 'edit'; // visível só nesse modo
}

export interface ChipFilter {
  label: string;
  filters: Record<string, string | number | undefined>;
}

export interface RelatedPanel {
  title: string;
  items: { icon: string; title: string; sub: string; to?: string }[];
  footer?: { label: string; to: string; hint?: string };
}

export interface ResourceConfig {
  key: string;
  path: string; // base da rota: /blocos
  singular: string; // "bloco"
  plural: string; // "Blocos"
  gender: 'm' | 'f';
  endpoint: string; // texto "GET /bloco"
  idKey: string;
  adapter: Adapter;
  columns: Column[];
  chips?: ChipFilter[];
  searchPlaceholder?: string;
  extraFilters?: Record<string, string | number | undefined>;
  enrich?: (rows: Rec[]) => Promise<Rec[]>;
  fields: FieldDef[];
  formTitle?: string;
  formSubtitle: string;
  defaults: Rec;
  toForm: (row: Rec) => Rec;
  toPayload: (values: Rec, mode: 'create' | 'edit') => Rec;
  rowTitle: (row: Rec) => string;
  idLabel: (row: Rec) => string; // "bloco_id #0001"
  hasDetail: boolean;
  hero?: {
    kind: string; // BLOCO / MORADOR...
    color: 'navy' | 'amber' | 'green' | 'pink';
    badges: (row: Rec) => string[];
    sub?: (row: Rec) => string;
  };
  detailTitle?: string;
  detailRows?: (row: Rec) => [string, ReactNode][];
  related?: (row: Rec, ctx: Rec) => Promise<RelatedPanel | null> | RelatedPanel | null;
  detailActions?: (row: Rec) => { label: string; to: string; primary?: boolean }[];
  statusOf: (row: Rec) => number | null; // 1/0 para ativar/desativar
  inactivate: { label: string; confirm: string }; // "Desativar"
  afterSave?: (saved: Rec, values: Rec, mode: 'create' | 'edit') => Promise<void>;
  extraFormSection?: 'vinculoAcesso';
  extraDetail?: (row: Rec, reload: () => void) => ReactNode;
  searchable?: boolean;
  urlFilters?: string[]; // parâmetros da URL que viram filtro (ex.: ?blocoId=1)
  selectFilters?: { param: string; label: string; load: () => Promise<Option[]> }[];
  localFilterKeys?: string[]; // filtros aplicados no navegador (a API não suporta)
  localFilter?: (row: Rec, key: string, value: string | number) => boolean;
  listSub?: string;
  mockTag?: boolean; // dados simulados
  newLabel?: string;
}
