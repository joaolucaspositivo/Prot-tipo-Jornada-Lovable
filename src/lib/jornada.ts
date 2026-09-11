// Leitura da trilha do docente. Tudo deriva da configuração do ciclo:
// nenhuma etapa, ordem, prazo ou conquista está fixa no código.

import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Upload,
  Users,
} from "lucide-react";

import type {
  Conquista,
  EstadoApp,
  Etapa,
  Pessoa,
  StatusEtapa,
  TelaEtapa,
  TipoCriterioAvanco,
  TipoEtapa,
} from "@/data/types";
import {
  criteriosDoDocente,
  etapaConcluidaPorCriterios,
  ofertaDoDocente,
} from "@/lib/avanco";
import { etapasDoSegmento, prazoDaEtapa } from "@/lib/ciclo";

export const ICONE_TIPO_ETAPA: Record<TipoEtapa, typeof BookOpen> = {
  autoavaliacao: ClipboardList,
  conteudo: BookOpen,
  entrega: Upload,
  encontro: Users,
  avaliacao: ClipboardCheck,
};

/** Rotas de docente já existentes no protótipo. */
export type RotaEtapa =
  | "/autoavaliacao"
  | "/percurso"
  | "/aulas"
  | "/entrega"
  | "/portfolio"
  | "/enquete";

export interface AcaoEtapa {
  rotulo: string;
  /** rota existente para o docente; quando ausente, a ação abre o painel */
  para?: RotaEtapa | undefined;
}

export interface ItemTrilha {
  etapa: Etapa;
  status: StatusEtapa;
  prazo: Date;
  /** por que a etapa está bloqueada, em linguagem direta */
  motivoBloqueio?: string | undefined;
  /** critério de avanço que ainda falta, para etapa de conteúdo com oferta */
  oQueFalta?: string | undefined;
  acao: AcaoEtapa;
}

/** Mapa total: toda TelaEtapa tem uma entrada, "painel" não tem rota própria. */
const ROTA_DA_TELA: Record<TelaEtapa, RotaEtapa | undefined> = {
  autoavaliacao: "/autoavaliacao",
  percurso: "/percurso",
  conteudo: "/aulas",
  entrega: "/entrega",
  portfolio: "/portfolio",
  enquete: "/enquete",
  painel: undefined,
};

function rotaDaEtapa(etapa: Etapa): RotaEtapa | undefined {
  return ROTA_DA_TELA[etapa.tela];
}

const FRASE_CRITERIO_PENDENTE: Record<TipoCriterioAvanco, string> = {
  aulas_assistidas: "assistir a todas as aulas",
  leitura_concluida: "concluir a leitura do texto-base",
  presenca: "atingir a presença mínima no encontro",
  tarefa_entregue: "entregar a tarefa",
  tarefa_validada: "ter a tarefa validada pelo professor",
};

function rotuloDaAcao(tipo: TipoEtapa, status: StatusEtapa): string {
  if (status === "concluida") return "Rever esta etapa";
  if (status === "bloqueada") return "Ver por que está bloqueada";
  switch (tipo) {
    case "autoavaliacao":
      return "Responder autoavaliação";
    case "conteudo":
      return "Assistir ao conteúdo";
    case "entrega":
      return "Enviar tarefa";
    case "encontro":
      return "Ver detalhes do encontro";
    case "avaliacao":
      return "Começar esta etapa";
  }
}

/** Etapas do docente, na ordem configurada, com status já calculado. */
export function trilhaDoDocente(
  estado: EstadoApp,
  pessoa: Pessoa,
  agora: Date = new Date(),
): ItemTrilha[] {
  const config = estado.cicloConfig;
  const etapas = etapasDoSegmento(
    config,
    config.cenarioSegmentacao === "trilha_por_segmento"
      ? pessoa.segmentoId
      : null,
  );

  const itens: ItemTrilha[] = [];
  let anteriorPendente: Etapa | null = null;

  etapas.forEach((etapa) => {
    const progresso = estado.progressoEtapas.find(
      (p) => p.pessoaId === pessoa.id && p.etapaId === etapa.id,
    );
    const prazo = prazoDaEtapa(config, etapa);

    // Etapa de conteúdo com oferta configurada conclui pelos critérios de
    // avanço OU pelo ProgressoEtapa gravado — nunca só pelos critérios: o
    // seed e todo progresso existente dependem do status persistido, e
    // trocar por substituição regrediria etapas já concluídas.
    const temOferta =
      etapa.tipo === "conteudo" &&
      ofertaDoDocente(estado, pessoa, etapa) !== undefined;
    const concluida =
      progresso?.status === "concluida" ||
      (temOferta && etapaConcluidaPorCriterios(estado, pessoa, etapa));

    let status: StatusEtapa;
    let motivoBloqueio: string | undefined;
    let oQueFalta: string | undefined;

    if (concluida) {
      status = "concluida";
    } else if (anteriorPendente) {
      status = "bloqueada";
      motivoBloqueio = `Libera quando você concluir a etapa "${anteriorPendente.nome}".`;
    } else if (progresso && progresso.status !== "nao_iniciada") {
      status =
        prazo < agora || progresso.status === "atrasada"
          ? "atrasada"
          : "em_andamento";
    } else {
      status = prazo < agora ? "atrasada" : "pendente";
    }

    if (temOferta && !concluida) {
      const pendente = criteriosDoDocente(estado, pessoa, etapa).find(
        (c) => !c.atendido,
      );
      if (pendente) {
        oQueFalta = `Falta ${FRASE_CRITERIO_PENDENTE[pendente.tipo]}.`;
      }
    }

    if (!concluida && !anteriorPendente && etapa.obrigatoria) {
      anteriorPendente = etapa;
    }

    itens.push({
      etapa,
      status,
      prazo,
      motivoBloqueio,
      oQueFalta,
      acao: {
        rotulo: rotuloDaAcao(etapa.tipo, status),
        para: rotaDaEtapa(etapa),
      },
    });
  });

  return itens;
}

