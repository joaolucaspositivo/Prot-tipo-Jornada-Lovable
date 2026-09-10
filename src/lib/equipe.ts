// Leituras do acompanhamento da equipe pelo coordenador.
// Tudo deriva da configuração do ciclo: etapas, prazos e regras de alerta.

import type {
  Devolutiva,
  Entrega,
  EstadoApp,
  Etapa,
  Pessoa,
} from "@/data/types";
import { prazoDaEtapa } from "@/lib/ciclo";
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
  macrotemaNome: string | undefined;
  turmaNome: string | undefined;
  entrega: Entrega | undefined;
  devolutiva: Devolutiva | undefined;
}

/** Docentes sob a liderança de um coordenador. */
export function docentesDoCoordenador(
  estado: EstadoApp,
  coordenadorId: string,
): Pessoa[] {
  return estado.pessoas.filter(
    (p) => p.perfil === "docente" && p.coordenadorId === coordenadorId,
  );
}

export function linhaDoDocente(
  estado: EstadoApp,
  pessoa: Pessoa,
  agora: Date = new Date(),
): LinhaEquipe {
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
  const macrotemaNome = estado.cicloConfig.macrotemas.find(
    (m) => m.id === (turma?.macrotemaId ?? inscricao?.macrotemaId),
  )?.nome;

  const entrega = estado.entregas
    .filter((e) => e.pessoaId === pessoa.id)
    .sort((a, b) => b.enviadaEmISO.localeCompare(a.enviadaEmISO))[0];
  const devolutiva = entrega
    ? estado.devolutivas.find((d) => d.entregaId === entrega.id)
    : undefined;

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
        ? prazoDaEtapa(estado.cicloConfig, trilha[trilha.length - 1]!.etapa)
        : undefined,
    situacao,
    diasAtraso,
    alertaCoordenador,
    macrotemaNome,
    turmaNome: turma?.nome,
    entrega,
    devolutiva,
  };
}

/** Linhas da equipe do coordenador (ou de todos, para a operadora). */
export function linhasDaEquipe(
  estado: EstadoApp,
  filtro: { coordenadorId?: string } = {},
): LinhaEquipe[] {
  const pessoas = filtro.coordenadorId
    ? docentesDoCoordenador(estado, filtro.coordenadorId)
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
  | "cargo"
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
      case "cargo":
        return l.pessoa.cargo;
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
