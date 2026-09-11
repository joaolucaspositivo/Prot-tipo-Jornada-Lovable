// Leituras da etapa de conteúdo. Nada é fixo: a etapa, a turma e a regra de
// presença vêm sempre da configuração do ciclo e da inscrição do docente.

import type { EstadoApp, Etapa, Modalidade, Pessoa, Turma } from "@/data/types";
import { etapasDoSegmento } from "@/lib/ciclo";

/** Etapas de conteúdo visíveis para o docente, na ordem configurada. */
export function etapasDeConteudo(estado: EstadoApp, pessoa: Pessoa): Etapa[] {
  const config = estado.cicloConfig;
  return etapasDoSegmento(
    config,
    config.cenarioSegmentacao === "trilha_por_segmento"
      ? pessoa.segmentoId
      : null,
  ).filter((e) => e.tipo === "conteudo");
}

export interface PercursoDoDocente {
  turma: Turma | undefined;
  modalidade: Modalidade | undefined;
  macrotemaNome: string | undefined;
  /** id do macrotema da inscrição — usado para casar a oferta, nunca o nome */
  macrotemaId: string | undefined;
  /** id da modalidade da turma — usado para casar a oferta, nunca o nome */
  modalidadeId: string | undefined;
}

export function percursoDoDocente(
  estado: EstadoApp,
  pessoa: Pessoa,
): PercursoDoDocente {
  const inscricao = estado.inscricoes.find((i) => i.pessoaId === pessoa.id);
  const turma = estado.turmas.find((t) => t.id === inscricao?.turmaId);
  const macrotemaId = turma?.macrotemaId ?? inscricao?.macrotemaId;
  const modalidade = estado.cicloConfig.modalidades.find(
    (m) => m.id === turma?.modalidadeId,
  );
  const macrotemaNome = estado.cicloConfig.macrotemas.find(
    (m) => m.id === macrotemaId,
  )?.nome;
  return {
    turma,
    modalidade,
    macrotemaNome,
    macrotemaId,
    modalidadeId: turma?.modalidadeId,
  };
}

export function aulasConcluidas(
  estado: EstadoApp,
  pessoaId: string,
  etapaId: string,
): Set<string> {
  return new Set(
    estado.progressoAulas
      .filter((p) => p.pessoaId === pessoaId && p.etapaId === etapaId)
      .map((p) => p.aulaId),
  );
}

export function leituraDaEtapa(
  estado: EstadoApp,
  pessoaId: string,
  etapaId: string,
) {
  return estado.progressoLeituras.find(
    (p) => p.pessoaId === pessoaId && p.etapaId === etapaId,
  );
}

export function entregaDaEtapa(
  estado: EstadoApp,
  pessoaId: string,
  etapaId: string,
) {
  return estado.entregas.find(
    (e) => e.pessoaId === pessoaId && e.etapaId === etapaId,
  );
}

export function presencaDaEtapa(
  estado: EstadoApp,
  pessoaId: string,
  etapaId: string,
): string | undefined {
  return estado.progressoEtapas.find(
    (p) => p.pessoaId === pessoaId && p.etapaId === etapaId,
  )?.presencaEmISO;
}

export interface RegistroPresenca {
  pessoa: Pessoa;
  etapa: Etapa | undefined;
  turma: Turma | undefined;
  modalidade: Modalidade | undefined;
  quandoISO: string;
}

/**
 * Presenças registradas automaticamente pelo envio da tarefa, derivadas de
 * `ProgressoEtapa.presencaEmISO`. Não inclui as lançadas à mão na
 * modalidade síncrona — essas ficam em `estado.presencas` (D16).
 */
export function presencasAutomaticas(
  estado: EstadoApp,
  filtro?: { coordenadorId?: string | undefined },
): RegistroPresenca[] {
  return estado.progressoEtapas
    .filter((p) => Boolean(p.presencaEmISO))
    .map((p) => {
      const pessoa = estado.pessoas.find((x) => x.id === p.pessoaId);
      const inscricao = estado.inscricoes.find(
        (i) => i.pessoaId === p.pessoaId,
      );
      const turma = estado.turmas.find((t) => t.id === inscricao?.turmaId);
      return {
        pessoa,
        etapa: estado.cicloConfig.etapas.find((e) => e.id === p.etapaId),
        turma,
        modalidade: estado.cicloConfig.modalidades.find(
          (m) => m.id === turma?.modalidadeId,
        ),
        quandoISO: p.presencaEmISO!,
      };
    })
    .filter((r): r is RegistroPresenca => {
      if (!r.pessoa) return false;
      if (filtro?.coordenadorId) {
        return r.pessoa.coordenadorId === filtro.coordenadorId;
      }
      return true;
    })
    .sort((a, b) => b.quandoISO.localeCompare(a.quandoISO));
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
