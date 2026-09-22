// Tipos da camada de dados do protótipo.
// Nada aqui é regra pedagógica: a trilha real vem sempre de `cicloConfig`,
// que é editável em runtime pela equipe operadora.

export type TipoEtapa =
  "autoavaliacao" | "conteudo" | "entrega" | "encontro" | "avaliacao";

/** Tipo de participação do docente num ciclo — hoje escolhido na inscrição (D34), não mais fixo na pessoa. */
export type TipoParticipacao = "regente" | "corregente";

export type PerfilId =
  | "docente-regente"
  | "docente-corregente"
  | "coordenador"
  | "operadora"
  | "diretor"
  | "moderador";

export type StatusEtapa =
  | "concluida"
  | "em_andamento"
  | "bloqueada"
  | "pendente"
  | "atrasada"
  | "nao_iniciada";

export interface Tema {
  id: string;
  /** persiste entre macrociclos — raiz da linhagem deste tema (D54, fundação p/ TemaVersao) */
  linhagemId: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
  /** dimensão da autoavaliação sugerida por este tema (opcional) */
  dimensaoRelacionada?: string | undefined;
}

/**
 * Snapshot congelado do conteúdo de um tema (D53/D54) — não substitui a
 * leitura corrente de `Tema` (as ~46 referências de `temaId` no app
 * continuam lendo o tema vigente, nunca uma versão). Só quem precisa do
 * retrato de um momento específico — `Conclusao`, e portanto `Certificado`
 * — aponta para cá. Editar um tema entre macrociclos cria uma versão nova;
 * não sobrescreve. Sem tela que gere isso ainda (Pacote 0 é só o schema).
 */
export interface TemaVersao {
  id: string;
  temaId: string;
  /** mesma linhagem do Tema de origem (D54) */
  linhagemId: string;
  numeroVersao: number;
  nome: string;
  descricao: string;
  criadaEmISO: string;
  criadaPorId: string;
}

export interface Modalidade {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  /** o envio da tarefa registra presença automaticamente */
  presencaAutomatica: boolean;
}

export interface AlertaPendencia {
  /** dias ANTES do prazo para avisar o docente. 0 = não avisa antes */
  diasAntes: number;
  /** avisa também no dia do vencimento */
  noVencimento: boolean;
  /** dias de atraso até alertar o coordenador */
  diasParaCoordenador: number;
  /** o docente também é alertado no atraso */
  alertarDocente: boolean;
}

/** Tela do docente que uma etapa abre. Substitui a inferência por nome. */
export type TelaEtapa =
  | "autoavaliacao"
  | "percurso"
  | "conteudo"
  | "entrega"
  | "portfolio"
  | "enquete"
  | "painel";

/**
 * Formulário/tela pré-cadastrado que uma etapa pode reutilizar (D30) — ex.:
 * "Autoavaliação inicial" e "Autoavaliação do coordenador" são dois subtipos
 * distintos que abrem a mesma tela (`tela: "autoavaliacao"`). A etapa não
 * cria mais o formulário inline: escolhe um subtipo já cadastrado, que
 * preenche `tipo`/`tela` no momento da escolha (ver `Etapa.subtipoId`).
 */
export interface Subtipo {
  id: string;
  nome: string;
  tipoGenerico: TipoEtapa;
  tela: TelaEtapa;
}

export interface Etapa {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoEtapa;
  ordem: number;
  obrigatoria: boolean;
  /** prazo em dias, contado a partir do vencimento da etapa anterior (D38) */
  prazoDias: number;
  alerta: AlertaPendencia;
  /** tela que esta etapa abre para o docente */
  tela: TelaEtapa;
  /** carga horária declarada da etapa (D10) */
  cargaHoraria?: number | undefined;
  /**
   * Subtipo escolhido para preencher `tipo`/`tela` (D30). Guardado para a
   * tela de configuração conseguir reabrir mostrando o que foi selecionado
   * — `tipo`/`tela` continuam sendo a fonte real lida pelo resto do app.
   */
  subtipoId?: string | undefined;
  /** quais tipos de participação passam por esta etapa (D34); vazio = todos */
  perfisParticipantes: TipoParticipacao[];
}

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  /** id da etapa cuja conclusão acende a insígnia */
  etapaId: string;
}

/** Campo de reflexão do Portfólio de Inovação Docente. */
export interface PerguntaReflexao {
  id: string;
  pergunta: string;
  ajuda: string;
  ordem: number;
}

