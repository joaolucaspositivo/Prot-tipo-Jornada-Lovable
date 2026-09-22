// Leituras derivadas da configuração do ciclo.
// Nenhuma tela deve presumir quantidade, ordem ou nomes: tudo vem daqui.

import type {
  CicloConfig,
  EstadoApp,
  Etapa,
  FaseCanonica,
  FormularioVersao,
  Mesociclo,
  Pessoa,
  TelaEtapa,
  Tema,
  TipoEtapa,
  TipoParticipacao,
  Turma,
} from "@/data/types";

/**
 * Ciclo vigente: quem decide é a operadora, via `Macrociclo.mesocicloVigenteId`
 * (tela de macrociclo) — não é calculado por data.
 *
 * REGRA (vale para todo o app): havendo turma em mãos — direto ou via
 * inscrição —, a configuração vem SEMPRE do mesociclo dela, nunca da
 * vigente (`cicloDaTurma`/`cicloDoDocente` abaixo). `cicloAtivo` só é a
 * fonte correta onde não existe turma nem inscrição: a escolha inicial do
 * percurso, e chrome de tela que não é dado de nenhum docente específico
 * (cabeçalho do AppShell, filtros de página da operadora/coordenador).
 */
export function cicloAtivo(estado: EstadoApp): {
  mesociclo: Mesociclo;
  config: CicloConfig;
} {
  const macrociclo = estado.macrociclos[0]!;
  const mesociclo =
    estado.mesociclos.find((m) => m.id === macrociclo.mesocicloVigenteId) ??
    estado.mesociclos[0]!;
  const config =
    estado.cicloConfigs.find((c) => c.mesocicloId === mesociclo.id) ??
    estado.cicloConfigs[0]!;
  return { mesociclo, config };
}

/** Atalho para quem só precisa da config do ciclo vigente, sem a data. */
export function cicloConfigAtivo(estado: EstadoApp): CicloConfig {
  return cicloAtivo(estado).config;
}

/**
 * Config do mesociclo de uma turma específica. Use esta função (não
 * `cicloDoDocente`) sempre que a turma já estiver resolvida no chamador —
 * por exemplo dentro de um loop que atende vários docentes — para não
 * repetir a busca inscrição→turma a cada item.
 */
export function cicloDaTurma(
  estado: EstadoApp,
  turma: Turma | undefined,
): { mesociclo: Mesociclo; config: CicloConfig } {
  if (turma) {
    const mesociclo = estado.mesociclos.find((m) => m.id === turma.mesocicloId);
    const config = estado.cicloConfigs.find(
      (c) => c.mesocicloId === turma.mesocicloId,
    );
    if (mesociclo && config) return { mesociclo, config };
  }
  return cicloAtivo(estado);
}

/**
 * Config do ciclo de um docente: resolve a turma pela inscrição e delega a
 * `cicloDaTurma`. Sem inscrição (ou sem turma associada), cai no vigente —
 * é a escolha inicial, antes de a inscrição existir.
 */
export function cicloDoDocente(
  estado: EstadoApp,
  pessoaId: string,
): { mesociclo: Mesociclo; config: CicloConfig } {
  const inscricao = estado.inscricoes.find((i) => i.pessoaId === pessoaId);
  const turma = inscricao
    ? estado.turmas.find((t) => t.id === inscricao.turmaId)
    : undefined;
  return cicloDaTurma(estado, turma);
}

export const ROTULO_TIPO_ETAPA: Record<TipoEtapa, string> = {
  escolha: "Escolha de tema e turma",
  autoavaliacao: "Autoavaliação",
  conteudo: "Conteúdo",
  encontro: "Encontro",
  entrega: "Entrega de tarefa",
  enquete: "Enquete 360°",
  portfolio: "Portfólio",
  encerramento: "Encerramento",
};

export const TIPOS_ETAPA: TipoEtapa[] = [
  "escolha",
  "autoavaliacao",
  "conteudo",
  "encontro",
  "entrega",
  "enquete",
  "portfolio",
  "encerramento",
];

/**
 * Fase padrão de cada tipo (D59) — só sugestão para quando uma etapa nasce.
 * `Etapa.faseCanonica` é campo próprio e editável; nada relê este mapa
 * depois que a etapa existe.
 */
export const FASE_PADRAO_POR_TIPO: Record<TipoEtapa, FaseCanonica> = {
  escolha: "inscricao",
  autoavaliacao: "autoavaliacao",
  conteudo: "formacao",
  encontro: "formacao",
  entrega: "formacao",
  enquete: "encerramento",
  portfolio: "encerramento",
  encerramento: "encerramento",
};

export const ROTULO_TELA_ETAPA: Record<TelaEtapa, string> = {
  autoavaliacao: "Autoavaliação",
  percurso: "Escolha do percurso",
  conteudo: "Conteúdo (Aulas e texto-base)",
  entrega: "Envio da tarefa",
  portfolio: "Portfólio do ciclo",
  enquete: "Enquete 360°",
  painel: "Nenhuma — abre um painel de detalhes",
};

