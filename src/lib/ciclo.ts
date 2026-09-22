// Leituras derivadas da configuração do ciclo.
// Nenhuma tela deve presumir quantidade, ordem ou nomes: tudo vem daqui.

import type {
  CicloConfig,
  EstadoApp,
  Etapa,
  Pessoa,
  TelaEtapa,
  Tema,
  TipoEtapa,
  TipoParticipacao,
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

/** Etapas do ciclo, na ordem configurada (D26: segmentação removida). */
export function etapasEmOrdem(config: CicloConfig): Etapa[] {
  return [...config.etapas].sort((a, b) => a.ordem - b.ordem);
}

export function temasAtivos(config: CicloConfig): Tema[] {
  return [...config.temas]
    .filter((m) => m.ativo)
    .sort((a, b) => a.ordem - b.ordem);
}

/**
 * Data limite de uma etapa. Encadeada (D38): cada etapa conta seus
 * `prazoDias` a partir do vencimento da etapa anterior, começando de
 * `dataInicioCiclo` — não mais um deslocamento fixo desde a abertura.
 */
export function prazoDaEtapa(config: CicloConfig, etapa: Etapa): Date {
  const ordenadas = etapasEmOrdem(config);
  let data = new Date(config.dataInicioCiclo);
  for (const e of ordenadas) {
    data = new Date(data);
    data.setDate(data.getDate() + e.prazoDias);
    if (e.id === etapa.id) return data;
  }
  // Etapa fora da lista configurada (não deveria acontecer): mesma conta,
  // isolada, a partir do início do ciclo.
  const isolado = new Date(config.dataInicioCiclo);
  isolado.setDate(isolado.getDate() + etapa.prazoDias);
  return isolado;
}

/** Tipo de participação do docente (regente/corregente), resolvido pela
 * inscrição atual — deixou de ser um atributo fixo da pessoa (D34). Sem
 * inscrição ainda, assume "regente": ele simplesmente não escolheu. */
export function tipoParticipacaoDaPessoa(
  estado: EstadoApp,
  pessoaId: string,
): TipoParticipacao {
  return (
    estado.inscricoes.find((i) => i.pessoaId === pessoaId)?.tipoParticipacao ??
    "regente"
  );
}

/** Coordenadores que alocaram este docente como liderado (D35) — um docente
 * pode ter mais de um líder. */
export function coordenadoresDoDocente(
  estado: EstadoApp,
  docenteId: string,
): Pessoa[] {
  const ids = estado.alocacoes
    .filter((a) => a.docenteId === docenteId)
    .map((a) => a.coordenadorId);
  return estado.pessoas.filter((p) => ids.includes(p.id));
}

/** Líder principal do docente — a alocação mais recente — para quando só
 * um destino é possível (ex.: roteamento de entrega). */
export function coordenadorPrincipalDoDocente(
  estado: EstadoApp,
  docenteId: string,
): Pessoa | undefined {
  const alocacao = [...estado.alocacoes]
    .filter((a) => a.docenteId === docenteId)
    .sort((a, b) => b.criadaEmISO.localeCompare(a.criadaEmISO))[0];
  if (!alocacao) return undefined;
  return estado.pessoas.find((p) => p.id === alocacao.coordenadorId);
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

/** Turmas e inscrições que dependem de um tema. */
export function usoDoTema(estado: EstadoApp, temaId: string) {
  const turmas = estado.turmas.filter((t) => t.temaId === temaId);
  const idsTurmas = new Set(turmas.map((t) => t.id));
  const inscricoes = estado.inscricoes.filter(
    (i) => i.temaId === temaId || idsTurmas.has(i.turmaId),
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
export function passoGuiadoTravado(estado: EstadoApp, passo: string): boolean {
  const config = estado.cicloConfig;
  if (passo === "modalidades") return temasAtivos(config).length === 0;
  if (passo === "turmas") {
    return (
      temasAtivos(config).length === 0 ||
      config.modalidades.filter((m) => m.ativa).length === 0
    );
  }
  if (passo === "conteudo") {
    return !config.etapas.some((e) => e.tipo === "conteudo");
  }
  return false;
}

export interface ResumoConferenciaCiclo {
  temasAtivos: number;
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
    temasAtivos: temasAtivos(config).length,
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