export type TipoPergunta = "escala" | "texto";

/** Público que responde a Enquete 360° (docente, coordenador, estudante...). */
export interface TipoRespondente {
  id: string;
  nome: string;
  descricao: string;
}

export interface PerguntaEnquete {
  id: string;
  texto: string;
  tipo: TipoPergunta;
  ordem: number;
  /** quando vazio, a pergunta vale para todos os públicos */
  respondentes: string[];
}

export interface ConfigEnquete {
  titulo: string;
  instrucao: string;
  respondentes: TipoRespondente[];
  perguntas: PerguntaEnquete[];
}

export interface CicloConfig {
  id: string;
  nome: string;
  /** descrição livre da jornada, ex. "Jornada 2027 a 2030" (D27) */
  descricao: string;
  periodo: string;
  /** data de início do ciclo — base do encadeamento de prazos (D38) */
  dataInicioCiclo: string;
  temas: Tema[];
  modalidades: Modalidade[];
  etapas: Etapa[];
  /** formulários/telas reutilizáveis que uma etapa pode escolher (D30) */
  subtipos: Subtipo[];
  conquistas: Conquista[];
  reflexoesPortfolio: PerguntaReflexao[];
  enquete: ConfigEnquete;
}

export interface Pessoa {
  id: string;
  nome: string;
  matricula: string;
  unidade: string;
  perfil: "docente" | "coordenador" | "operadora" | "diretor" | "moderador";
  /** turmas às quais um perfil moderador tem acesso (D33); ignorado nos demais perfis */
  turmaIds?: string[] | undefined;
  email: string;
}

export interface Turma {
  id: string;
  nome: string;
  temaId: string;
  modalidadeId: string;
  periodo: string;
  horario: string;
  vagas: number;
  vagasOcupadas: number;
  /** professor responsável — o docente não escolhe e não precisa ver */
  professorNome: string;
  /** link de acesso; só faz sentido na modalidade síncrona */
  linkAcesso?: string | undefined;
  /** dias da semana, 0 = domingo ... 6 = sábado. Vazio na assíncrona */
  diasSemana: number[];
  /** total de encontros previstos — base do cálculo de presença */
  encontrosPrevistos: number;
}

export interface Inscricao {
  id: string;
  pessoaId: string;
  turmaId: string;
  temaId: string;
  /** regente ou corregente — passa a ser parte da inscrição, não da pessoa (D34) */
  tipoParticipacao: TipoParticipacao;
  criadaEmISO: string;
}

/**
 * Alocação líder-liderado, criada pelo próprio coordenador (D35) — substitui
 * o antigo `Pessoa.coordenadorId` fixo. Um docente pode ter mais de uma
 * alocação (mais de um líder); a mais recente é tratada como líder
 * principal onde só um destino é possível (ex.: roteamento de entrega).
 */
export interface Alocacao {
  id: string;
  coordenadorId: string;
  docenteId: string;
  criadaEmISO: string;
}

export interface ProgressoEtapa {
  id: string;
  pessoaId: string;
  etapaId: string;
  status: StatusEtapa;
  atualizadoEmISO: string;
  /** presença registrada automaticamente pelo envio da tarefa */
  presencaEmISO?: string | undefined;
}

export interface Entrega {
  id: string;
  pessoaId: string;
  etapaId: string;
  texto: string;
  arquivoNome?: string | undefined;
  arquivoTipo?: string | undefined;
  arquivoTamanho?: number | undefined;
  dataAulaISO?: string | undefined;
  enviadaEmISO: string;
  destino: "coordenador" | "equipe_central";
  status: "enviada" | "em_analise" | "devolutiva_disponivel";
}

export interface Devolutiva {
  id: string;
  entregaId: string;
  pessoaId: string;
  autorId: string;
  texto: string;
  parecer?: string | undefined;
  /** nota de 0 a 10 atribuída pelo professor — base do critério tarefa_validada */
  nota?: number | undefined;
  criadaEmISO: string;
  cienciaEmISO?: string | undefined;
}

export interface Observacao {
  id: string;
  pessoaId: string;
  coordenadorId: string;
  etapaId: string;
  dataAulaISO: string;
  realizadaEmISO?: string | undefined;
  criterios?: Record<string, number> | undefined;
  comentario?: string | undefined;
  cienciaEmISO?: string | undefined;
}

