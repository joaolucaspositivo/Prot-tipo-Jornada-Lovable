// Leituras agregadas do ciclo para a equipe operadora.
// Nada aqui presume quantidade ou nome de etapas, macrotemas ou unidades:
// tudo é derivado da configuração em runtime e do estado persistido.

import type { EstadoApp, Etapa, Modalidade, Pessoa, Turma } from "@/data/types";
import { etapasEmOrdem } from "@/lib/ciclo";
import type { LinhaEquipe } from "@/lib/equipe";

export interface FiltroGestao {
  unidade?: string | undefined;
  macrotemaNome?: string | undefined;
  etapaId?: string | undefined;
}

export function aplicarFiltro(
  linhas: LinhaEquipe[],
  f: FiltroGestao,
): LinhaEquipe[] {
  return linhas.filter(
    (l) =>
      (!f.unidade || l.pessoa.unidade === f.unidade) &&
      (!f.macrotemaNome || l.macrotemaNome === f.macrotemaNome) &&
      (!f.etapaId || l.etapaAtual?.id === f.etapaId),
  );
}

export interface PassoFunil {
  etapa: Etapa;
  concluidas: number;
  emAndamento: number;
  naoIniciadas: number;
  total: number;
  percentual: number;
}

/** Funil das etapas: quantos docentes já passaram por cada uma. */
export function funilDeEtapas(
  estado: EstadoApp,
  linhas: LinhaEquipe[],
): PassoFunil[] {
  const etapas = etapasEmOrdem(estado.cicloConfig);
  return etapas.map((etapa) => {
    let concluidas = 0;
    let emAndamento = 0;
    linhas.forEach((l) => {
      const item = l.trilha.find((i) => i.etapa.id === etapa.id);
      if (!item) return;
      if (item.status === "concluida") concluidas += 1;
      else if (item.status !== "bloqueada" && item.status !== "nao_iniciada")
        emAndamento += 1;
    });
    const total = linhas.length;
    return {
      etapa,
      concluidas,
      emAndamento,
      naoIniciadas: Math.max(0, total - concluidas - emAndamento),
      total,
      percentual: total ? Math.round((concluidas / total) * 100) : 0,
    };
  });
}

export interface GrupoAgregado {
  chave: string;
  rotulo: string;
  docentes: number;
  percentualMedio: number;
  atrasados: number;
  concluidos: number;
}

