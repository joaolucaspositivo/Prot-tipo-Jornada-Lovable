// Regras de avanço de fase da etapa de conteúdo (D15). Tudo aqui é função
// pura sobre EstadoApp — nenhum componente calcula critério por conta própria.
//
// Este módulo NÃO importa de `@/lib/jornada`: é `jornada.ts` que importa
// daqui (trilhaDoDocente usa etapaConcluidaPorCriterios). Importar de volta
// criaria um ciclo.

import type {
  CriterioAvanco,
  EstadoApp,
  Etapa,
  ItemConteudo,
  OfertaConteudo,
  Pessoa,
  TipoCriterioAvanco,
} from "@/data/types";
import {
  aulasConcluidas,
  entregaDaEtapa,
  leituraDaEtapa,
  percursoDoDocente,
  presencaDaEtapa,
} from "@/lib/conteudo";

export interface StatusCriterio {
  tipo: TipoCriterioAvanco;
  /** "Aulas assistidas" */
  rotulo: string;
  /** "2 de 4", "80% lido", "3 de 4 encontros" */
  detalhe: string;
  /** 0 a 100, para a barra de progresso */
  percentual: number;
  atendido: boolean;
}

const ROTULO_CRITERIO: Record<TipoCriterioAvanco, string> = {
  aulas_assistidas: "Aulas assistidas",
  leitura_concluida: "Leitura do texto-base",
  presenca: "Presença no encontro",
  tarefa_entregue: "Tarefa entregue",
  tarefa_validada: "Tarefa validada",
};

/** A oferta do docente nesta etapa, conforme a turma em que ele se inscreveu. */
export function ofertaDoDocente(
  estado: EstadoApp,
  pessoa: Pessoa,
  etapa: Etapa,
): OfertaConteudo | undefined {
  const { macrotemaId, modalidadeId } = percursoDoDocente(estado, pessoa);
  if (!macrotemaId || !modalidadeId) return undefined;
  return estado.ofertas.find(
    (o) =>
      o.etapaId === etapa.id &&
      o.macrotemaId === macrotemaId &&
      o.modalidadeId === modalidadeId,
  );
}

export function itensDaOferta(
  estado: EstadoApp,
  ofertaId: string,
): ItemConteudo[] {
  return estado.itensConteudo
    .filter((i) => i.ofertaId === ofertaId)
    .sort((a, b) => a.ordem - b.ordem);
}

/** Encontros distintos em que o docente foi contado presente (ou liberado). */
export function encontrosRegistrados(
  estado: EstadoApp,
  pessoaId: string,
  turmaId: string,
  etapaId: string,
): number {
  return new Set(
    estado.presencas
      .filter(
        (p) =>
          p.pessoaId === pessoaId &&
          p.turmaId === turmaId &&
          p.etapaId === etapaId &&
          (p.presente || p.justificada),
      )
      .map((p) => p.encontro),
  ).size;
}

/** Percentual de presença do docente na turma, para a etapa (modalidade síncrona). */
export function percentualPresenca(
  estado: EstadoApp,
  pessoa: Pessoa,
  etapa: Etapa,
): number {
  const { turma } = percursoDoDocente(estado, pessoa);
  if (!turma || !turma.encontrosPrevistos) return 0;
  const feitos = encontrosRegistrados(estado, pessoa.id, turma.id, etapa.id);
  return Math.min(100, Math.round((feitos / turma.encontrosPrevistos) * 100));
}