export interface Notificacao {
  id: string;
  pessoaId: string;
  titulo: string;
  descricao: string;
  criadaEmISO: string;
  lida: boolean;
  tipo:
    | "mudanca_etapa"
    | "entrega_recebida"
    | "devolutiva"
    | "prazo_proximo"
    | "pendencia";
  /** momento do alerta de prazo (antes/no vencimento/atraso) — só para tipo prazo_proximo/pendencia */
  momento?: "antes" | "vencimento" | "atraso" | undefined;
}

export interface Autoavaliacao {
  id: string;
  pessoaId: string;
  respostas: Record<string, number>;
  dimensoes: Record<string, number>;
  concluidaEmISO?: string | undefined;
}

/**
 * Tema já cumprido pelo docente em um ciclo anterior — dado IMPORTADO de
 * fora do sistema, só para apresentação (D27), fora do MVP. Não é o mesmo
 * que `Conclusao`: histórico de jornada anterior nunca deve ficar
 * indistinguível de uma conclusão gerada pelo próprio sistema.
 */
export interface HistoricoTema {
  id: string;
  pessoaId: string;
  temaId: string;
  /** nome registrado à época, caso o tema mude de nome ou seja removido */
  temaNome: string;
  ciclo: string;
  ano: number;
  turmaNome?: string | undefined;
  modalidadeNome?: string | undefined;
  entregaTitulo?: string | undefined;
  entregaResumo?: string | undefined;
  devolutivaTexto?: string | undefined;
  devolutivaAutor?: string | undefined;
  conquistas?: string[] | undefined;
}

/**
 * Registro de conclusão do tema pelo docente, gerado pelo próprio sistema
 * (D53/D54/D56) — nunca aponta para `Tema`, só para a `TemaVersao` vigente
 * no momento da conclusão: uma reemissão futura precisa mostrar o nome e a
 * carga horária de então, não os atuais. `cargaHorariaCongelada` é lida daqui
 * na emissão do certificado, nunca do tema. Sem nenhuma tela ou lógica que
 * gere isto ainda — o gatilho entra no Pacote 2, junto do encerramento.
 */
export interface Conclusao {
  id: string;
  docenteId: string;
  temaVersaoId: string;
  cargaHorariaCongelada: number;
  concluidoEmISO: string;
}

/**
 * Lê exclusivamente de `Conclusao` (D54) — nunca referencia `Tema` ou
 * `TemaVersao` diretamente. Só o tipo nasce neste pacote: emissão real de
 * certificado está fora do MVP de dezembro (D05/D17).
 */
export interface Certificado {
  id: string;
  conclusaoId: string;
  emitidoEmISO: string;
  emitidoPorId: string;
}

/** Aula em vídeo marcada como assistida dentro de uma etapa de conteúdo. */
export interface ProgressoAula {
  id: string;
  pessoaId: string;
  etapaId: string;
  aulaId: string;
  concluidaEmISO: string;
}

/** Avanço na leitura do texto-base de uma etapa de conteúdo. */
export interface ProgressoLeitura {
  id: string;
  pessoaId: string;
  etapaId: string;
  /** 0 a 100 */
  percentual: number;
  concluidaEmISO?: string | undefined;
}

/**
 * Arquivo na biblioteca de mídia (D11). Existe independentemente de etapa,
 * turma ou ciclo, para poder ser reaproveitado. O upload ao Drive
 * institucional é simulado: o operador nunca copia URL.
 */
export interface Midia {
  id: string;
  nome: string;
  tipo: "video" | "texto" | "link";
  arquivoTipo?: string | undefined;
  tamanhoBytes?: number | undefined;
  /** referência gerada automaticamente no Drive institucional (simulada) */
  referenciaDrive?: string | undefined;
  /** endereço externo — só para tipo `link` (webconferência) */
  url?: string | undefined;
  duracaoMin?: number | undefined;
  /**
   * Corpo do texto-base quando escrito diretamente no sistema — só para
   * tipo `texto` sem arquivo anexado. Campo aditivo: a especificação P1+P2
   * não previa onde o texto digitado ficaria guardado; sem ele o critério
   * de aceite 6 (texto-base aparecendo na tela do docente) não fecha.
   */
  corpo?: string | undefined;
  enviadaEmISO: string;
  enviadaPorId: string;
}

export type TipoItemConteudo =
  "video" | "texto" | "webconferencia" | "tarefa" | "questionario";

