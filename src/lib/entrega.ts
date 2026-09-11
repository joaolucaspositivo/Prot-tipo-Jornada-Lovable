// Leituras da etapa de entrega. Nada é fixo: as etapas, prazos e a regra de
// presença vêm sempre da configuração do ciclo e da inscrição do docente.

import type {
  Devolutiva,
  Entrega,
  EstadoApp,
  Etapa,
  Pessoa,
} from "@/data/types";
import { etapasDoSegmento, prazoDaEtapa } from "@/lib/ciclo";

export const DESTINO_EQUIPE_CENTRAL = "equipe-central";

/** Etapas de entrega visíveis para o docente, na ordem configurada. */
export function etapasDeEntrega(estado: EstadoApp, pessoa: Pessoa): Etapa[] {
  const config = estado.cicloConfig;
  return etapasDoSegmento(
    config,
    config.cenarioSegmentacao === "trilha_por_segmento"
      ? pessoa.segmentoId
      : null,
  ).filter((e) => e.tipo === "entrega");
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
  if (pessoa.cargo === "corregente") {
    return {
      tipo: "equipe_central",
      rotulo: "Equipe central",
      responsavelId: DESTINO_EQUIPE_CENTRAL,
      explicacao:
        "Como corregente, sua entrega e sua devolutiva são conduzidas pela equipe central, e não pelo coordenador da unidade.",
    };
  }
  const coord = estado.pessoas.find((p) => p.id === pessoa.coordenadorId);
  return {
    tipo: "coordenador",
    rotulo: coord?.nome ?? "Coordenador da unidade",
    responsavelId: coord?.id ?? "coord-1",
    explicacao:
      "Como regente, sua entrega vai direto para o coordenador da sua unidade, que fará a devolutiva e observará a aula.",
  };
}

/** Janela válida para a data da aula a ser observada. */
export function janelaDaAula(estado: EstadoApp, etapa: Etapa) {
  const config = estado.cicloConfig;
  const seguintes = etapasDoSegmento(config, null).filter(
    (e) => e.ordem > etapa.ordem && e.tipo === "encontro",
  );
  const fim = seguintes[0]
    ? prazoDaEtapa(config, seguintes[0])
    : new Date(prazoDaEtapa(config, etapa).getTime() + 30 * 86400000);
  const hoje = new Date();
  const inicio = new Date(
    Math.max(hoje.getTime(), new Date(config.aberturaISO).getTime()),
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
    .map((entrega) => ({
      entrega,
      docente: estado.pessoas.find((p) => p.id === entrega.pessoaId),
      etapa: estado.cicloConfig.etapas.find((e) => e.id === entrega.etapaId),
      devolutiva: estado.devolutivas.find((d) => d.entregaId === entrega.id),
    }))
    .filter((item) => {
      if (filtro.apenasEquipeCentral)
        return item.entrega.destino === "equipe_central";
      if (filtro.coordenadorId) {
        return (
          item.entrega.destino === "coordenador" &&
          item.docente?.coordenadorId === filtro.coordenadorId
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
