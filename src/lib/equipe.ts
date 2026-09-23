// Leituras do acompanhamento da equipe pelo coordenador.
// Tudo deriva da configuração do ciclo: etapas, prazos e regras de alerta.

import type {
  Devolutiva,
  Entrega,
  EstadoApp,
  Etapa,
  Pessoa,
  TipoParticipacao,
} from "@/data/types";
import { cicloDoDocente, prazoDaEtapa } from "@/lib/ciclo";
import {
  progressoDaTrilha,
  proximaEtapa,
  trilhaDoDocente,
  type ItemTrilha,
} from "@/lib/jornada";

export type SituacaoDocente = "em_dia" | "pendente" | "atrasado" | "concluido";

export const ROTULO_SITUACAO: Record<SituacaoDocente, string> = {
  em_dia: "Em dia",
  pendente: "Pendente",
  atrasado: "Atrasado",
  concluido: "Concluído",
};

/** Uma entrega do docente já resolvida com a etapa e a devolutiva dela, quando houver. */
export interface EntregaDaLinha {
  etapa: Etapa | undefined;
  entrega: Entrega;
  devolutiva: Devolutiva | undefined;
}

export interface LinhaEquipe {
  pessoa: Pessoa;
  trilha: ItemTrilha[];
  etapaAtual: Etapa | undefined;
  percentual: number;
  concluidas: number;
  total: number;
  pendencias: number;
  prazoMaisProximo: Date | undefined;
  situacao: SituacaoDocente;
  /** dias de atraso na etapa atual, quando houver */
  diasAtraso: number;
  /** o atraso já ultrapassou o limite configurado para alertar o coordenador */
  alertaCoordenador: boolean;
  temaNome: string | undefined;
  turmaNome: string | undefined;
  /** regente ou corregente, resolvido pela inscrição (D34) */
  tipoParticipacao: TipoParticipacao;
  /**
   * TODAS as entregas do docente, mais antiga primeiro — plural (Pacote 2):
   * com mais de uma etapa `entrega`/`portfolio` na trilha (D52), pegar só a
   * mais recente escondia as demais do painel do coordenador.
   */
  entregasDoDocente: EntregaDaLinha[];
}

/** Docentes alocados a um coordenador (D35) — via `estado.alocacoes`, não mais um campo fixo na pessoa. */
export function docentesDoCoordenador(
  estado: EstadoApp,
  coordenadorId: string,
): Pessoa[] {
  const ids = new Set(
    estado.alocacoes
      .filter((a) => a.coordenadorId === coordenadorId)
      .map((a) => a.docenteId),
  );
  return estado.pessoas.filter((p) => p.perfil === "docente" && ids.has(p.id));
}

export function linhaDoDocente(
  estado: EstadoApp,
  pessoa: Pessoa,
  agora: Date = new Date(),
): LinhaEquipe {
  const { mesociclo, config: configDoCiclo } = cicloDoDocente(
    estado,
    pessoa.id,
  );
  const trilha = trilhaDoDocente(estado, pessoa, agora);
  const { concluidas, total, percentual } = progressoDaTrilha(trilha);
  const atual = proximaEtapa(trilha);
  const pendencias = trilha.filter(
    (i) => i.status !== "concluida" && i.status !== "bloqueada",
  ).length;

  const atrasada = trilha.find((i) => i.status === "atrasada");
  // Quando o prazo ainda não venceu mas a etapa está marcada como atrasada,
  // contamos o tempo parado desde a última movimentação do docente.
  const progressoAtrasado = atrasada
    ? estado.progressoEtapas.find(
        (p) => p.pessoaId === pessoa.id && p.etapaId === atrasada.etapa.id,
      )
    : undefined;
  const referencia = atrasada
    ? Math.min(
        atrasada.prazo.getTime(),
        progressoAtrasado
          ? new Date(progressoAtrasado.atualizadoEmISO).getTime()
          : atrasada.prazo.getTime(),
      )
    : 0;
  const diasAtraso = atrasada
    ? Math.max(0, Math.floor((agora.getTime() - referencia) / 86400000))
    : 0;
  // Alerta conforme a configuração da etapa. Em dados de demonstração com
  // prazos no futuro, a etapa marcada como atrasada já entra no alerta.
  const alertaCoordenador = Boolean(
    atrasada &&
    (diasAtraso >= atrasada.etapa.alerta.diasParaCoordenador ||
      atrasada.prazo > agora),
  );

  const situacao: SituacaoDocente =
    concluidas === total && total > 0
      ? "concluido"
      : atrasada
        ? "atrasado"
        : atual && atual.status === "em_andamento"
          ? "em_dia"
          : "pendente";

  const inscricao = estado.inscricoes.find((i) => i.pessoaId === pessoa.id);
  const turma = estado.turmas.find((t) => t.id === inscricao?.turmaId);
  const temaNome = estado.temas.find(
    (m) => m.id === (turma?.temaId ?? inscricao?.temaId),
  )?.nome;
  const tipoParticipacao: TipoParticipacao =
    inscricao?.tipoParticipacao ?? "regente";

  const entregasDoDocente: EntregaDaLinha[] = estado.entregas
    .filter((e) => e.pessoaId === pessoa.id)
    .sort((a, b) => a.enviadaEmISO.localeCompare(b.enviadaEmISO))
    .map((entrega) => ({
      etapa: configDoCiclo.etapas.find((e) => e.id === entrega.etapaId),
      entrega,
      devolutiva: estado.devolutivas.find((d) => d.entregaId === entrega.id),
    }));

  return {
    pessoa,
    trilha,
    etapaAtual: atual?.etapa,
    percentual,
    concluidas,
    total,
    pendencias,
    prazoMaisProximo: atual
      ? atual.prazo
      : trilha.length
        ? prazoDaEtapa(
            mesociclo.dataInicio,
            configDoCiclo,
            trilha[trilha.length - 1]!.etapa,
          )
        : undefined,
    situacao,
    diasAtraso,
    alertaCoordenador,
    temaNome,
    turmaNome: turma?.nome,
    tipoParticipacao,
    entregasDoDocente,
  };
}