function statusDoCriterio(
  estado: EstadoApp,
  pessoa: Pessoa,
  etapa: Etapa,
  ofertaId: string,
  criterio: CriterioAvanco,
): StatusCriterio {
  const rotulo = ROTULO_CRITERIO[criterio.tipo];
  switch (criterio.tipo) {
    case "aulas_assistidas": {
      const videos = itensDaOferta(estado, ofertaId).filter(
        (i) => i.tipo === "video",
      );
      const feitas = aulasConcluidas(estado, pessoa.id, etapa.id);
      const assistidas = videos.filter((v) => feitas.has(v.id)).length;
      const total = Math.max(1, videos.length);
      return {
        tipo: criterio.tipo,
        rotulo,
        detalhe: `${assistidas} de ${videos.length}`,
        percentual: Math.round((assistidas / total) * 100),
        atendido: videos.length > 0 && assistidas >= videos.length,
      };
    }
    case "leitura_concluida": {
      const percentual =
        leituraDaEtapa(estado, pessoa.id, etapa.id)?.percentual ?? 0;
      return {
        tipo: criterio.tipo,
        rotulo,
        detalhe: `${percentual}% lido`,
        percentual,
        atendido: percentual >= 100,
      };
    }
    case "presenca": {
      const { modalidade, turma } = percursoDoDocente(estado, pessoa);
      if (modalidade?.presencaAutomatica) {
        const atendido =
          presencaDaEtapa(estado, pessoa.id, etapa.id) !== undefined;
        return {
          tipo: criterio.tipo,
          rotulo,
          detalhe: atendido
            ? "Presença automática registrada"
            : "Presença automática pendente",
          percentual: atendido ? 100 : 0,
          atendido,
        };
      }
      const minimo = criterio.percentualMinimo ?? 0;
      const previstos = turma?.encontrosPrevistos ?? 0;
      const feitos = turma
        ? encontrosRegistrados(estado, pessoa.id, turma.id, etapa.id)
        : 0;
      const percentual =
        previstos > 0
          ? Math.min(100, Math.round((feitos / previstos) * 100))
          : 0;
      return {
        tipo: criterio.tipo,
        rotulo,
        detalhe:
          previstos > 0
            ? `${feitos} de ${previstos} encontros`
            : "Sem encontros previstos",
        percentual,
        atendido: previstos > 0 && percentual >= minimo,
      };
    }
    case "tarefa_entregue": {
      const entrega = entregaDaEtapa(estado, pessoa.id, etapa.id);
      return {
        tipo: criterio.tipo,
        rotulo,
        detalhe: entrega ? "Entregue" : "Ainda não entregue",
        percentual: entrega ? 100 : 0,
        atendido: Boolean(entrega),
      };
    }
    case "tarefa_validada": {
      const entrega = entregaDaEtapa(estado, pessoa.id, etapa.id);
      const devolutiva = entrega
        ? estado.devolutivas.find((d) => d.entregaId === entrega.id)
        : undefined;
      const notaCorte = criterio.notaCorte ?? 0;
      const nota = devolutiva?.nota;
      const atendido = nota !== undefined && nota >= notaCorte;
      return {
        tipo: criterio.tipo,
        rotulo,
        detalhe: nota !== undefined ? `Nota ${nota}` : "Sem nota lançada",
        percentual: atendido ? 100 : 0,
        atendido,
      };
    }
  }
}

/** Situação de cada critério ativo da oferta, para renderizar os medidores. */
export function criteriosDoDocente(
  estado: EstadoApp,
  pessoa: Pessoa,
  etapa: Etapa,
): StatusCriterio[] {
  const oferta = ofertaDoDocente(estado, pessoa, etapa);
  if (!oferta) return [];
  return oferta.criterios
    .filter((c) => c.ativo)
    .map((c) => statusDoCriterio(estado, pessoa, etapa, oferta.id, c));
}

/**
 * true quando todos os critérios ativos estão atendidos.
 * Sem oferta, ou com oferta sem nenhum critério ativo, devolve `false` —
 * é a etapa continuar dependendo só de `ProgressoEtapa` (comportamento
 * sequencial anterior), não uma conclusão automática por vácuo.
 */
export function etapaConcluidaPorCriterios(
  estado: EstadoApp,
  pessoa: Pessoa,
  etapa: Etapa,
): boolean {
  const criterios = criteriosDoDocente(estado, pessoa, etapa);
  if (criterios.length === 0) return false;
  return criterios.every((c) => c.atendido);
}
