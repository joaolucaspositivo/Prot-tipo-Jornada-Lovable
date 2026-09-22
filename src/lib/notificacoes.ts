import type { EstadoApp, Notificacao, Pessoa } from "@/data/types";

import { cicloConfigAtivo } from "./ciclo";
import { linhasDaEquipe } from "./equipe";
import { trilhaDoDocente } from "./jornada";
import { compromissosDeObservacao, pendentesDoCoordenador } from "./observacao";

export const ROTULO_TIPO_NOTIFICACAO: Record<Notificacao["tipo"], string> = {
  mudanca_etapa: "Mudança de etapa",
  entrega_recebida: "Tarefa recebida",
  devolutiva: "Devolutiva",
  prazo_proximo: "Prazo próximo",
  pendencia: "Pendência",
};

const DIA = 24 * 60 * 60 * 1000;
/** Quantos dias antes do prazo o docente é avisado. */
const JANELA_AVISO_DIAS = 7;

function dias(de: Date, ate: Date): number {
  return Math.ceil((ate.getTime() - de.getTime()) / DIA);
}

function formatarData(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

/**
 * Avisos que nascem do próprio andamento do ciclo (prazo chegando, prazo
 * vencido). São recalculados a cada visita, então não ficam desatualizados.
 */
function derivadas(
  estado: EstadoApp,
  pessoa: Pessoa,
  agora: Date,
): Notificacao[] {
  const lista: Notificacao[] = [];
  const config = cicloConfigAtivo(estado);

  if (pessoa.perfil === "docente") {
    estado.progressoEtapas
      .filter((p) => p.pessoaId === pessoa.id && p.status === "concluida")
      .forEach((p) => {
        const etapa = config.etapas.find((e) => e.id === p.etapaId);
        if (!etapa) return;
        lista.push({
          id: `der-etapa-${pessoa.id}-${etapa.id}`,
          pessoaId: pessoa.id,
          titulo: `Etapa concluída: ${etapa.nome}`,
          descricao:
            "Você avançou na sua jornada. A próxima etapa já está liberada.",
          criadaEmISO: p.atualizadoEmISO,
          lida: false,
          tipo: "mudanca_etapa",
        });
      });

    trilhaDoDocente(estado, pessoa, agora).forEach((item) => {
      if (item.status === "concluida" || item.status === "bloqueada") return;
      const faltam = dias(agora, item.prazo);
      if (item.status === "atrasada" || faltam < 0) {
        lista.push({
          id: `der-atraso-${pessoa.id}-${item.etapa.id}`,
          pessoaId: pessoa.id,
          titulo: `Prazo vencido: ${item.etapa.nome}`,
          descricao: `O prazo era ${formatarData(item.prazo)}. Você ainda pode concluir esta etapa.`,
          criadaEmISO: item.prazo.toISOString(),
          lida: false,
          tipo: "pendencia",
        });
      } else if (faltam <= JANELA_AVISO_DIAS) {
        lista.push({
          id: `der-prazo-${pessoa.id}-${item.etapa.id}`,
          pessoaId: pessoa.id,
          titulo: `Prazo próximo: ${item.etapa.nome}`,
          descricao: `Faltam ${faltam} dia(s): o prazo é ${formatarData(item.prazo)}.`,
          criadaEmISO: agora.toISOString(),
          lida: false,
          tipo: "prazo_proximo",
        });
      }
    });
  }

  if (pessoa.perfil === "coordenador") {
    const linhas = linhasDaEquipe(estado, { coordenadorId: pessoa.id });
    linhas
      .filter((l) => l.alertaCoordenador)
      .forEach((l) => {
        lista.push({
          id: `der-equipe-${pessoa.id}-${l.pessoa.id}`,
          pessoaId: pessoa.id,
          titulo: `${l.pessoa.nome} está com etapa atrasada`,
          descricao:
            l.diasAtraso > 0
              ? `${l.etapaAtual?.nome ?? "Etapa atual"} · ${l.diasAtraso} dia(s) de atraso.`
              : `${l.etapaAtual?.nome ?? "Etapa atual"} · prazo vencido.`,
          criadaEmISO: agora.toISOString(),
          lida: false,
          tipo: "pendencia",
        });
      });

    const compromissos = compromissosDeObservacao(estado, {
      coordenadorId: pessoa.id,
    });
    pendentesDoCoordenador(compromissos).forEach((c) => {
      lista.push({
        id: `der-obs-${pessoa.id}-${c.id}`,
        pessoaId: pessoa.id,
        titulo: "Parecer de observação em aberto",
        descricao: `A aula de ${c.docente?.nome ?? "um docente"} já aconteceu e ainda não tem parecer registrado.`,
        criadaEmISO: c.dataAula.toISOString(),
        lida: false,
        tipo: "pendencia",
      });
    });
  }

  return lista;
}

/** Notificações da pessoa: as gravadas mais as calculadas, sem repetição. */
export function notificacoesDaPessoa(
  estado: EstadoApp,
  pessoa: Pessoa,
  agora: Date = new Date(),
): Notificacao[] {
  const gravadas = estado.notificacoes.filter((n) => n.pessoaId === pessoa.id);
  const idsGravados = new Set(gravadas.map((n) => n.id));
  const novas = derivadas(estado, pessoa, agora).filter(
    (n) => !idsGravados.has(n.id),
  );
  return [...gravadas, ...novas].sort((a, b) =>
    b.criadaEmISO.localeCompare(a.criadaEmISO),
  );
}

export function naoLidas(lista: Notificacao[]): number {
  return lista.filter((n) => !n.lida).length;
}

/**
 * Marca como lida. Avisos calculados ainda não gravados entram na lista
 * gravada já lidos, para não voltarem a aparecer.
 */
export function marcarLida(
  estado: EstadoApp,
  notificacao: Notificacao,
): EstadoApp {
  const existe = estado.notificacoes.some((n) => n.id === notificacao.id);
  return {
    ...estado,
    notificacoes: existe
      ? estado.notificacoes.map((n) =>
          n.id === notificacao.id ? { ...n, lida: true } : n,
        )
      : [...estado.notificacoes, { ...notificacao, lida: true }],
  };
}

export function marcarTodasLidas(
  estado: EstadoApp,
  lista: Notificacao[],
): EstadoApp {
  return lista.reduce((acc, n) => (n.lida ? acc : marcarLida(acc, n)), estado);
}

export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const d = new Date(iso);
  const minutos = Math.round((agora.getTime() - d.getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const d2 = Math.round(horas / 24);
  if (d2 < 30) return `há ${d2} dia(s)`;
  return d.toLocaleDateString("pt-BR");
}
