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

/** Índice 0 = domingo ... 6 = sábado, igual a Turma.diasSemana. */
export const ROTULO_DIA_SEMANA = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

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

/** Docentes inscritos em uma turma (impacto de remover ou reduzir vagas). */
export function usoDaTurma(estado: EstadoApp, turmaId: string) {
  return {
    inscricoes: estado.inscricoes.filter((i) => i.turmaId === turmaId).length,
  };
}

/** Docentes inscritos em uma turma específica, para o Sheet de presença. */
export function docentesDaTurma(estado: EstadoApp, turmaId: string) {
  const idsInscritos = new Set(
    estado.inscricoes
      .filter((i) => i.turmaId === turmaId)
      .map((i) => i.pessoaId),
  );
  return estado.pessoas.filter((p) => idsInscritos.has(p.id));
}

/** Se um passo do modo guiado da Configuração do Ciclo está travado. */
export function passoGuiadoTravado(
  estado: EstadoApp,
  passo: string,
  segmentacaoDecidida: boolean,
): boolean {
  const config = estado.cicloConfig;
  if (passo === "modalidades") return macrotemasAtivos(config).length === 0;
  if (passo === "turmas") {
    return (
      macrotemasAtivos(config).length === 0 ||
      config.modalidades.filter((m) => m.ativa).length === 0
    );
  }
  if (passo === "etapas") return !segmentacaoDecidida;
  if (passo === "conteudo") {
    return !config.etapas.some((e) => e.tipo === "conteudo");
  }
  return false;
}

export interface ResumoConferenciaCiclo {
  macrotemasAtivos: number;
  modalidadesAtivas: number;
  totalTurmas: number;
  totalVagas: number;
  etapasEmOrdem: string[];
  ofertasComConteudo: number;
  ofertasVazias: number;
}

/** Resumo do ciclo para o passo de Conferência do modo guiado (3.4). */
export function resumoConferenciaCiclo(
  estado: EstadoApp,
): ResumoConferenciaCiclo {
  const config = estado.cicloConfig;
  const etapasEmOrdem = [...config.etapas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((e) => e.nome);

  const itensPorOferta = new Map<string, number>();
  for (const item of estado.itensConteudo) {
    itensPorOferta.set(
      item.ofertaId,
      (itensPorOferta.get(item.ofertaId) ?? 0) + 1,
    );
  }
  let ofertasComConteudo = 0;
  let ofertasVazias = 0;
  for (const oferta of estado.ofertas) {
    if ((itensPorOferta.get(oferta.id) ?? 0) > 0) ofertasComConteudo += 1;
    else ofertasVazias += 1;
  }

  return {
    macrotemasAtivos: macrotemasAtivos(config).length,
    modalidadesAtivas: config.modalidades.filter((m) => m.ativa).length,
    totalTurmas: estado.turmas.length,
    totalVagas: estado.turmas.reduce((soma, t) => soma + t.vagas, 0),
    etapasEmOrdem,
    ofertasComConteudo,
    ofertasVazias,
  };
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