/** Primeira etapa que ainda depende do docente. */
export function proximaEtapa(trilha: ItemTrilha[]): ItemTrilha | undefined {
  return trilha.find(
    (i) => i.status !== "concluida" && i.status !== "bloqueada",
  );
}

export function progressoDaTrilha(trilha: ItemTrilha[]) {
  const concluidas = trilha.filter((i) => i.status === "concluida").length;
  const total = trilha.length;
  const percentual = total === 0 ? 0 : Math.round((concluidas / total) * 100);
  return { concluidas, total, percentual };
}

export interface ConquistaTrilha {
  conquista: Conquista;
  etapa: Etapa | undefined;
  conquistada: boolean;
}

/** Insígnias do ciclo, derivadas das conquistas configuradas. */
export function conquistasDoDocente(
  estado: EstadoApp,
  pessoa: Pessoa,
): ConquistaTrilha[] {
  return estado.cicloConfig.conquistas.map((conquista) => {
    const etapa = estado.cicloConfig.etapas.find(
      (e) => e.id === conquista.etapaId,
    );
    const conquistada = estado.progressoEtapas.some(
      (p) =>
        p.pessoaId === pessoa.id &&
        p.etapaId === conquista.etapaId &&
        p.status === "concluida",
    );
    return { conquista, etapa, conquistada };
  });
}

export interface EventoEtapa {
  quando: string;
  titulo: string;
  detalhe?: string | undefined;
}

/** Histórico da própria etapa: progresso, presença, entrega e observação. */
export function historicoDaEtapa(
  estado: EstadoApp,
  pessoa: Pessoa,
  etapa: Etapa,
): EventoEtapa[] {
  const eventos: EventoEtapa[] = [];

  const progresso = estado.progressoEtapas.find(
    (p) => p.pessoaId === pessoa.id && p.etapaId === etapa.id,
  );
  if (progresso && progresso.status !== "nao_iniciada") {
    eventos.push({
      quando: progresso.atualizadoEmISO,
      titulo:
        progresso.status === "concluida"
          ? "Etapa concluída"
          : "Etapa iniciada por você",
    });
  }
  if (progresso?.presencaEmISO) {
    eventos.push({
      quando: progresso.presencaEmISO,
      titulo: "Presença registrada automaticamente",
      detalhe: "Registrada pelo envio da tarefa nesta modalidade.",
    });
  }

  estado.entregas
    .filter((e) => e.pessoaId === pessoa.id && e.etapaId === etapa.id)
    .forEach((entrega) => {
      eventos.push({
        quando: entrega.enviadaEmISO,
        titulo: "Tarefa enviada",
        detalhe:
          entrega.destino === "coordenador"
            ? "Encaminhada ao seu coordenador."
            : "Encaminhada à equipe central.",
      });
    });

  estado.observacoes
    .filter((o) => o.pessoaId === pessoa.id && o.etapaId === etapa.id)
    .forEach((obs) => {
      eventos.push({
        quando: obs.dataAulaISO,
        titulo: "Aula agendada para observação",
      });
      if (obs.realizadaEmISO) {
        eventos.push({
          quando: obs.realizadaEmISO,
          titulo: "Observação de aula realizada",
          detalhe: obs.comentario,
        });
      }
    });

  return eventos.sort((a, b) => a.quando.localeCompare(b.quando));
}

/** Devolutiva recebida nesta etapa, quando houver. */
export function devolutivaDaEtapa(
  estado: EstadoApp,
  pessoa: Pessoa,
  etapa: Etapa,
) {
  const entregas = estado.entregas.filter(
    (e) => e.pessoaId === pessoa.id && e.etapaId === etapa.id,
  );
  const ids = new Set(entregas.map((e) => e.id));
  const devolutiva = estado.devolutivas.find(
    (d) => d.pessoaId === pessoa.id && ids.has(d.entregaId),
  );
  if (!devolutiva) return undefined;
  const autor = estado.pessoas.find((p) => p.id === devolutiva.autorId);
  return { devolutiva, autorNome: autor?.nome ?? "Equipe central" };
}
