// Tipos da camada de dados do protótipo.
// Nada aqui é regra pedagógica: a trilha real vem sempre de `cicloConfig`,
// que é editável em runtime pela equipe operadora.

export type TipoEtapa =
  | "autoavaliacao"
  | "conteudo"
  | "entrega"
  | "encontro"
  | "avaliacao";

export type Cargo = "regente" | "corregente";

export type PerfilId =
  | "docente-regente"
  | "docente-corregente"
  | "coordenador"
  | "operadora"
  | "diretor";

export type StatusEtapa =
  | "concluida"
  | "em_andamento"
  | "bloqueada"
  | "pendente"
  | "atrasada"
  | "nao_iniciada";

export interface Macrotema {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
  /** dimensão da autoavaliação sugerida por este macrotema (opcional) */
  dimensaoRelacionada?: string | undefined;
}

export interface Modalidade {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  /** o envio da tarefa registra presença automaticamente */
  presencaAutomatica: boolean;
}

export interface Segmento {
  id: string;
  nome: string;
}

export type CenarioSegmentacao = "trilha_unica" | "trilha_por_segmento";

export interface AlertaPendencia {
  /** dias de atraso até alertar o coordenador */
  diasParaCoordenador: number;
  /** o docente também é alertado */
  alertarDocente: boolean;
}

export interface Etapa {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoEtapa;
  ordem: number;
  obrigatoria: boolean;
  /** prazo em dias a partir da abertura do ciclo */
  prazoDias: number;
  /** quando vazio, vale para todos os segmentos */
  segmentos: string[];
  alerta: AlertaPendencia;
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
  periodo: string;
  aberturaISO: string;
  cenarioSegmentacao: CenarioSegmentacao;
  segmentos: Segmento[];
  macrotemas: Macrotema[];
  modalidades: Modalidade[];
  etapas: Etapa[];
  conquistas: Conquista[];
  reflexoesPortfolio: PerguntaReflexao[];
  enquete: ConfigEnquete;
}


export interface Pessoa {
  id: string;
  nome: string;
  matricula: string;
  unidade: string;
  segmentoId: string;
  cargo: Cargo;
  perfil: "docente" | "coordenador" | "operadora" | "diretor";
  coordenadorId?: string | undefined;
  email: string;
}

export interface Turma {
  id: string;
  nome: string;
  macrotemaId: string;
  modalidadeId: string;
  periodo: string;
  horario: string;
  vagas: number;
  vagasOcupadas: number;
}

export interface Inscricao {
  id: string;
  pessoaId: string;
  turmaId: string;
  macrotemaId: string;
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
}

export interface Autoavaliacao {
  id: string;
  pessoaId: string;
  respostas: Record<string, number>;
  dimensoes: Record<string, number>;
  concluidaEmISO?: string | undefined;
}

/** Macrotema já cumprido pelo docente em um ciclo anterior. */
export interface HistoricoMacrotema {
  id: string;
  pessoaId: string;
  macrotemaId: string;
  /** nome registrado à época, caso o macrotema mude de nome ou seja removido */
  macrotemaNome: string;
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
 * Arquivo de conteúdo enviado pela equipe operadora de dentro do sistema.
 * O envio ao Drive institucional é simulado: ninguém copia URL.
 */
export interface ArquivoConteudo {
  id: string;
  nome: string;
  tipo: "video" | "texto";
  arquivoTipo: string;
  tamanhoBytes: number;
  etapaId: string;
  macrotemaId: string;
  /** referência gerada automaticamente no Drive institucional (simulada) */
  referenciaDrive: string;
  enviadoEmISO: string;
  enviadoPorId: string;
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
  progressoEtapas: ProgressoEtapa[];
  progressoAulas: ProgressoAula[];
  progressoLeituras: ProgressoLeitura[];
  entregas: Entrega[];
  devolutivas: Devolutiva[];
  observacoes: Observacao[];
  notificacoes: Notificacao[];
  autoavaliacoes: Autoavaliacao[];
  historicoMacrotemas: HistoricoMacrotema[];
  portfolios: Portfolio[];
  arquivosConteudo: ArquivoConteudo[];
  respostasEnquete: RespostaEnquete[];

}