/** Índice 0 = domingo ... 6 = sábado, igual a Turma.diasSemana. */
export const ROTULO_DIA_SEMANA = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

export const TELAS_ETAPA: TelaEtapa[] = [
  "autoavaliacao",
  "percurso",
  "conteudo",
  "entrega",
  "portfolio",
  "enquete",
  "painel",
];

/** Etapas do ciclo, na ordem configurada (D26: segmentação removida). */
export function etapasEmOrdem(config: CicloConfig): Etapa[] {
  return [...config.etapas].sort((a, b) => a.ordem - b.ordem);
}

export function temasAtivos(config: CicloConfig): Tema[] {
  return [...config.temas]
    .filter((m) => m.ativo)
    .sort((a, b) => a.ordem - b.ordem);
}

/**
 * Data limite de uma etapa. Encadeada (D38): cada etapa conta seus
 * `prazoDias` a partir do vencimento da etapa anterior, começando da
 * `dataInicio` do MESOCICLO (D39) — não mais de um ciclo único.
 */
export function prazoDaEtapa(
  dataInicio: string,
  config: CicloConfig,
  etapa: Etapa,
): Date {
  const ordenadas = etapasEmOrdem(config);
  let data = new Date(dataInicio);
  for (const e of ordenadas) {
    data = new Date(data);
    data.setDate(data.getDate() + e.prazoDias);
    if (e.id === etapa.id) return data;
  }
  // Etapa fora da lista configurada (não deveria acontecer): mesma conta,
  // isolada, a partir do início do mesociclo.
  const isolado = new Date(dataInicio);
  isolado.setDate(isolado.getDate() + etapa.prazoDias);
  return isolado;
}

/** Tipo de participação do docente (regente/corregente), resolvido pela
 * inscrição atual — deixou de ser um atributo fixo da pessoa (D34). Sem
 * inscrição ainda, assume "regente": ele simplesmente não escolheu. */
export function tipoParticipacaoDaPessoa(
  estado: EstadoApp,
  pessoaId: string,
): TipoParticipacao {
  return (
    estado.inscricoes.find((i) => i.pessoaId === pessoaId)?.tipoParticipacao ??
    "regente"
  );
}

/** Coordenadores que alocaram este docente como liderado (D35) — um docente
 * pode ter mais de um líder. */
export function coordenadoresDoDocente(
  estado: EstadoApp,
  docenteId: string,
): Pessoa[] {
  const ids = estado.alocacoes
    .filter((a) => a.docenteId === docenteId)
    .map((a) => a.coordenadorId);
  return estado.pessoas.filter((p) => ids.includes(p.id));
}

/** Líder principal do docente — a alocação mais recente — para quando só
 * um destino é possível (ex.: roteamento de entrega). */
export function coordenadorPrincipalDoDocente(
  estado: EstadoApp,
  docenteId: string,
): Pessoa | undefined {
  const alocacao = [...estado.alocacoes]
    .filter((a) => a.docenteId === docenteId)
    .sort((a, b) => b.criadaEmISO.localeCompare(a.criadaEmISO))[0];
  if (!alocacao) return undefined;
  return estado.pessoas.find((p) => p.id === alocacao.coordenadorId);
}

/**
 * Snapshot vigente (o mais recente) do "formulário" de uma origem — Enquete,
 * Portfólio ou Autoavaliação (D53). Sem tela que gere uma versão nova ainda:
 * hoje sempre resolve para a única versão do seed.
 */
export function formularioVersaoVigente(
  estado: EstadoApp,
  origem: FormularioVersao["origem"],
): FormularioVersao | undefined {
  return [...estado.formularioVersoes]
    .filter((f) => f.origem === origem)
    .sort((a, b) => b.criadaEmISO.localeCompare(a.criadaEmISO))[0];
}

export function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Quantos docentes já têm progresso registrado em uma etapa. */
export function docentesComProgressoNaEtapa(
  estado: EstadoApp,
  etapaId: string,
): number {
  const pessoas = new Set(
    estado.progressoEtapas
      .filter((p) => p.etapaId === etapaId && p.status !== "nao_iniciada")
      .map((p) => p.pessoaId),
  );
  return pessoas.size;
}

/** Turmas e inscrições que dependem de um tema. */
export function usoDoTema(estado: EstadoApp, temaId: string) {
  const turmas = estado.turmas.filter((t) => t.temaId === temaId);
  const idsTurmas = new Set(turmas.map((t) => t.id));
  const inscricoes = estado.inscricoes.filter(
    (i) => i.temaId === temaId || idsTurmas.has(i.turmaId),
  );
  return { turmas: turmas.length, inscricoes: inscricoes.length };
}

