// Leituras da etapa de entrega. Nada é fixo: as etapas, prazos e a regra de
// presença vêm sempre da configuração do ciclo e da inscrição do docente.

import type {
  Devolutiva,
  Entrega,
  EstadoApp,
  Etapa,
  Pessoa,
} from "@/data/types";
import {
  cicloDaTurma,
  cicloDoDocente,
  coordenadoresDoDocente,
  coordenadorPrincipalDoDocente,
  etapasEmOrdem,
  prazoDaEtapa,
  tipoParticipacaoDaPessoa,
} from "@/lib/ciclo";

export const DESTINO_EQUIPE_CENTRAL = "equipe-central";

/** Etapas de entrega do docente, na ordem configurada. */
export function etapasDeEntrega(estado: EstadoApp, pessoaId: string): Etapa[] {
  return etapasEmOrdem(cicloDoDocente(estado, pessoaId).config).filter(
    (e) => e.tipo === "entrega",
  );
}

export interface DestinoEntrega {
  tipo: Entrega["destino"];
  rotulo: string;
  responsavelId: string;
  explicacao: string;
}

/**
 * Regente entrega ao coordenador da unidade; corregente entrega à equipe
 * central. A regra é do desenho pedagógico e aparece nos dois lados da tela.
 */
export function destinoDaEntrega(
  estado: EstadoApp,
  pessoa: Pessoa,
): DestinoEntrega {
  if (tipoParticipacaoDaPessoa(estado, pessoa.id) === "corregente") {
    return {
      tipo: "equipe_central",
      rotulo: "Equipe central",
      responsavelId: DESTINO_EQUIPE_CENTRAL,
      explicacao:
        "Como corregente, sua entrega e sua devolutiva são conduzidas pela equipe central, e não pelo coordenador da unidade.",
    };
  }
  const coord = coordenadorPrincipalDoDocente(estado, pessoa.id);
  return {
    tipo: "coordenador",
    rotulo: coord?.nome ?? "Coordenador da unidade",
    responsavelId: coord?.id ?? "coord-1",
    explicacao:
      "Como regente, sua entrega vai direto para o coordenador da sua unidade, que fará a devolutiva e observará a aula.",
  };
}

/** Janela válida para a data da aula a ser observada. */
export function janelaDaAula(
  estado: EstadoApp,
  pessoaId: string,
  etapa: Etapa,
) {
  const { mesociclo, config } = cicloDoDocente(estado, pessoaId);
  const seguintes = etapasEmOrdem(config).filter(
    (e) => e.ordem > etapa.ordem && e.tipo === "encontro",
  );
  const fim = seguintes[0]
    ? prazoDaEtapa(mesociclo.dataInicio, config, seguintes[0])
    : new Date(
        prazoDaEtapa(mesociclo.dataInicio, config, etapa).getTime() +
          30 * 86400000,
      );
  const hoje = new Date();
  const inicio = new Date(
    Math.max(hoje.getTime(), new Date(mesociclo.dataInicio).getTime()),
  );
  return { inicio, fim };
}

export function validarDataAula(
  valor: string,
  janela: { inicio: Date; fim: Date },
): string | null {
  if (!valor) return "Informe a data e o horário da aula a ser observada.";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data inválida.";
  if (data < janela.inicio)
    return "A aula precisa acontecer a partir de hoje, para que possa ser observada.";
  if (data > janela.fim)
    return "A data está fora da janela de prazo desta etapa. Escolha uma data anterior ao limite indicado.";
  return null;
}

export function entregaDoDocente(
  estado: EstadoApp,
  pessoaId: string,
  etapaId: string,
): Entrega | undefined {
  return estado.entregas.find(
    (e) => e.pessoaId === pessoaId && e.etapaId === etapaId,
  );
}

export function devolutivaDaEntrega(
  estado: EstadoApp,
  entregaId: string | undefined,
): Devolutiva | undefined {
  if (!entregaId) return undefined;
  return estado.devolutivas.find((d) => d.entregaId === entregaId);
}

export const ROTULO_STATUS_ENTREGA: Record<Entrega["status"], string> = {
  enviada: "Enviada",
  em_analise: "Em análise",
  devolutiva_disponivel: "Devolutiva disponível",
};

/**
 * Opções de parecer conforme o tipo da etapa configurada. Compartilhada
 * entre `DetalheDocente` (coordenador/operadora/diretor) e o detalhe de
 * entrega do moderador — mesma escala, dois lugares que dão devolutiva.
 *
 * `portfolio` ao lado de `entrega` de propósito: antes do rename de D30/v3,
 * o Portfólio de Inovação Docente usava `tipo: "entrega"` por engano, e
 * quem dá devolutiva já usa esta escala pra ele — corrigir a mistipagem
 * sem manter este case tiraria uma função em uso, não uma mistipagem.
 */
export function pareceresDaEtapa(etapa: Etapa | undefined): string[] {
  if (!etapa) return [];
  switch (etapa.tipo) {
    case "entrega":
    case "portfolio":
      return ["Atende", "Atende parcialmente", "Não atende"];
    case "encontro":
      return ["Destaque", "Adequado", "A desenvolver"];
    default:
      return [];
  }
}

export interface EntregaRecebida {
  entrega: Entrega;
  docente: Pessoa | undefined;
  etapa: Etapa | undefined;
  devolutiva: Devolutiva | undefined;
}

/**
 * Entregas que chegam a quem corrige, sem link colado à mão em outro lugar.
 * `coordenadorId` filtra a equipe; `apenasEquipeCentral` mostra as dos
 * corregentes, que não passam pelo coordenador da unidade.
 */
export function entregasRecebidas(
  estado: EstadoApp,
  filtro: { coordenadorId?: string; apenasEquipeCentral?: boolean } = {},
): EntregaRecebida[] {
  return estado.entregas
    .map((entrega) => {
      // Por item, pela turma do docente da entrega — a lista atende
      // docentes de ciclos diferentes ao mesmo tempo.
      const inscricao = estado.inscricoes.find(
        (i) => i.pessoaId === entrega.pessoaId,
      );
      const turma = inscricao
        ? estado.turmas.find((t) => t.id === inscricao.turmaId)
        : undefined;
      const { config } = cicloDaTurma(estado, turma);
      return {
        entrega,
        docente: estado.pessoas.find((p) => p.id === entrega.pessoaId),
        etapa: config.etapas.find((e) => e.id === entrega.etapaId),
        devolutiva: estado.devolutivas.find((d) => d.entregaId === entrega.id),
      };
    })
    .filter((item) => {
      if (filtro.apenasEquipeCentral)
        return item.entrega.destino === "equipe_central";
      if (filtro.coordenadorId) {
        return (
          item.entrega.destino === "coordenador" &&
          item.docente !== undefined &&
          coordenadoresDoDocente(estado, item.docente.id).some(
            (c) => c.id === filtro.coordenadorId,
          )
        );
      }
      return true;
    })
    .sort((a, b) =>
      b.entrega.enviadaEmISO.localeCompare(a.entrega.enviadaEmISO),
    );
}

export function formatarTamanho(bytes: number | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function paraInputDateTime(data: Date): string {
  const ajustada = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return ajustada.toISOString().slice(0, 16);
}
