// Leituras da tela do moderador (D49/D50): sempre escopadas a UMA turma e
// UMA etapa por vez — nunca a trilha inteira do docente. D49 tira o
// moderador da visão de jornada completa; escopar por turma+etapa, em vez
// de reaproveitar a leitura de trilha usada por coordenador/operadora,
// é o que torna essa restrição estrutural, não uma coluna a menos.

import type {
  Entrega,
  EstadoApp,
  Etapa,
  OfertaConteudo,
  Pessoa,
  Turma,
} from "@/data/types";
import {
  cicloDaTurma,
  docentesDaTurma,
  encontrosDaTurma,
  etapasEmOrdem,
} from "@/lib/ciclo";
import {
  aulasConcluidas,
  entregaDaEtapa,
  leituraDaEtapa,
} from "@/lib/conteudo";
import { encontrosRegistrados, itensDaOferta } from "@/lib/avanco";

function ofertaDaTurma(
  estado: EstadoApp,
  turma: Turma,
  etapaId: string,
): OfertaConteudo | undefined {
  return estado.ofertas.find(
    (o) =>
      o.etapaId === etapaId &&
      o.temaId === turma.temaId &&
      o.modalidadeId === turma.modalidadeId,
  );
}

/**
 * Etapas com algo para o moderador validar nesta turma: de conteúdo, só as
 * que têm oferta cadastrada para o tema × modalidade da turma; de
 * entrega/portfólio, todas — não são gateadas por oferta neste modelo.
 * Etapas de autoavaliação, escolha, enquete e encontro (tela "painel", sem
 * oferta e sem Entrega) ficam de fora por não termos o que mostrar, não por
 * bloqueio de perfil.
 */
export function etapasParaValidacao(estado: EstadoApp, turma: Turma): Etapa[] {
  const { config } = cicloDaTurma(estado, turma);
  return etapasEmOrdem(config).filter((e) => {
    if (e.tipo === "conteudo")
      return Boolean(ofertaDaTurma(estado, turma, e.id));
    return e.tipo === "entrega" || e.tipo === "portfolio";
  });
}

export interface ColunasEtapa {
  video: boolean;
  texto: boolean;
  /** presença como progresso (D51) — só quando a modalidade prevê encontro
   * ao vivo E a etapa tem oferta cadastrada (sem oferta, nunca houve como
   * lançar presença contra este etapaId). */
  presenca: boolean;
  /** status de entrega (docente/moderador) — tarefa cadastrada na oferta,
   * ou etapa do tipo entrega/portfólio. */
  entrega: boolean;
}

export function colunasDaEtapa(
  estado: EstadoApp,
  turma: Turma,
  etapa: Etapa,
): ColunasEtapa {
  const oferta = ofertaDaTurma(estado, turma, etapa.id);
  const itens = oferta ? itensDaOferta(estado, oferta.id) : [];
  const { config } = cicloDaTurma(estado, turma);
  const modalidade = config.modalidades.find(
    (m) => m.id === turma.modalidadeId,
  );
  return {
    video: itens.some((i) => i.tipo === "video"),
    texto: itens.some((i) => i.tipo === "texto"),
    presenca: Boolean(oferta) && (modalidade?.preveEncontroAoVivo ?? false),
    entrega:
      itens.some((i) => i.tipo === "tarefa") ||
      etapa.tipo === "entrega" ||
      etapa.tipo === "portfolio",
  };
}

export type StatusEntregaDocente = "pendente" | "entregue";
export type StatusEntregaModerador =
  "validacao_pendente" | "devolutiva_realizada";

export interface LinhaValidacao {
  pessoa: Pessoa;
  /** "2 de 3" — undefined quando a coluna não existe para esta etapa */
  videoDetalhe: string | undefined;
  /** 0 a 100 — undefined quando a coluna não existe */
  textoPercentual: number | undefined;
  /** "3 de 4 encontros" — undefined quando a coluna não existe */
  presencaDetalhe: string | undefined;
  entrega: Entrega | undefined;
  statusDocente: StatusEntregaDocente | undefined;
  statusModerador: StatusEntregaModerador | undefined;
  nota: number | undefined;
}

/** Uma linha por docente da turma, só com as colunas que fazem sentido
 * para a etapa selecionada (`colunasDaEtapa`). */
export function linhasDeValidacao(
  estado: EstadoApp,
  turma: Turma,
  etapa: Etapa,
): LinhaValidacao[] {
  const colunas = colunasDaEtapa(estado, turma, etapa);
  const oferta = ofertaDaTurma(estado, turma, etapa.id);
  const itens = oferta ? itensDaOferta(estado, oferta.id) : [];
  const totalVideos = itens.filter((i) => i.tipo === "video").length;
  const totalEncontros = colunas.presenca
    ? encontrosDaTurma(estado, turma.id).length
    : 0;

  return docentesDaTurma(estado, turma.id).map((pessoa) => {
    const entrega = colunas.entrega
      ? entregaDaEtapa(estado, pessoa.id, etapa.id)
      : undefined;
    const devolutiva = entrega
      ? estado.devolutivas.find((d) => d.entregaId === entrega.id)
      : undefined;

    return {
      pessoa,
      videoDetalhe: colunas.video
        ? `${aulasConcluidas(estado, pessoa.id, etapa.id).size} de ${totalVideos}`
        : undefined,
      textoPercentual: colunas.texto
        ? (leituraDaEtapa(estado, pessoa.id, etapa.id)?.percentual ?? 0)
        : undefined,
      presencaDetalhe: colunas.presenca
        ? `${encontrosRegistrados(estado, pessoa.id, turma.id, etapa.id)} de ${totalEncontros}`
        : undefined,
      entrega,
      statusDocente: colunas.entrega
        ? entrega
          ? "entregue"
          : "pendente"
        : undefined,
      statusModerador:
        colunas.entrega && entrega
          ? devolutiva
            ? "devolutiva_realizada"
            : "validacao_pendente"
          : undefined,
      nota: devolutiva?.nota,
    };
  });
}