function agrupar(
  linhas: LinhaEquipe[],
  chaveDe: (l: LinhaEquipe) => { chave: string; rotulo: string },
): GrupoAgregado[] {
  const mapa = new Map<string, { rotulo: string; itens: LinhaEquipe[] }>();
  linhas.forEach((l) => {
    const { chave, rotulo } = chaveDe(l);
    const atual = mapa.get(chave) ?? { rotulo, itens: [] };
    atual.itens.push(l);
    mapa.set(chave, atual);
  });
  return [...mapa.entries()]
    .map(([chave, { rotulo, itens }]) => ({
      chave,
      rotulo,
      docentes: itens.length,
      percentualMedio: Math.round(
        itens.reduce((s, i) => s + i.percentual, 0) / itens.length,
      ),
      atrasados: itens.filter((i) => i.situacao === "atrasado").length,
      concluidos: itens.filter((i) => i.situacao === "concluido").length,
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

export function porUnidade(linhas: LinhaEquipe[]): GrupoAgregado[] {
  return agrupar(linhas, (l) => ({
    chave: l.pessoa.unidade,
    rotulo: l.pessoa.unidade,
  }));
}

export function porMacrotema(linhas: LinhaEquipe[]): GrupoAgregado[] {
  return agrupar(linhas, (l) => ({
    chave: l.macrotemaNome ?? "sem-macrotema",
    rotulo: l.macrotemaNome ?? "Sem inscrição",
  }));
}

// ---------------------------------------------------------------- conferências

export type ConferenciaId =
  | "sem_inscricao"
  | "sem_tarefa"
  | "sem_presenca"
  | "sem_devolutiva"
  | "sem_ciencia";

export interface ItemConferencia {
  pessoa: Pessoa;
  detalhe: string;
}

export interface Conferencia {
  id: ConferenciaId;
  titulo: string;
  explicacao: string;
  itens: ItemConferencia[];
}

export function conferencias(
  estado: EstadoApp,
  linhas: LinhaEquipe[],
): Conferencia[] {
  const semInscricao: ItemConferencia[] = [];
  const semTarefa: ItemConferencia[] = [];
  const semPresenca: ItemConferencia[] = [];
  const semDevolutiva: ItemConferencia[] = [];
  const semCiencia: ItemConferencia[] = [];

  linhas.forEach((l) => {
    const inscricao = estado.inscricoes.find((i) => i.pessoaId === l.pessoa.id);
    if (!inscricao) {
      semInscricao.push({
        pessoa: l.pessoa,
        detalhe: "Ainda não escolheu macrotema e turma",
      });
    }

    const entregas = estado.entregas.filter((e) => e.pessoaId === l.pessoa.id);
    const etapaEntrega = l.trilha.find((i) => i.etapa.tipo === "entrega");
    if (entregas.length === 0 && etapaEntrega) {
      semTarefa.push({
        pessoa: l.pessoa,
        detalhe: `Sem envio em "${etapaEntrega.etapa.nome}"`,
      });
    }

    const temPresenca =
      estado.progressoEtapas.some(
        (p) => p.pessoaId === l.pessoa.id && p.presencaEmISO,
      ) ||
      estado.presencas.some(
        (p) => p.pessoaId === l.pessoa.id && (p.presente || p.justificada),
      );
    if (!temPresenca && entregas.length > 0) {
      semPresenca.push({
        pessoa: l.pessoa,
        detalhe: "Tarefa enviada, presença não registrada",
      });
    }

    entregas.forEach((entrega) => {
      const dev = estado.devolutivas.find((d) => d.entregaId === entrega.id);
      const etapa = estado.cicloConfig.etapas.find(
        (e) => e.id === entrega.etapaId,
      );
      if (!dev) {
        semDevolutiva.push({
          pessoa: l.pessoa,
          detalhe: `Aguarda devolutiva de ${
            entrega.destino === "equipe_central"
              ? "equipe central"
              : "coordenador"
          } · ${etapa?.nome ?? "etapa"}`,
        });
      } else if (!dev.cienciaEmISO) {
        semCiencia.push({
          pessoa: l.pessoa,
          detalhe: `Devolutiva disponível, sem ciência · ${etapa?.nome ?? "etapa"}`,
        });
      }
    });
  });

  return [
    {
      id: "sem_inscricao",
      titulo: "Não se inscreveram",
      explicacao: "Docentes sem macrotema e turma escolhidos neste ciclo.",
      itens: semInscricao,
    },
    {
      id: "sem_tarefa",
      titulo: "Não enviaram tarefa",
      explicacao: "Docentes sem nenhum envio na etapa de entrega.",
      itens: semTarefa,
    },
    {
      id: "sem_presenca",
      titulo: "Sem presença registrada",
      explicacao:
        "Enviaram tarefa, mas a modalidade não gerou presença automática.",
      itens: semPresenca,
    },
    {
      id: "sem_devolutiva",
      titulo: "Não receberam devolutiva",
      explicacao: "Entregas paradas com quem deveria devolver.",
      itens: semDevolutiva,
    },
    {
      id: "sem_ciencia",
      titulo: "Não deram ciência",
      explicacao: "Devolutiva disponível e ainda não lida pelo docente.",
      itens: semCiencia,
    },
  ];
}

// ------------------------------------------------------------------- turmas

export interface OcupacaoTurma {
  turma: Turma;
  macrotemaNome: string;
  modalidadeNome: string;
  /** objeto completo, não só o nome — usado para saber se a turma é síncrona */
  modalidade: Modalidade | undefined;
  livres: number;
  percentual: number;
  alerta: "esgotada" | "vazia" | undefined;
}

export function ocupacaoDasTurmas(estado: EstadoApp): OcupacaoTurma[] {
  return estado.turmas.map((turma) => {
    const livres = Math.max(0, turma.vagas - turma.vagasOcupadas);
    const modalidade = estado.cicloConfig.modalidades.find(
      (m) => m.id === turma.modalidadeId,
    );
    return {
      turma,
      macrotemaNome:
        estado.cicloConfig.macrotemas.find((m) => m.id === turma.macrotemaId)
          ?.nome ?? "Macrotema removido",
      modalidadeNome: modalidade?.nome ?? "Modalidade removida",
      modalidade,
      livres,
      percentual: turma.vagas
        ? Math.round((turma.vagasOcupadas / turma.vagas) * 100)
        : 0,
      alerta:
        livres === 0
          ? "esgotada"
          : turma.vagasOcupadas === 0
            ? "vazia"
            : undefined,
    };
  });
}

// ------------------------------------------------------------------ alertas

export interface AlertaDisparado {
  id: string;
  pessoaNome: string;
  unidade: string;
  titulo: string;
  descricao: string;
  quandoISO: string;
  tipo: string;
  /** antes do prazo / no vencimento / em atraso — plantado pelo seed, mesmo padrão do status "atrasada" */
  momento: "antes" | "vencimento" | "atraso" | undefined;
}

const TIPOS_ALERTA = new Set(["pendencia", "prazo_proximo"]);

/**
 * Lê os alertas já plantados em estado.notificacoes — não recalcula prazo
 * contra o relógio real. O cálculo dinâmico de "dias antes do prazo" (ver
 * lib/notificacoes.ts) não serve para esta demonstração: com
 * `cicloConfig.aberturaISO` em 2027, nenhum prazo cai perto da janela de
 * aviso sob a data real, exatamente como `trilhaDoDocente` já contorna isso
 * para o status "atrasada" usando o que está gravado, não o cálculo.
 */
export function alertasDisparados(estado: EstadoApp): AlertaDisparado[] {
  return estado.notificacoes
    .filter((n) => TIPOS_ALERTA.has(n.tipo))
    .map((n) => {
      const pessoa = estado.pessoas.find((p) => p.id === n.pessoaId);
      return {
        id: n.id,
        pessoaNome: pessoa?.nome ?? "Docente",
        unidade: pessoa?.unidade ?? "—",
        titulo: n.titulo,
        descricao: n.descricao,
        quandoISO: n.criadaEmISO,
        tipo: n.tipo,
        momento: n.momento,
      };
    })
    .sort((a, b) => b.quandoISO.localeCompare(a.quandoISO));
}

// --------------------------------------------------------------- exportação

export function csvDosDocentes(linhas: LinhaEquipe[]): string {
  const cabecalho = [
    "Docente",
    "Matrícula",
    "Unidade",
    "Cargo",
    "Macrotema",
    "Turma",
    "Etapa atual",
    "Progresso (%)",
    "Pendências",
    "Situação",
  ];
  const corpo = linhas.map((l) => [
    l.pessoa.nome,
    l.pessoa.matricula,
    l.pessoa.unidade,
    l.tipoParticipacao,
    l.macrotemaNome ?? "",
    l.turmaNome ?? "",
    l.etapaAtual?.nome ?? "Trilha concluída",
    String(l.percentual),
    String(l.pendencias),
    l.situacao,
  ]);
  return [cabecalho, ...corpo]
    .map((linha) => linha.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}

export function baixarCSV(nome: string, conteudo: string) {
  const blob = new Blob(["\uFEFF" + conteudo], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
