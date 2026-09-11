// Leituras derivadas da configuração do ciclo.
// Nenhuma tela deve presumir quantidade, ordem ou nomes: tudo vem daqui.

import type {
  CicloConfig,
  EstadoApp,
  Etapa,
  Macrotema,
  TelaEtapa,
  TipoEtapa,
} from "@/data/types";

export const ROTULO_TIPO_ETAPA: Record<TipoEtapa, string> = {
  autoavaliacao: "Autoavaliação",
  conteudo: "Conteúdo",
  entrega: "Entrega de tarefa",
  encontro: "Encontro",
  avaliacao: "Avaliação",
};

export const TIPOS_ETAPA: TipoEtapa[] = [
  "autoavaliacao",
  "conteudo",
  "entrega",
  "encontro",
  "avaliacao",
];

export const ROTULO_TELA_ETAPA: Record<TelaEtapa, string> = {
  autoavaliacao: "Autoavaliação",
  percurso: "Escolha do percurso",
  conteudo: "Conteúdo (Aulas e texto-base)",
  entrega: "Envio da tarefa",
  portfolio: "Portfólio do ciclo",
  enquete: "Enquete 360°",
  painel: "Nenhuma — abre um painel de detalhes",
};

export const TELAS_ETAPA: TelaEtapa[] = [
  "autoavaliacao",
  "percurso",
  "conteudo",
  "entrega",
  "portfolio",
  "enquete",
  "painel",
];

/** Etapas visíveis para um segmento, já na ordem configurada. */
export function etapasDoSegmento(
  config: CicloConfig,
  segmentoId: string | null,
): Etapa[] {
  const ordenadas = [...config.etapas].sort((a, b) => a.ordem - b.ordem);
  if (config.cenarioSegmentacao === "trilha_unica" || !segmentoId) {
    return ordenadas;
  }
  return ordenadas.filter(
    (e) => e.segmentos.length === 0 || e.segmentos.includes(segmentoId),
  );
}

export function macrotemasAtivos(config: CicloConfig): Macrotema[] {
  return [...config.macrotemas]
    .filter((m) => m.ativo)
    .sort((a, b) => a.ordem - b.ordem);
}

/** Data limite de uma etapa, contada a partir da abertura do ciclo. */
export function prazoDaEtapa(config: CicloConfig, etapa: Etapa): Date {
  const abertura = new Date(config.aberturaISO);
  abertura.setDate(abertura.getDate() + etapa.prazoDias);
  return abertura;
}

export function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Quantos docentes já têm progresso registrado em uma etapa. */
export function docentesComProgressoNaEtapa(
  estado: EstadoApp,
  etapaId: string,
): number {
  const pessoas = new Set(
    estado.progressoEtapas
      .filter((p) => p.etapaId === etapaId && p.status !== "nao_iniciada")
      .map((p) => p.pessoaId),
  );
  return pessoas.size;
}

/** Turmas e inscrições que dependem de um macrotema. */
export function usoDoMacrotema(estado: EstadoApp, macrotemaId: string) {
  const turmas = estado.turmas.filter((t) => t.macrotemaId === macrotemaId);
  const idsTurmas = new Set(turmas.map((t) => t.id));
  const inscricoes = estado.inscricoes.filter(
    (i) => i.macrotemaId === macrotemaId || idsTurmas.has(i.turmaId),
  );
  return { turmas: turmas.length, inscricoes: inscricoes.length };
}

/** Turmas e inscrições que dependem de uma modalidade. */
export function usoDaModalidade(estado: EstadoApp, modalidadeId: string) {
  const turmas = estado.turmas.filter((t) => t.modalidadeId === modalidadeId);
  const idsTurmas = new Set(turmas.map((t) => t.id));
  const inscricoes = estado.inscricoes.filter((i) => idsTurmas.has(i.turmaId));
  return { turmas: turmas.length, inscricoes: inscricoes.length };
}

/** Reordena um array movendo um item de posição e recalcula `ordem`. */
export function moverItem<T>(itens: T[], de: number, para: number): T[] {
  const copia = [...itens];
  const [item] = copia.splice(de, 1);
  if (!item) return itens;
  copia.splice(para, 0, item);
  return copia;
}

export function reindexar<T extends { ordem: number }>(itens: T[]): T[] {
  return itens.map((item, i) => ({ ...item, ordem: i + 1 }));
}

export function novoId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 8)}`;
}
