// Leituras derivadas da configuração do ciclo.
// Nenhuma tela deve presumir quantidade, ordem ou nomes: tudo vem daqui.

import type {
  Auditoria,
  CicloConfig,
  Encontro,
  EstadoApp,
  Etapa,
  FaseCanonica,
  FormularioVersao,
  Mesociclo,
  Pessoa,
  TelaEtapa,
  Tema,
  TemaVersao,
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

/** Temas do macrociclo (D40) — todo mesociclo do mesmo macrociclo enxerga o mesmo conjunto. */
export function temasDoMacrociclo(
  estado: EstadoApp,
  macrocicloId: string,
): Tema[] {
  return estado.temas.filter((t) => t.macrocicloId === macrocicloId);
}

/**
 * Temas herdados por um mesociclo — resolve o macrociclo dele e delega a
 * `temasDoMacrociclo`. Use esta função (não `estado.temas` direto) sempre
 * que precisar da LISTA de temas de um ciclo específico; para um lookup
 * pontual por id, `estado.temas.find(...)` já basta — o id é global.
 */
export function temasDoMesociclo(
  estado: EstadoApp,
  mesocicloId: string,
): Tema[] {
  const mesociclo = estado.mesociclos.find((m) => m.id === mesocicloId);
  if (!mesociclo) return [];
  return temasDoMacrociclo(estado, mesociclo.macrocicloId);
}

/**
 * Carga horária declarada de um tema dentro de um mesociclo (D56).
 * `undefined` = ainda não declarada para esta combinação, nunca 0 por
 * omissão — não confundir "não declarado" com "declarado como zero".
 */
export function cargaHorariaDoTema(
  estado: EstadoApp,
  mesocicloId: string,
  temaId: string,
): number | undefined {
  return estado.temasNoMesociclo.find(
    (t) => t.mesocicloId === mesocicloId && t.temaId === temaId,
  )?.cargaHoraria;
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

export function temasAtivos(temas: Tema[]): Tema[] {
  return [...temas].filter((m) => m.ativo).sort((a, b) => a.ordem - b.ordem);
}

/**
 * Data limite de uma etapa. Encadeada (D38): cada etapa conta seus
 * `prazoDias` a partir do vencimento da etapa anterior, começando da
 * `dataInicio` do MESOCICLO (D39) — não mais de um ciclo único.
 *
 * Etapa com `prazoCongeladoISO` não recalcula: lê o valor congelado direto
 * (Pacote 2) — protege quem já começou de ter o prazo deslocado por uma
 * etapa anterior inserida ou removida depois.
 */
export function prazoDaEtapa(
  dataInicio: string,
  config: CicloConfig,
  etapa: Etapa,
): Date {
  if (etapa.prazoCongeladoISO) return new Date(etapa.prazoCongeladoISO);

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

/**
 * Quantos docentes já têm QUALQUER dado de execução numa etapa (D43) — não
 * só `ProgressoEtapa`. Varre toda entidade que referencia `etapaId`
 * (entrega, aula assistida, leitura, presença, observação, portfólio,
 * autoavaliação, resposta de enquete); sem isso, uma etapa com entrega
 * enviada mas sem `ProgressoEtapa` gravado passaria como "sem uso" e a
 * trava de edição (D43) deixaria editar algo que já tem histórico.
 */
export function docentesComProgressoNaEtapa(
  estado: EstadoApp,
  etapaId: string,
): number {
  const pessoas = new Set<string>();
  estado.progressoEtapas
    .filter((p) => p.etapaId === etapaId && p.status !== "nao_iniciada")
    .forEach((p) => pessoas.add(p.pessoaId));
  estado.entregas
    .filter((e) => e.etapaId === etapaId)
    .forEach((e) => pessoas.add(e.pessoaId));
  estado.progressoAulas
    .filter((p) => p.etapaId === etapaId)
    .forEach((p) => pessoas.add(p.pessoaId));
  estado.progressoLeituras
    .filter((p) => p.etapaId === etapaId)
    .forEach((p) => pessoas.add(p.pessoaId));
  estado.presencas
    .filter((p) => p.etapaId === etapaId)
    .forEach((p) => pessoas.add(p.pessoaId));
  estado.observacoes
    .filter((o) => o.etapaId === etapaId)
    .forEach((o) => pessoas.add(o.pessoaId));
  estado.portfolios
    .filter((p) => p.etapaId === etapaId)
    .forEach((p) => pessoas.add(p.pessoaId));
  estado.autoavaliacoes
    .filter((a) => a.etapaId === etapaId)
    .forEach((a) => pessoas.add(a.pessoaId));
  estado.respostasEnquete
    .filter((r) => r.etapaId === etapaId)
    .forEach((r) => pessoas.add(r.docenteId));
  return pessoas.size;
}

/**
 * Congela, ANTES de uma mudança estrutural na trilha (reordenar, inserir,
 * remover), o prazo calculado de toda etapa que já tem dado de execução e
 * ainda não tem `prazoCongeladoISO` (Pacote 2). O prazo é cumulativo (D38):
 * sem isso, mudar a trilha em qualquer ponto anterior desloca em silêncio a
 * data de quem já começou uma etapa mais adiante.
 */
export function congelarPrazosComExecucao(
  estado: EstadoApp,
  mesociclo: Mesociclo,
  config: CicloConfig,
): CicloConfig {
  const etapas = config.etapas.map((etapa) => {
    if (etapa.prazoCongeladoISO) return etapa;
    if (docentesComProgressoNaEtapa(estado, etapa.id) === 0) return etapa;
    const prazo = prazoDaEtapa(mesociclo.dataInicio, config, etapa);
    return { ...etapa, prazoCongeladoISO: prazo.toISOString() };
  });
  return { ...config, etapas };
}

/**
 * Versão vigente de um tema (D53/D54) — a mais recente entre as
 * `TemaVersao` que apontam para este `Tema.id` especificamente, não para a
 * linhagem inteira: uma reemissão deve refletir a versão do TEMA ativo
 * quando o docente concluiu, não a versão mais nova de outro tema da mesma
 * linhagem (isso só existiria depois de `versionarTema` entre macrociclos).
 */
export function temaVersaoVigente(
  estado: EstadoApp,
  temaId: string,
): TemaVersao | undefined {
  return [...estado.temaVersoes]
    .filter((v) => v.temaId === temaId)
    .sort((a, b) => b.numeroVersao - a.numeroVersao)[0];
}

/**
 * Se o tema está travado por já ter certificado emitido (D42) — a
 * confirmação de emissão avisa que os nomes travam a partir dali; esta
 * função é o que torna esse aviso um bloqueio de fato, não só texto.
 * Trava no CERTIFICADO emitido, não na `Conclusao` sozinha (D53/D54): a
 * conclusão pode existir sem certificado (fora do MVP emitir de verdade
 * antes do botão manual existir).
 */
export function temaTravadoPorCertificado(
  estado: EstadoApp,
  temaId: string,
): boolean {
  const idsVersao = new Set(
    estado.temaVersoes.filter((v) => v.temaId === temaId).map((v) => v.id),
  );
  const idsConclusao = new Set(
    estado.conclusoes
      .filter((c) => idsVersao.has(c.temaVersaoId))
      .map((c) => c.id),
  );
  return estado.certificados.some((cert) => idsConclusao.has(cert.conclusaoId));
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
 * Encontros de uma turma, em ordem cronológica (Pacote 3) — vazio para
 * turma assíncrona, já que ela nunca tem `Encontro` no seed nem na tela.
 */
export function encontrosDaTurma(
  estado: EstadoApp,
  turmaId: string,
): Encontro[] {
  return [...estado.encontros]
    .filter((e) => e.turmaId === turmaId)
    .sort((a, b) => a.data.localeCompare(b.data));
}

/**
 * Próximo encontro ainda não realizado (ou o último, se todos já
 * passaram) — usado para destacar "o encontro de agora" nas telas do
 * docente, em vez de listar tudo sem hierarquia.
 */
export function proximoEncontro(
  estado: EstadoApp,
  turmaId: string,
  agora: Date = new Date(),
): Encontro | undefined {
  const encontros = encontrosDaTurma(estado, turmaId);
  return encontros.find((e) => new Date(e.data) >= agora) ?? encontros.at(-1);
}

/**
 * Nome do professor responsável, resolvido pelo roster (Pacote 3) — nunca
 * lido direto de `Turma`, que só guarda o id. Fallback explícito se o
 * professor não existir mais no roster (não há UI de remoção nesta rodada,
 * mas o dado pode desalinhar por edição manual do storage) — mesma
 * convenção de "Tema removido"/"Modalidade removida" já usada em AbaTurmas.
 */
export function nomeDoProfessor(
  estado: EstadoApp,
  professorId: string,
): string {
  return (
    estado.professores.find((p) => p.id === professorId)?.nome ??
    "Professor removido"
  );
}

/**
 * Se um passo do modo guiado da Configuração de ciclos está travado.
 * Recebe a `CicloConfig` do mesociclo em edição — não necessariamente o
 * vigente: a operadora pode estar configurando um ciclo futuro. `temas` é
 * o conjunto herdado do macrociclo (D40), já resolvido pelo chamador.
 */
export function passoGuiadoTravado(
  config: CicloConfig,
  temas: Tema[],
  passo: string,
): boolean {
  if (passo === "temas") return false;
  if (passo === "modalidades") return temasAtivos(temas).length === 0;
  if (passo === "turmas") {
    return (
      temasAtivos(temas).length === 0 ||
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
  const temas = temasDoMesociclo(estado, config.mesocicloId);
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
    temasAtivos: temasAtivos(temas).length,
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
 * 2028 do seed. Os temas não entram aqui — vêm do macrociclo (D40), o
 * mesmo conjunto para todo mesociclo dele; todo o resto começa do zero.
 */
export function novaCicloConfigVazia(mesocicloId: string): CicloConfig {
  return {
    id: novoId("ciclo"),
    mesocicloId,
    nome: "",
    descricao: "",
    periodo: "",
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

/** Novo registro de auditoria (D41) — o chamador decide quando gravar. */
export function novaAuditoria(
  entidade: string,
  entidadeId: string,
  campo: string,
  valorAnterior: string,
  autorId: string,
): Auditoria {
  return {
    id: novoId("aud"),
    entidade,
    entidadeId,
    campo,
    valorAnterior,
    autorId,
    dataISO: new Date().toISOString(),
  };
}

/**
 * Evolução de um tema ENTRE macrociclos (D53/D54/D56) — nasce um `Tema`
 * novo, ligado a `novoMacrocicloId`, preservando `linhagemId`; e uma
 * `TemaVersao` nova, com o número incrementado. "Duplicar" (carregar sem
 * mudar) e "atualizar" (mudar nome/descrição ao carregar) são a mesma
 * operação — `mudanca` vazio é duplicar, preenchido é atualizar. Diferente
 * de editar dentro do MESMO macrociclo (D41/D42): aquilo corrige o `Tema`
 * em vigor, com auditoria, sem versão nova.
 *
 * SEM TELA que acione isto ainda — criar macrociclo é peça nova (fronteira
 * de configurabilidade, §4), fora da lista desta sessão. A função fica
 * pronta, testável isoladamente, para quando essa tela existir; não é
 * código morto por engano.
 */
export function versionarTema(
  estado: EstadoApp,
  temaOrigemId: string,
  novoMacrocicloId: string,
  mudanca: { nome?: string; descricao?: string },
  autorId: string,
): { tema: Tema; versao: TemaVersao } {
  const origem = estado.temas.find((t) => t.id === temaOrigemId);
  if (!origem) {
    throw new Error(`versionarTema: tema ${temaOrigemId} não encontrado`);
  }
  const ultimaVersao = [...estado.temaVersoes]
    .filter((v) => v.linhagemId === origem.linhagemId)
    .sort((a, b) => b.numeroVersao - a.numeroVersao)[0];
  const numeroVersao = (ultimaVersao?.numeroVersao ?? 0) + 1;
  const nome = mudanca.nome ?? origem.nome;
  const descricao = mudanca.descricao ?? origem.descricao;
  const agora = new Date().toISOString();

  const tema: Tema = {
    ...origem,
    id: novoId("tema"),
    macrocicloId: novoMacrocicloId,
    nome,
    descricao,
  };
  const versao: TemaVersao = {
    id: novoId("temaversao"),
    temaId: tema.id,
    linhagemId: origem.linhagemId,
    numeroVersao,
    nome,
    descricao,
    criadaEmISO: agora,
    criadaPorId: autorId,
  };
  return { tema, versao };
}