/** Pergunta de múltipla escolha de um item do tipo `questionario` (D31). */
export interface PerguntaOpcaoMultipla {
  id: string;
  enunciado: string;
  opcoes: string[];
  ordem: number;
}

/**
 * Oferta: o que existe para um tema, em uma modalidade, dentro de uma
 * etapa de conteúdo (D14). É aqui que moram os itens e os critérios de avanço.
 */
export interface OfertaConteudo {
  id: string;
  etapaId: string;
  temaId: string;
  modalidadeId: string;
  criterios: CriterioAvanco[];
}

/** Item de conteúdo de uma oferta, na ordem em que o docente o encontra. */
export interface ItemConteudo {
  id: string;
  ofertaId: string;
  tipo: TipoItemConteudo;
  titulo: string;
  descricao: string;
  ordem: number;
  /** aponta para a biblioteca de mídia; ausente em itens do tipo `tarefa`/`questionario` */
  midiaId?: string | undefined;
  /** enunciado, só para itens do tipo `tarefa` */
  enunciado?: string | undefined;
  /** link externo ou material de apoio opcional (D31) — tarefa e texto-base */
  linkApoio?: string | undefined;
  /** perguntas de múltipla escolha, só para itens do tipo `questionario` (D31) */
  perguntas?: PerguntaOpcaoMultipla[] | undefined;
}

export type TipoCriterioAvanco =
  | "aulas_assistidas"
  | "leitura_concluida"
  | "presenca"
  | "tarefa_entregue"
  | "tarefa_validada"
  | "nota_minima";

/** Critério que libera o avanço de fase (D15). */
export interface CriterioAvanco {
  tipo: TipoCriterioAvanco;
  ativo: boolean;
  /** `presenca`: percentual mínimo de encontros (0 a 100) */
  percentualMinimo?: number | undefined;
  /** `tarefa_validada`/`nota_minima`: nota de corte de 0 a 10 (D32) */
  notaCorte?: number | undefined;
}

/**
 * Presença lançada pelo professor da turma (D16, modalidade síncrona).
 * Na assíncrona a presença continua vindo do envio da tarefa (RF15).
 */
export interface Presenca {
  id: string;
  pessoaId: string;
  turmaId: string;
  etapaId: string;
  /** número do encontro, de 1 até `Turma.encontrosPrevistos` */
  encontro: number;
  presente: boolean;
  lancadaEmISO: string;
  lancadaPorId: string;
  /** liberação manual — atestado, por exemplo */
  justificada?: boolean | undefined;
  observacao?: string | undefined;
}

/** Anexo simulado do portfólio: guarda apenas os metadados do arquivo. */
export interface AnexoPortfolio {
  id: string;
  nome: string;
  arquivoTipo: string;
  tamanhoBytes: number;
  anexadoEmISO: string;
}

export interface Portfolio {
  id: string;
  pessoaId: string;
  /** etapa de portfólio, resolvida em runtime pela configuração */
  etapaId: string;
  reflexoes: Record<string, string>;
  anexos: AnexoPortfolio[];
  status: "rascunho" | "enviado";
  atualizadoEmISO: string;
  enviadoEmISO?: string | undefined;
}

/** Resposta da Enquete 360° sobre um docente, vinda de um público qualquer. */
export interface RespostaEnquete {
  id: string;
  docenteId: string;
  respondenteTipoId: string;
  respondenteNome: string;
  escalas: Record<string, number>;
  textos: Record<string, string>;
  enviadaEmISO: string;
}

export interface EstadoApp {
  versao: number;
  perfilAtivo: PerfilId;
  pessoaAtivaId: string;
  cicloConfig: CicloConfig;
  pessoas: Pessoa[];
  turmas: Turma[];
  inscricoes: Inscricao[];
  alocacoes: Alocacao[];
  progressoEtapas: ProgressoEtapa[];
  progressoAulas: ProgressoAula[];
  progressoLeituras: ProgressoLeitura[];
  entregas: Entrega[];
  devolutivas: Devolutiva[];
  observacoes: Observacao[];
  notificacoes: Notificacao[];
  autoavaliacoes: Autoavaliacao[];
  historicoTemas: HistoricoTema[];
  temaVersoes: TemaVersao[];
  conclusoes: Conclusao[];
  certificados: Certificado[];
  portfolios: Portfolio[];
  midias: Midia[];
  ofertas: OfertaConteudo[];
  itensConteudo: ItemConteudo[];
  presencas: Presenca[];
  respostasEnquete: RespostaEnquete[];
}