/** Docentes inscritos em qualquer uma das turmas informadas — escopo do moderador (D33). */
function docentesDasTurmas(estado: EstadoApp, turmaIds: string[]): Pessoa[] {
  const turmas = new Set(turmaIds);
  const ids = new Set(
    estado.inscricoes
      .filter((i) => turmas.has(i.turmaId))
      .map((i) => i.pessoaId),
  );
  return estado.pessoas.filter((p) => p.perfil === "docente" && ids.has(p.id));
}

/**
 * Linhas da equipe do coordenador, da unidade do diretor, das turmas do
 * moderador, ou de todos (operadora).
 */
export function linhasDaEquipe(
  estado: EstadoApp,
  filtro: {
    coordenadorId?: string;
    unidade?: string;
    turmaIds?: string[];
  } = {},
): LinhaEquipe[] {
  const pessoas = filtro.coordenadorId
    ? docentesDoCoordenador(estado, filtro.coordenadorId)
    : filtro.unidade
      ? estado.pessoas.filter(
          (p) => p.perfil === "docente" && p.unidade === filtro.unidade,
        )
      : filtro.turmaIds
        ? docentesDasTurmas(estado, filtro.turmaIds)
        : estado.pessoas.filter((p) => p.perfil === "docente");
  return pessoas.map((p) => linhaDoDocente(estado, p));
}

export function contadores(linhas: LinhaEquipe[]) {
  return {
    emDia: linhas.filter((l) => l.situacao === "em_dia").length,
    pendentes: linhas.filter((l) => l.situacao === "pendente").length,
    atrasados: linhas.filter((l) => l.situacao === "atrasado").length,
    concluidos: linhas.filter((l) => l.situacao === "concluido").length,
  };
}

export type ColunaEquipe =
  | "nome"
  | "unidade"
  | "participacao"
  | "etapa"
  | "progresso"
  | "pendencias"
  | "prazo"
  | "situacao";

export function ordenar(
  linhas: LinhaEquipe[],
  coluna: ColunaEquipe,
  ascendente: boolean,
): LinhaEquipe[] {
  const valor = (l: LinhaEquipe): string | number => {
    switch (coluna) {
      case "nome":
        return l.pessoa.nome;
      case "unidade":
        return l.pessoa.unidade;
      case "participacao":
        return l.tipoParticipacao;
      case "etapa":
        return l.etapaAtual?.ordem ?? 999;
      case "progresso":
        return l.percentual;
      case "pendencias":
        return l.pendencias;
      case "prazo":
        return l.prazoMaisProximo?.getTime() ?? Number.MAX_SAFE_INTEGER;
      case "situacao":
        return ROTULO_SITUACAO[l.situacao];
    }
  };
  return [...linhas].sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "pt-BR");
    return ascendente ? cmp : -cmp;
  });
}