/** Turmas e inscrições que dependem de uma modalidade. */
export function usoDaModalidade(estado: EstadoApp, modalidadeId: string) {
  const turmas = estado.turmas.filter((t) => t.modalidadeId === modalidadeId);
  const idsTurmas = new Set(turmas.map((t) => t.id));
  const inscricoes = estado.inscricoes.filter((i) => idsTurmas.has(i.turmaId));
  return { turmas: turmas.length, inscricoes: inscricoes.length };
}

/** Docentes inscritos em uma turma (impacto de remover ou reduzir vagas). */
export function usoDaTurma(estado: EstadoApp, turmaId: string) {
  return {
    inscricoes: estado.inscricoes.filter((i) => i.turmaId === turmaId).length,
  };
}

/** Docentes inscritos em uma turma específica, para o Sheet de presença. */
export function docentesDaTurma(estado: EstadoApp, turmaId: string) {
  const idsInscritos = new Set(
    estado.inscricoes
      .filter((i) => i.turmaId === turmaId)
      .map((i) => i.pessoaId),
  );
  return estado.pessoas.filter((p) => idsInscritos.has(p.id));
}

/**
 * Se um passo do modo guiado da Configuração de ciclos está travado.
 * Recebe a `CicloConfig` do mesociclo em edição — não necessariamente o
 * vigente: a operadora pode estar configurando um ciclo futuro.
 */
export function passoGuiadoTravado(
  config: CicloConfig,
  passo: string,
): boolean {
  if (passo === "modalidades") return temasAtivos(config).length === 0;
  if (passo === "turmas") {
    return (
      temasAtivos(config).length === 0 ||
      config.modalidades.filter((m) => m.ativa).length === 0
    );
  }
  if (passo === "conteudo") {
    return !config.etapas.some((e) => e.tipo === "conteudo");
  }
  return false;
}

export interface ResumoConferenciaCiclo {
  temasAtivos: number;
  modalidadesAtivas: number;
  totalTurmas: number;
  totalVagas: number;
  etapasEmOrdem: string[];
  ofertasComConteudo: number;
  ofertasVazias: number;
}

/**
 * Resumo do ciclo para o passo de Conferência do modo guiado (3.4).
 * Recebe a `CicloConfig` do mesociclo em edição e as turmas já filtradas
 * para esse mesociclo — nada aqui deve vir do vigente por padrão.
 */
export function resumoConferenciaCiclo(
  estado: EstadoApp,
  config: CicloConfig,
  turmas: Turma[],
): ResumoConferenciaCiclo {
  const etapasEmOrdem = [...config.etapas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((e) => e.nome);

  const idsEtapasDoMesociclo = new Set(config.etapas.map((e) => e.id));
  const ofertasDoMesociclo = estado.ofertas.filter((o) =>
    idsEtapasDoMesociclo.has(o.etapaId),
  );
  const itensPorOferta = new Map<string, number>();
  for (const item of estado.itensConteudo) {
    itensPorOferta.set(
      item.ofertaId,
      (itensPorOferta.get(item.ofertaId) ?? 0) + 1,
    );
  }
  let ofertasComConteudo = 0;
  let ofertasVazias = 0;
  for (const oferta of ofertasDoMesociclo) {
    if ((itensPorOferta.get(oferta.id) ?? 0) > 0) ofertasComConteudo += 1;
    else ofertasVazias += 1;
  }

  return {
    temasAtivos: temasAtivos(config).length,
    modalidadesAtivas: config.modalidades.filter((m) => m.ativa).length,
    totalTurmas: turmas.length,
    totalVagas: turmas.reduce((soma, t) => soma + t.vagas, 0),
    etapasEmOrdem,
    ofertasComConteudo,
    ofertasVazias,
  };
}

/** Reordena um array movendo um item de posição e recalcula `ordem`. */
export function moverItem<T>(itens: T[], de: number, para: number): T[] {
  const copia = [...itens];
  const [item] = copia.splice(de, 1);
  if (!item) return itens;
  copia.splice(para, 0, item);
  return copia;
}

export function reindexar<T extends { ordem: number }>(itens: T[]): T[] {
  return itens.map((item, i) => ({ ...item, ordem: i + 1 }));
}

export function novoId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * `CicloConfig` de um mesociclo recém-criado: nasce vazia, igual ao ciclo
 * 2028 do seed. `temas` é copiado de uma config existente do mesmo
 * macrociclo — é o campo transitório (ver comentário em `CicloConfig.temas`,
 * types.ts), não uma escolha nova; todo o resto começa do zero mesmo.
 */
export function novaCicloConfigVazia(
  mesocicloId: string,
  temas: Tema[],
): CicloConfig {
  return {
    id: novoId("ciclo"),
    mesocicloId,
    nome: "",
    descricao: "",
    periodo: "",
    temas,
    modalidades: [],
    etapas: [],
    subtipos: [],
    conquistas: [],
    reflexoesPortfolio: [],
    dimensoesAutoavaliacao: [],
    enquete: {
      titulo: "Enquete 360°",
      instrucao: "",
      respondentes: [],
      perguntas: [],
    },
  };
}
