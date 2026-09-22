// Agenda de observação de aula. Nada é agendado à mão: cada compromisso nasce
// da data informada pelo docente na entrega do planejamento.

import type {
  CicloConfig,
  Entrega,
  EstadoApp,
  Etapa,
  Observacao,
  Pessoa,
  Tema,
  Turma,
} from "@/data/types";
import {
  cicloDaTurma,
  coordenadoresDoDocente,
  etapasEmOrdem,
} from "@/lib/ciclo";
import { DESTINO_EQUIPE_CENTRAL } from "@/lib/entrega";

/** Critérios observáveis do parecer, com escala curta e explícita. */
export const CRITERIOS_OBSERVACAO = [
  { id: "intencionalidade", rotulo: "Intencionalidade pedagógica da aula" },
  { id: "mediacao", rotulo: "Mediação e condução das intervenções" },
  { id: "engajamento", rotulo: "Engajamento e participação dos estudantes" },
  { id: "avaliacao", rotulo: "Verificação da aprendizagem durante a aula" },
] as const;

export const ESCALA_OBSERVACAO = [
  { valor: 1, rotulo: "Precisa de apoio" },
  { valor: 2, rotulo: "Em desenvolvimento" },
  { valor: 3, rotulo: "Consolidado" },
  { valor: 4, rotulo: "Referência" },
];

export type SituacaoCompromisso = "agendada" | "realizada" | "pendente";

export const ROTULO_SITUACAO_COMPROMISSO: Record<SituacaoCompromisso, string> =
  {
    agendada: "A observar",
    realizada: "Observada",
    pendente: "Parecer pendente",
  };

export interface Compromisso {
  id: string;
  entrega: Entrega;
  docente: Pessoa | undefined;
  etapaEntrega: Etapa | undefined;
  etapaObservacao: Etapa | undefined;
  turma: Turma | undefined;
  tema: Tema | undefined;
  dataAula: Date;
  observacao: Observacao | undefined;
  situacao: SituacaoCompromisso;
  daEquipeCentral: boolean;
}

/**
 * Etapa de observação configurada (tipo `encontro` seguinte à entrega).
 * Recebe a config já resolvida pelo chamador — precisa ser a mesma de onde
 * `etapaEntrega` veio, nunca a vigente por conta própria.
 */
export function etapaDeObservacao(
  config: CicloConfig,
  etapaEntrega: Etapa | undefined,
): Etapa | undefined {
  const etapas = etapasEmOrdem(config).filter((e) => e.tipo === "encontro");
  if (!etapaEntrega) return etapas[0];
  return (
    etapas.find((e) => e.ordem > etapaEntrega.ordem) ??
    etapas[etapas.length - 1]
  );
}

function chave(dataISO: string): string {
  return dataISO.slice(0, 10);
}

/**
 * Compromissos de observação do coordenador (ou de todos, para a operadora).
 * As aulas dos corregentes ficam com a equipe central.
 */
export function compromissosDeObservacao(
  estado: EstadoApp,
  filtro: { coordenadorId?: string; todos?: boolean } = {},
): Compromisso[] {
  const agora = new Date();

  return estado.entregas
    .filter((e) => Boolean(e.dataAulaISO))
    .map((entrega): Compromisso => {
      const docente = estado.pessoas.find((p) => p.id === entrega.pessoaId);
      const inscricao = estado.inscricoes.find(
        (i) => i.pessoaId === entrega.pessoaId,
      );
      const turma = estado.turmas.find((t) => t.id === inscricao?.turmaId);
      // Por item, pela turma do docente — a agenda atende docentes de
      // ciclos diferentes ao mesmo tempo.
      const { config } = cicloDaTurma(estado, turma);
      const etapaEntrega = config.etapas.find((e) => e.id === entrega.etapaId);
      const etapaObservacao = etapaDeObservacao(config, etapaEntrega);
      const tema = estado.temas.find(
        (m) => m.id === (inscricao?.temaId ?? turma?.temaId),
      );
      const observacao = estado.observacoes.find(
        (o) =>
          o.pessoaId === entrega.pessoaId &&
          (!etapaObservacao || o.etapaId === etapaObservacao.id),
      );
      const dataAula = new Date(entrega.dataAulaISO!);
      const situacao: SituacaoCompromisso = observacao?.realizadaEmISO
        ? "realizada"
        : dataAula < agora
          ? "pendente"
          : "agendada";

      return {
        id: `comp-${entrega.id}`,
        entrega,
        docente,
        etapaEntrega,
        etapaObservacao,
        turma,
        tema,
        dataAula,
        observacao,
        situacao,
        daEquipeCentral: entrega.destino === "equipe_central",
      };
    })
    .filter((c) => {
      if (filtro.todos) return true;
      if (filtro.coordenadorId) {
        return (
          !c.daEquipeCentral &&
          c.docente !== undefined &&
          coordenadoresDoDocente(estado, c.docente.id).some(
            (co) => co.id === filtro.coordenadorId,
          )
        );
      }
      return true;
    })
    .sort((a, b) => a.dataAula.getTime() - b.dataAula.getTime());
}

export function responsavelDoCompromisso(c: Compromisso): string {
  return c.daEquipeCentral ? DESTINO_EQUIPE_CENTRAL : "coordenador";
}

export interface DiaCalendario {
  data: Date;
  doMes: boolean;
  compromissos: Compromisso[];
}

/** Grade mensal completa, começando no domingo. */
export function gradeDoMes(
  referencia: Date,
  compromissos: Compromisso[],
): DiaCalendario[] {
  const porDia = new Map<string, Compromisso[]>();
  compromissos.forEach((c) => {
    const k = chave(c.dataAula.toISOString());
    porDia.set(k, [...(porDia.get(k) ?? []), c]);
  });

  const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const inicio = new Date(primeiro);
  inicio.setDate(1 - primeiro.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return {
      data,
      doMes: data.getMonth() === referencia.getMonth(),
      compromissos: porDia.get(local.toISOString().slice(0, 10)) ?? [],
    };
  });
}

/** Compromissos dos próximos sete dias, a partir de hoje. */
export function daSemana(compromissos: Compromisso[]): Compromisso[] {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio.getTime() + 7 * 86400000);
  return compromissos.filter((c) => c.dataAula >= inicio && c.dataAula < fim);
}

export function pendentesDoCoordenador(
  compromissos: Compromisso[],
): Compromisso[] {
  return compromissos.filter((c) => c.situacao === "pendente");
}

export const NOMES_MES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const NOMES_DIA_CURTOS = [
  "dom",
  "seg",
  "ter",
  "qua",
  "qui",
  "sex",
  "sáb",
];
