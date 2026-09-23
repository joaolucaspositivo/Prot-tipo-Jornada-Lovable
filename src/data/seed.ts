// ATENÇÃO: tudo neste arquivo é SEED de demonstração, não é regra do sistema.
// A equipe operadora edita a configuração pela interface; estes valores apenas
// dão um ponto de partida coerente para a validação do protótipo.

import type {
  Alocacao,
  Autoavaliacao,
  CicloConfig,
  CriterioAvanco,
  Devolutiva,
  DimensaoAutoavaliacao,
  Entrega,
  EstadoApp,
  Etapa,
  FormularioVersao,
  HistoricoTema,
  Inscricao,
  ItemConteudo,
  Macrociclo,
  Mesociclo,
  Midia,
  Notificacao,
  Observacao,
  OfertaConteudo,
  Pessoa,
  Presenca,
  ProgressoAula,
  ProgressoEtapa,
  ProgressoLeitura,
  RespostaEnquete,
  Subtipo,
  Tema,
  TemaNoMesociclo,
  TemaVersao,
  TipoCriterioAvanco,
  Turma,
} from "./types";

export const VERSAO_ESTADO = 12;
export const CHAVE_STORAGE = "jornada-prototipo-v1";

const ABERTURA = "2027-02-08T00:00:00.000Z";
const ABERTURA_MESOCICLO_2028 = "2028-02-07T00:00:00.000Z";

const MACROCICLO_ID = "macro-1";
const MESOCICLO_2027_ID = "meso-2027";
const MESOCICLO_2028_ID = "meso-2028";

// Pacote 1, sessão 1: macrociclo e mesociclo nascem aqui. "Vigente" é
// declarado pela operadora (Macrociclo.mesocicloVigenteId), não calculado
// por data — 2027 é o vigente porque é o que já roda na demonstração.
export const macrociclosSeed: Macrociclo[] = [
  {
    id: MACROCICLO_ID,
    nome: "Jornada 2027–2030",
    descricao: "Trilha formativa de quatro anos do Grupo Positivo.",
    mesocicloVigenteId: MESOCICLO_2027_ID,
  },
];

export const mesociclosSeed: Mesociclo[] = [
  {
    id: MESOCICLO_2027_ID,
    macrocicloId: MACROCICLO_ID,
    nome: "2027",
    dataInicio: ABERTURA,
    fasesObrigatorias: [],
  },
  {
    id: MESOCICLO_2028_ID,
    macrocicloId: MACROCICLO_ID,
    nome: "2028",
    dataInicio: ABERTURA_MESOCICLO_2028,
    fasesObrigatorias: [],
  },
];

const alertaPadrao = {
  diasAntes: 3,
  noVencimento: true,
  diasParaCoordenador: 3,
  alertarDocente: true,
};

// Do macrociclo (D40): os dois mesociclos do seed (2027, 2028) herdam este
// mesmo array — nenhum dos dois tem cópia própria (ver `temasDoMesociclo`,
// lib/ciclo.ts).
const temasSeed: Tema[] = [
  {
    id: "mt-1",
    nome: "Tema 1 — Planejamento e intencionalidade",
    descricao: "Como o planejamento se conecta às intenções de aprendizagem.",
    dimensaoRelacionada: "planejamento",
  },
  {
    id: "mt-2",
    nome: "Tema 2 — Mediação e engajamento",
    descricao: "Estratégias de mediação que sustentam o engajamento da turma.",
    dimensaoRelacionada: "mediacao",
  },
  {
    id: "mt-3",
    nome: "Tema 3 — Avaliação formativa",
    descricao: "Uso da avaliação como instrumento de percurso.",
    dimensaoRelacionada: "avaliacao",
  },
  {
    id: "mt-4",
    nome: "Tema 4 — Cultura de sala e convivência",
    descricao: "Clima, combinados e relações na sala de aula.",
    dimensaoRelacionada: "clima",
  },
  {
    id: "mt-5",
    nome: "Tema 5 — Tecnologias na aprendizagem",
    descricao: "Integração de recursos digitais com propósito pedagógico.",
    dimensaoRelacionada: "planejamento",
  },
  {
    id: "mt-6",
    nome: "Tema 6 — Inclusão e equidade",
    descricao: "Práticas que ampliam o acesso de todos à aprendizagem.",
    dimensaoRelacionada: "clima",
  },
].map((m, i) => ({
  ...m,
  macrocicloId: MACROCICLO_ID,
  linhagemId: m.id,
  ativo: true,
  ordem: i + 1,
}));

// Snapshot congelado (D53/D54): a primeira versão de cada tema, gerada a
// partir do próprio seed. Nada além do schema — sem tela que crie uma
// versão nova ainda (isso é edição de tema entre macrociclos, Pacote 1).
const temaVersoesSeed: TemaVersao[] = temasSeed.map((t) => ({
  id: `${t.id}-v1`,
  temaId: t.id,
  linhagemId: t.linhagemId,
  numeroVersao: 1,
  nome: t.nome,
  descricao: t.descricao,
  criadaEmISO: ABERTURA,
  criadaPorId: "oper-1",
}));

// Carga horária por tema × mesociclo (D56) — mesma carga nos dois
// mesociclos no ponto de partida; o critério de aceite de dar valores
// diferentes por ano é uma ação da operadora, não um dado pré-divergente.
const temasNoMesocicloSeed: TemaNoMesociclo[] = [
  MESOCICLO_2027_ID,
  MESOCICLO_2028_ID,
].flatMap((mesocicloId) =>
  temasSeed.map((t) => ({
    id: `tnm-${mesocicloId}-${t.id}`,
    mesocicloId,
    temaId: t.id,
    cargaHoraria: 20,
  })),
);

const modalidadesSeed = [
  {
    id: "mod-sincrona",
    nome: "Síncrona",
    descricao: "Encontros ao vivo em data e horário definidos.",
    ativa: true,
    presencaAutomatica: false,
    preveEncontroAoVivo: true,
  },
  {
    id: "mod-assincrona",
    nome: "Assíncrona",
    descricao: "Percurso no próprio ritmo; a entrega registra a presença.",
    ativa: true,
    presencaAutomatica: true,
    preveEncontroAoVivo: false,
  },
];

// Formulários/telas reutilizáveis (D30). A etapa escolhe um já cadastrado —
// não cria mais o formulário inline. Dois subtipos de autoavaliação e dois
// de encontro, de propósito: mostram, já no seed, que a lista de subtipos
// filtrada por tipo genérico pode ter mais de uma opção.
const subtiposSeed: Subtipo[] = [
  {
    id: "sub-autoaval-inicial",
    nome: "Autoavaliação inicial",
    tipoGenerico: "autoavaliacao",
    tela: "autoavaliacao",
  },
  {
    id: "sub-autoaval-coord",
    nome: "Autoavaliação do coordenador",
    tipoGenerico: "autoavaliacao",
    tela: "autoavaliacao",
  },
  {
    id: "sub-percurso",
    nome: "Escolha de percurso",
    tipoGenerico: "escolha",
    tela: "percurso",
  },
  {
    id: "sub-conteudo",
    nome: "Conteúdo em vídeo e texto-base",
    tipoGenerico: "conteudo",
    tela: "conteudo",
  },
  {
    id: "sub-encontro-formativo",
    nome: "Encontro formativo",
    tipoGenerico: "encontro",
    tela: "painel",
  },
  {
    id: "sub-observacao-aula",
    nome: "Observação de aula",
    tipoGenerico: "encontro",
    tela: "painel",
  },
  {
    id: "sub-entrega-planejamento",
    nome: "Entrega de planejamento de aula",
    tipoGenerico: "entrega",
    tela: "entrega",
  },
  {
    id: "sub-portfolio",
    nome: "Portfólio de Inovação Docente",
    tipoGenerico: "portfolio",
    tela: "portfolio",
  },
  {
    id: "sub-enquete",
    nome: "Enquete 360°",
    tipoGenerico: "enquete",
    tela: "enquete",
  },
  {
    id: "sub-encerramento",
    nome: "Encerramento do ciclo",
    tipoGenerico: "encerramento",
    tela: "painel",
  },
];

const etapasSeed: Etapa[] = [
  {
    id: "et-1",
    nome: "Autoavaliação da prática pedagógica",
    descricao: "Reflita sobre sua prática para escolher bem o seu percurso.",
    tipo: "autoavaliacao",
    faseCanonica: "autoavaliacao",
    ordem: 1,
    obrigatoria: true,
    prazoDias: 14,
    perfisParticipantes: [],
    alerta: alertaPadrao,
    tela: "autoavaliacao",
    subtipoId: "sub-autoaval-inicial",
  },
  {
    id: "et-2",
    nome: "Escolha do tema e da turma",
    descricao: "Escolha o tema do ciclo e garanta sua vaga.",
    tipo: "escolha",
    faseCanonica: "inscricao",
    ordem: 2,
    obrigatoria: true,
    prazoDias: 21,
    perfisParticipantes: [],
    alerta: alertaPadrao,
    tela: "percurso",
    subtipoId: "sub-percurso",
  },
  {
    id: "et-3",
    nome: "Conteúdo base do tema",
    descricao: "Aulas em vídeo e texto-base do seu tema.",
    tipo: "conteudo",
    faseCanonica: "formacao",
    ordem: 3,
    obrigatoria: true,
    prazoDias: 45,
    perfisParticipantes: [],
    alerta: alertaPadrao,
    tela: "conteudo",
    cargaHoraria: 20,
    subtipoId: "sub-conteudo",
  },
  {
    id: "et-4",
    nome: "Encontro formativo",
    descricao: "Encontro com a turma para aprofundar o tema.",
    tipo: "encontro",
    faseCanonica: "formacao",
    ordem: 4,
    obrigatoria: true,
    prazoDias: 60,
    perfisParticipantes: [],
    alerta: {
      diasAntes: 2,
      noVencimento: true,
      diasParaCoordenador: 2,
      alertarDocente: true,
    },
    tela: "painel",
    subtipoId: "sub-encontro-formativo",
  },
  {
    id: "et-5",
    nome: "Envio do planejamento de aula",
    descricao:
      "Envie a tarefa, o planejamento e a data da aula a ser observada.",
    tipo: "entrega",
    faseCanonica: "formacao",
    ordem: 5,
    obrigatoria: true,
    prazoDias: 75,
    perfisParticipantes: [],
    alerta: alertaPadrao,
    tela: "entrega",
    subtipoId: "sub-entrega-planejamento",
  },
  {
    id: "et-6",
    nome: "Observação de aula",
    descricao: "Sua aula é observada e você recebe um parecer.",
    tipo: "encontro",
    faseCanonica: "formacao",
    ordem: 6,
    obrigatoria: true,
    prazoDias: 100,
    // Só regente (D34): a entrega e a devolutiva do corregente já são
    // conduzidas pela equipe central (RF22) — não há coordenador de
    // unidade observando a aula dele.
    perfisParticipantes: ["regente"],
    alerta: {
      diasAntes: 5,
      noVencimento: false,
      diasParaCoordenador: 5,
      alertarDocente: false,
    },
    tela: "painel",
    subtipoId: "sub-observacao-aula",
  },
  {
    id: "et-7",
    nome: "Portfólio de Inovação Docente",
    descricao: "Reúna o percurso do ciclo e registre suas reflexões.",
    tipo: "portfolio",
    faseCanonica: "encerramento",
    ordem: 7,
    obrigatoria: true,
    prazoDias: 130,
    perfisParticipantes: [],
    alerta: alertaPadrao,
    tela: "portfolio",
    subtipoId: "sub-portfolio",
  },
  {
    id: "et-8",
    nome: "Enquete 360°",
    descricao: "Percepções de diferentes públicos sobre a sua prática.",
    tipo: "enquete",
    faseCanonica: "encerramento",
    ordem: 8,
    obrigatoria: false,
    prazoDias: 150,
    perfisParticipantes: [],
    alerta: {
      diasAntes: 7,
      noVencimento: false,
      diasParaCoordenador: 7,
      alertarDocente: false,
    },
    tela: "enquete",
    subtipoId: "sub-enquete",
  },
  {
    id: "et-9",
    nome: "Encerramento do ciclo",
    descricao: "Conclusão do ciclo e emissão do certificado.",
    tipo: "encerramento",
    faseCanonica: "encerramento",
    ordem: 9,
    obrigatoria: true,
    prazoDias: 10,
    perfisParticipantes: [],
    alerta: alertaPadrao,
    tela: "painel",
    subtipoId: "sub-encerramento",
  },
];

// Dimensões e afirmações da autoavaliação (v3): antes hardcoded em
// src/data/autoavaliacao.ts — violava a regra de ouro (nenhuma regra
// pedagógica presa em código). O conteúdo é o mesmo de sempre, só a fonte
// virou configuração.
const dimensoesAutoavaliacaoSeed: DimensaoAutoavaliacao[] = [
  {
    id: "planejamento",
    nome: "Planejamento e intencionalidade",
    resumo: "Como você organiza e dá propósito às suas aulas.",
    afirmacoes: [
      {
        id: "planejamento-1",
        texto:
          "Planejo minhas aulas a partir de objetivos de aprendizagem claros.",
      },
      {
        id: "planejamento-2",
        texto:
          "Ajusto o planejamento quando percebo que a turma não acompanhou.",
      },
      {
        id: "planejamento-3",
        texto:
          "Escolho recursos e materiais com uma intenção pedagógica definida.",
      },
    ],
  },
  {
    id: "mediacao",
    nome: "Mediação e engajamento",
    resumo: "Como você conduz a aula e envolve os estudantes.",
    afirmacoes: [
      {
        id: "mediacao-1",
        texto: "Proponho situações em que os estudantes falam mais do que eu.",
      },
      {
        id: "mediacao-2",
        texto: "Faço perguntas que ampliam o raciocínio da turma.",
      },
      {
        id: "mediacao-3",
        texto: "Percebo e retomo quem está fora da atividade durante a aula.",
      },
    ],
  },
  {
    id: "avaliacao",
    nome: "Avaliação formativa",
    resumo: "Como você acompanha e devolve o aprendizado ao longo do percurso.",
    afirmacoes: [
      {
        id: "avaliacao-1",
        texto: "Verifico a aprendizagem durante o percurso, não só ao final.",
      },
      {
        id: "avaliacao-2",
        texto:
          "Dou devolutivas que ajudam o estudante a saber o próximo passo.",
      },
      {
        id: "avaliacao-3",
        texto: "Uso os resultados das avaliações para replanejar minhas aulas.",
      },
    ],
  },
  {
    id: "clima",
    nome: "Cultura de sala e convivência",
    resumo: "Como você sustenta o clima e as relações na sala.",
    afirmacoes: [
      {
        id: "clima-1",
        texto: "Construo combinados de convivência junto com a turma.",
      },
      {
        id: "clima-2",
        texto: "Lido com conflitos sem interromper o percurso da aprendizagem.",
      },
      {
        id: "clima-3",
        texto: "Garanto que todos os estudantes tenham espaço de participação.",
      },
    ],
  },
];

export const cicloConfigSeed: CicloConfig = {
  id: "ciclo-2027",
  mesocicloId: MESOCICLO_2027_ID,
  nome: "Ciclo 2",
  descricao: "Jornada 2027 a 2030",
  periodo: "2027–2030",
  modalidades: modalidadesSeed,
  etapas: etapasSeed,
  subtipos: subtiposSeed,
  conquistas: [
    {
      id: "cq-1",
      nome: "Ponto de partida",
      descricao: "Autoavaliação concluída",
      etapaId: "et-1",
    },
    {
      id: "cq-2",
      nome: "Percurso escolhido",
      descricao: "Inscrição confirmada",
      etapaId: "et-2",
    },
    {
      id: "cq-3",
      nome: "Prática compartilhada",
      descricao: "Planejamento enviado",
      etapaId: "et-5",
    },
    {
      id: "cq-4",
      nome: "Ciclo completo",
      descricao: "Portfólio entregue",
      etapaId: "et-7",
    },
  ],
  // Campos do Portfólio de Inovação Docente: editáveis pela operadora.
  reflexoesPortfolio: [
    {
      id: "rf-1",
      pergunta: "O que você mudou na sua prática neste ciclo?",
      ajuda: "Descreva a mudança concreta, não a intenção.",
      ordem: 1,
    },
    {
      id: "rf-2",
      pergunta: "Que evidência mostra que a mudança fez diferença?",
      ajuda: "Pode ser uma cena de sala, uma produção dos alunos, um registro.",
      ordem: 2,
    },
    {
      id: "rf-3",
      pergunta: "O que a devolutiva recebida trouxe de novo para você?",
      ajuda: "Relacione com o parecer do coordenador ou da equipe central.",
      ordem: 3,
    },
    {
      id: "rf-4",
      pergunta: "O que você leva deste ciclo para o próximo?",
      ajuda: "Um compromisso concreto para o próximo tema.",
      ordem: 4,
    },
  ],
  dimensoesAutoavaliacao: dimensoesAutoavaliacaoSeed,
  // Enquete 360°: perguntas e públicos ainda em definição, por isso ficam aqui.
  enquete: {
    titulo: "Enquete 360°",
    instrucao:
      "As respostas são usadas de forma agregada para o desenvolvimento do docente.",
    respondentes: [
      {
        id: "resp-docente",
        nome: "O próprio docente",
        descricao: "Autopercepção ao final do ciclo.",
      },
      {
        id: "resp-coordenador",
        nome: "Coordenador",
        descricao: "Percepção de quem acompanhou o percurso.",
      },
      {
        id: "resp-estudante",
        nome: "Estudante",
        descricao: "Percepção da turma sobre as aulas.",
      },
      {
        id: "resp-familia",
        nome: "Família",
        descricao: "Percepção das famílias sobre a comunicação e o cuidado.",
      },
    ],
    perguntas: [
      {
        id: "pg-1",
        texto: "As aulas têm objetivos claros para quem participa delas.",
        tipo: "escala",
        ordem: 1,
        respondentes: [],
      },
      {
        id: "pg-2",
        texto: "O retorno sobre o que foi aprendido chega de forma útil.",
        tipo: "escala",
        ordem: 2,
        respondentes: [],
      },
      {
        id: "pg-3",
        texto: "Todos se sentem acolhidos e ouvidos na sala.",
        tipo: "escala",
        ordem: 3,
        respondentes: [],
      },
      {
        id: "pg-4",
        texto: "A comunicação com as famílias é clara e frequente.",
        tipo: "escala",
        ordem: 4,
        respondentes: ["resp-familia", "resp-coordenador"],
      },
      {
        id: "pg-5",
        texto: "O que mais ajudou você neste ciclo?",
        tipo: "texto",
        ordem: 5,
        respondentes: [],
      },
    ],
  },
};

// Ciclo 2028: nasce vazio (item 8, Pacote 1 sessão 1) — a operadora
// configura do zero, isolado do 2027. Os temas não são copiados: vêm do
// macrociclo (D40), o mesmo para os dois mesociclos.
export const cicloConfig2028Seed: CicloConfig = {
  id: "ciclo-2028",
  mesocicloId: MESOCICLO_2028_ID,
  nome: "Ciclo 3",
  descricao: "",
  periodo: "2028",
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

export const cicloConfigsSeed: CicloConfig[] = [
  cicloConfigSeed,
  cicloConfig2028Seed,
];

// Snapshot congelado (D53): a primeira versão do conjunto de perguntas de
// cada "formulário", gerada a partir do próprio cicloConfigSeed. Sem tela
// que crie uma versão nova ainda — isso é editar as perguntas entre
// mesociclos, fora do escopo deste pacote.
const formularioVersoesSeed: FormularioVersao[] = [
  {
    id: "fv-enquete-v1",
    origem: "enquete",
    perguntas: cicloConfigSeed.enquete.perguntas,
    criadaEmISO: ABERTURA,
  },
  {
    id: "fv-portfolio-v1",
    origem: "portfolio",
    perguntas: cicloConfigSeed.reflexoesPortfolio,
    criadaEmISO: ABERTURA,
  },
  {
    id: "fv-autoavaliacao-v1",
    origem: "autoavaliacao",
    perguntas: cicloConfigSeed.dimensoesAutoavaliacao,
    criadaEmISO: ABERTURA,
  },
];

const unidades = [
  "Unidade Centro",
  "Unidade Norte",
  "Unidade Sul",
  "Unidade Leste",
];

const nomesDocentes = [
  "Ana Paula Ribeiro",
  "Bruno Tavares Lima",
  "Camila Souza Prado",
  "Diego Fernandes Rocha",
  "Elaine Cristina Moura",
  "Fábio Nogueira Alves",
  "Gabriela Martins Dias",
  "Henrique Barros Pinto",
  "Isabela Cardoso Freitas",
  "João Vitor Mendes",
  "Karina Oliveira Sales",
  "Lucas Andrade Campos",
  "Mariana Teixeira Lopes",
  "Nathan Ferreira Gomes",
  "Olívia Ramos Bastos",
  "Paulo Sérgio Antunes",
  "Queila Amaral Duarte",
  "Rafael Monteiro Silva",
  "Simone Duarte Correia",
  "Tiago Almeida Peixoto",
  "Úrsula Batista Nunes",
  "Vinícius Carvalho Reis",
  "Wanessa Lima Figueiredo",
  "Yuri Machado Santana",
];

const coordenadoresSeed: Pessoa[] = [
  {
    id: "coord-1",
    nome: "Beatriz Nunes Coelho",
    matricula: "C-1001",
    unidade: "Unidade Centro",
    perfil: "coordenador",
    email: "beatriz.coelho@rede.edu.br",
  },
  {
    id: "coord-2",
    nome: "Marcelo Pires Aguiar",
    matricula: "C-1002",
    unidade: "Unidade Norte",
    perfil: "coordenador",
    email: "marcelo.aguiar@rede.edu.br",
  },
  // Sem nenhuma alocação (ver alocacoesSeed) — demonstra o alerta de
  // "coordenador sem liderados" (D37).
  {
    id: "coord-3",
    nome: "Patrícia Lemos Vidal",
    matricula: "C-1003",
    unidade: "Unidade Sul",
    perfil: "coordenador",
    email: "patricia.vidal@rede.edu.br",
  },
];

const outrasPessoas: Pessoa[] = [
  {
    id: "oper-1",
    nome: "Equipe Operadora — Renata Vasques",
    matricula: "O-2001",
    unidade: "Sede",
    perfil: "operadora",
    email: "renata.vasques@rede.edu.br",
  },
  {
    id: "dir-1",
    nome: "Sérgio Lacerda Pontes",
    matricula: "D-3001",
    unidade: "Unidade Centro",
    perfil: "diretor",
    email: "sergio.pontes@rede.edu.br",
  },
];

const docentesSeed: Pessoa[] = nomesDocentes.map((nome, i) => ({
  id: `doc-${i + 1}`,
  nome,
  matricula: `M-${4000 + i}`,
  unidade: unidades[i % unidades.length]!,
  perfil: "docente",
  email: `${nome.split(" ")[0]!.toLowerCase()}.${i + 1}@rede.edu.br`,
}));

// Perfil moderador (D33): acesso restrito a turmas específicas, só para
// lançar presença e validar entregas ali — sem acesso à configuração.
const moderadoresSeed: Pessoa[] = [
  {
    id: "mod-1",
    nome: "Jonas Prado Siqueira",
    matricula: "MD-5001",
    unidade: "Unidade Centro",
    perfil: "moderador",
    turmaIds: ["turma-1-1-1", "turma-1-1-2"],
    email: "jonas.siqueira@rede.edu.br",
  },
];

export const pessoasSeed: Pessoa[] = [
  ...docentesSeed,
  ...coordenadoresSeed,
  ...outrasPessoas,
  ...moderadoresSeed,
];

/**
 * Alocação líder-liderado (D35) — substitui o antigo `Pessoa.coordenadorId`
 * fixo. Mesmo round-robin de antes (blocos de 4 docentes por coordenador),
 * com dois ajustes de propósito para a demonstração do D37: doc-24 (o
 * último) fica sem nenhum líder, e doc-1 ganha um segundo líder (coord-2),
 * para mostrar a aba "Líder(es)" com mais de um.
 */
const alocacoesSeed: Alocacao[] = docentesSeed
  .map((doc, i) => ({ doc, i }))
  .filter(({ i }) => i !== docentesSeed.length - 1)
  .map(({ doc, i }) => ({
    id: `aloc-${doc.id}`,
    coordenadorId: Math.floor(i / 4) % 2 === 0 ? "coord-1" : "coord-2",
    docenteId: doc.id,
    criadaEmISO: dias(5),
  }));
alocacoesSeed.push({
  id: "aloc-doc-1-extra",
  coordenadorId: "coord-2",
  docenteId: "doc-1",
  criadaEmISO: dias(6),
});

// Duas turmas por modalidade em cada tema: permite trocar de turma
// mantendo a mesma modalidade.
interface HorarioTurma {
  sufixo: string;
  periodo: string;
  horario: string;
  dia: number | undefined;
}

const horariosSincronos: HorarioTurma[] = [
  {
    sufixo: "Turma A",
    periodo: "Manhã",
    horario: "Terças, 8h30 às 10h30",
    dia: 2,
  },
  {
    sufixo: "Turma B",
    periodo: "Tarde",
    horario: "Quintas, 14h às 16h",
    dia: 4,
  },
];
const horariosAssincronos: HorarioTurma[] = [
  {
    sufixo: "Turma A",
    periodo: "Livre",
    horario: "No seu ritmo",
    dia: undefined,
  },
  {
    sufixo: "Turma B",
    periodo: "Livre",
    horario: "No seu ritmo, com tutoria quinzenal",
    dia: undefined,
  },
];

const nomesProfessores = [
  "Prof. Marcos Vinícius Teles",
  "Profa. Renata Aguiar Bittencourt",
  "Prof. Eduardo Salgado Nunes",
  "Profa. Camila Rezende Xavier",
  "Prof. Otávio Barreto Lima",
  "Profa. Juliana Prado Castilho",
];

export const turmasSeed: Turma[] = temasSeed.flatMap((tema, i) =>
  modalidadesSeed.flatMap((mod, j) => {
    // A condição é sempre `!mod.presencaAutomatica`, nunca a posição `j` no
    // array — reordenar ou acrescentar modalidade não pode trocar quem
    // ganha link e dias da semana.
    const sincrona = !mod.presencaAutomatica;
    const horarios = sincrona ? horariosSincronos : horariosAssincronos;
    return horarios.map((h, k) => ({
      id: `turma-${i + 1}-${j + 1}-${k + 1}`,
      mesocicloId: MESOCICLO_2027_ID,
      nome: `${tema.nome.split("—")[0]!.trim()} · ${mod.nome} · ${h.sufixo}`,
      temaId: tema.id,
      modalidadeId: mod.id,
      periodo: h.periodo,
      horario: h.horario,
      vagas: k === 0 ? 20 : 12,
      // uma turma já nasce esgotada para a demonstração
      vagasOcupadas: i === 1 && j === 0 && k === 1 ? 12 : 0,
      professorNome: nomesProfessores[(i + j + k) % nomesProfessores.length]!,
      linkAcesso: sincrona
        ? `https://encontro.rede.edu.br/jornada/turma-${i + 1}-${j + 1}-${k + 1}`
        : undefined,
      diasSemana: h.dia !== undefined ? [h.dia] : [],
      encontrosPrevistos: sincrona ? 4 : 0,
    }));
  }),
);

function dias(n: number): string {
  const base = new Date(ABERTURA).getTime();
  return new Date(base + n * 86400000).toISOString();
}

/** Distribui os docentes em estágios diferentes para o painel ter o que mostrar. */
function construirProgresso() {
  const inscricoes: Inscricao[] = [];
  const progressoEtapas: ProgressoEtapa[] = [];
  const entregas: Entrega[] = [];
  const devolutivas: Devolutiva[] = [];
  const observacoes: Observacao[] = [];
  const notificacoes: Notificacao[] = [];
  const autoavaliacoes: Autoavaliacao[] = [];
  // Ciclo 1 (2023–2026): temas já cumpridos, usados para bloquear repetição.
  const historicoTemas: HistoricoTema[] = [];
  const turmas = turmasSeed.map((t) => ({ ...t }));

  const dimensoesBase = ["planejamento", "mediacao", "avaliacao", "clima"];

  docentesSeed.forEach((doc, i) => {
    // Cada docente cumpriu dois temas no ciclo anterior.
    [
      { indice: (i + 2) % temasSeed.length, ano: 2024 },
      { indice: (i + 5) % temasSeed.length, ano: 2026 },
    ].forEach(({ indice, ano }, k) => {
      const tema = temasSeed[indice]!;
      historicoTemas.push({
        id: `hist-${doc.id}-${k}`,
        pessoaId: doc.id,
        temaId: tema.id,
        temaNome: tema.nome,
        ciclo: "Ciclo 1",
        ano,
        turmaNome: `Turma ${k === 0 ? "A" : "B"} · ${ano}`,
        modalidadeNome: k === 0 ? "Síncrona" : "Assíncrona",
        entregaTitulo: "Planejamento de aula e portfólio",
        entregaResumo:
          "Sequência didática construída a partir do tema, com registro da aula observada.",
        devolutivaTexto:
          "Percurso cumprido com consistência. Destaque para o registro das evidências de aprendizagem.",
        devolutivaAutor:
          k === 0 ? "Coordenação da unidade" : "Equipe central de formação",
        conquistas:
          k === 0
            ? ["Ponto de partida", "Percurso escolhido"]
            : ["Prática compartilhada", "Ciclo completo"],
      });
    });

    // 0 = início, 1 = meio, 2 = pendência vencida, 3 = concluído
    const estagio = i % 4;
    const etapasConcluidas =
      estagio === 0 ? 1 : estagio === 1 ? 3 : estagio === 2 ? 4 : 8;

    if (estagio >= 0) {
      autoavaliacoes.push({
        id: `aa-${doc.id}`,
        pessoaId: doc.id,
        etapaId: "et-1",
        respostas: {},
        dimensoes: Object.fromEntries(
          dimensoesBase.map((d, k) => [d, 2 + ((i + k) % 4) * 0.7]),
        ),
        concluidaEmISO: dias(5 + (i % 4)),
      });
    }

    // i === 0 é doc-1, pessoa padrão do perfil docente-regente (store.tsx):
    // sem esta exceção ele fica sem inscrição, sem turma e sem oferta — quem
    // abre o protótipo pela primeira vez não veria conteúdo nenhum em /aulas.
    let turmaDoDocente: Turma | undefined;
    if (etapasConcluidas >= 2 || i === 0) {
      const turma = turmas[i % turmas.length]!;
      turma.vagasOcupadas += 1;
      turmaDoDocente = turma;
      inscricoes.push({
        id: `insc-${doc.id}`,
        pessoaId: doc.id,
        turmaId: turma.id,
        temaId: turma.temaId,
        // Mesmo bloco-de-4 que antes distinguia cargo na pessoa (D34).
        tipoParticipacao: i % 4 === 3 ? "corregente" : "regente",
        criadaEmISO: dias(12 + (i % 5)),
      });
    }
    const modalidadeDoDocente = turmaDoDocente
      ? modalidadesSeed.find((m) => m.id === turmaDoDocente!.modalidadeId)
      : undefined;

    etapasSeed.forEach((etapa, idx) => {
      let status: ProgressoEtapa["status"] = "nao_iniciada";
      if (idx < etapasConcluidas) status = "concluida";
      else if (idx === etapasConcluidas)
        status = estagio === 2 ? "atrasada" : "em_andamento";

      // Só a modalidade assíncrona registra presença pelo envio da tarefa
      // (D16) — antes isto disparava para qualquer modalidade.
      const presencaAuto =
        etapa.tipo === "conteudo" &&
        status === "concluida" &&
        modalidadeDoDocente?.presencaAutomatica === true
          ? dias(30 + (i % 10))
          : undefined;

      progressoEtapas.push({
        id: `prog-${doc.id}-${etapa.id}`,
        pessoaId: doc.id,
        etapaId: etapa.id,
        status,
        atualizadoEmISO: dias(10 + idx * 8),
        presencaEmISO: presencaAuto,
      });
    });

    // Estágio 2: tarefa já enviada e aguardando devolutiva do coordenador.
    const entregaAguardando = estagio === 2;
    if (etapasConcluidas >= 5 || entregaAguardando) {
      const entregaId = `ent-${doc.id}`;
      entregas.push({
        id: entregaId,
        pessoaId: doc.id,
        etapaId: "et-5",
        texto:
          "Planejamento da sequência didática desenvolvida a partir do tema do ciclo.",
        arquivoNome: "planejamento-aula.pdf",
        arquivoTipo: "application/pdf",
        arquivoTamanho: 248_000,
        // Parte das aulas do estágio 2 já aconteceu e segue sem parecer:
        // vira pendência do coordenador, não do docente.
        dataAulaISO:
          entregaAguardando && i % 8 === 2
            ? new Date(
                Date.now() - (2 + (i % 5)) * 86400000 - (i % 6) * 3600000,
              ).toISOString()
            : dias(80 + (i % 12)),
        enviadaEmISO: dias(70 + (i % 6)),
        destino: i % 4 === 3 ? "equipe_central" : "coordenador",
        status:
          etapasConcluidas >= 6 && !entregaAguardando
            ? "devolutiva_disponivel"
            : "em_analise",
      });

      if (etapasConcluidas >= 6 && !entregaAguardando) {
        const coordenadorId =
          alocacoesSeed.find((a) => a.docenteId === doc.id)?.coordenadorId ??
          "coord-1";
        devolutivas.push({
          id: `dev-${doc.id}`,
          entregaId,
          pessoaId: doc.id,
          autorId: coordenadorId,
          texto:
            "Planejamento coerente com o tema. Sugiro ampliar as estratégias de mediação na etapa de fechamento.",
          parecer: "Atende",
          criadaEmISO: dias(88 + (i % 5)),
          cienciaEmISO: i % 3 === 0 ? dias(90 + (i % 5)) : undefined,
        });

        observacoes.push({
          id: `obs-${doc.id}`,
          pessoaId: doc.id,
          coordenadorId,
          etapaId: "et-6",
          dataAulaISO: dias(80 + (i % 12)),
          realizadaEmISO: dias(81 + (i % 12)),
          comentario: "Aula observada com boa condução das intervenções.",
        });
      }
    }

    if (estagio === 2) {
      notificacoes.push({
        id: `not-${doc.id}`,
        pessoaId: doc.id,
        titulo: "Etapa com prazo vencido",
        descricao: `A etapa "${etapasSeed[etapasConcluidas]?.nome ?? ""}" está atrasada.`,
        criadaEmISO: dias(60),
        lida: false,
        tipo: "pendencia",
      });
    }
  });

  return {
    turmas,
    inscricoes,
    progressoEtapas,
    entregas,
    devolutivas,
    observacoes,
    notificacoes,
    autoavaliacoes,
    historicoTemas,
  };
}

/** Respostas já coletadas da Enquete 360°, de públicos diferentes. */
function construirRespostasEnquete(): RespostaEnquete[] {
  const perguntas = cicloConfigSeed.enquete.perguntas;
  const publicos = cicloConfigSeed.enquete.respondentes;
  const respostas: RespostaEnquete[] = [];

  docentesSeed.forEach((doc, i) => {
    // Só docentes mais adiantados no ciclo já têm enquete coletada.
    if (i % 4 !== 3) return;
    publicos.forEach((publico, p) => {
      const quantas = publico.id === "resp-estudante" ? 3 : 1;
      for (let n = 0; n < quantas; n += 1) {
        const escalas: Record<string, number> = {};
        const textos: Record<string, string> = {};
        perguntas.forEach((pg, q) => {
          if (
            pg.respondentes.length > 0 &&
            !pg.respondentes.includes(publico.id)
          )
            return;
          if (pg.tipo === "escala") {
            escalas[pg.id] = 3 + ((i + p + q + n) % 3);
          } else {
            textos[pg.id] =
              "O retorno recebido depois das aulas ajudou a entender o que estava sendo pedido.";
          }
        });
        respostas.push({
          id: `enq-${doc.id}-${publico.id}-${n}`,
          docenteId: doc.id,
          etapaId: "et-8",
          respondenteTipoId: publico.id,
          respondenteNome:
            publico.id === "resp-docente"
              ? doc.nome
              : `${publico.nome} ${n + 1}`,
          escalas,
          textos,
          enviadaEmISO: dias(120 + ((i + p) % 8)),
          formularioVersaoId: "fv-enquete-v1",
        });
      }
    });
  });

  return respostas;
}

function criterio(
  tipo: TipoCriterioAvanco,
  ativo: boolean,
  extra?: Partial<CriterioAvanco>,
): CriterioAvanco {
  return { tipo, ativo, ...extra };
}

/**
 * Duas ofertas contrastantes do MESMO tema (mt-1), na etapa de
 * conteúdo (et-3) — o centro da demonstração de P1: síncrono e assíncrono
 * recebem itens e critérios diferentes. Mais uma oferta mínima de um
 * segundo tema (mt-2), só para mostrar que trocar de tema na
 * configuração troca o conteúdo.
 *
 * Docentes usados, todos já inscritos nas turmas certas por
 * `construirProgresso()`: doc-1 (síncrona, turma-1-1-1, ainda em
 * andamento), doc-2 (síncrona, turma-1-1-2, concluído), doc-3 (assíncrona,
 * turma-1-2-1, concluído e validado), doc-4 (assíncrona, turma-1-2-2,
 * parcial e com nota abaixo do corte).
 */
function construirConteudoDemonstravel() {
  const midias: Midia[] = [
    {
      id: "midia-mt1-sync-webconf",
      nome: "Encontro síncrono — Tema 1",
      tipo: "link",
      url: "https://encontro.rede.edu.br/jornada/mt1-sincrona",
      enviadaEmISO: dias(20),
      enviadaPorId: "oper-1",
    },
    {
      id: "midia-mt1-sync-texto",
      nome: "Texto-base — Planejamento e intencionalidade (síncrono)",
      tipo: "texto",
      corpo:
        "O planejamento intencional parte de perguntas simples: o que os estudantes vão aprender, e como vou saber que aprenderam?\n\n" +
        "Nesta etapa síncrona, o encontro ao vivo é o espaço para experimentar essas perguntas em grupo, antes de levá-las para a sala de aula.",
      enviadaEmISO: dias(20),
      enviadaPorId: "oper-1",
    },
    {
      id: "midia-mt1-async-video-1",
      nome: "Aula 1 — Introdução ao planejamento intencional",
      tipo: "video",
      arquivoTipo: "video/mp4",
      tamanhoBytes: 84_000_000,
      referenciaDrive:
        "drive-institucional/biblioteca-de-midia/midia-mt1-async-video-1/aula-1.mp4",
      duracaoMin: 12,
      enviadaEmISO: dias(18),
      enviadaPorId: "oper-1",
    },
    {
      id: "midia-mt1-async-video-2",
      nome: "Aula 2 — Da intenção ao objetivo de aprendizagem",
      tipo: "video",
      arquivoTipo: "video/mp4",
      tamanhoBytes: 91_000_000,
      referenciaDrive:
        "drive-institucional/biblioteca-de-midia/midia-mt1-async-video-2/aula-2.mp4",
      duracaoMin: 14,
      enviadaEmISO: dias(18),
      enviadaPorId: "oper-1",
    },
    {
      id: "midia-mt1-async-video-3",
      nome: "Aula 3 — Planejando por etapas",
      tipo: "video",
      arquivoTipo: "video/mp4",
      tamanhoBytes: 77_000_000,
      referenciaDrive:
        "drive-institucional/biblioteca-de-midia/midia-mt1-async-video-3/aula-3.mp4",
      duracaoMin: 11,
      enviadaEmISO: dias(18),
      enviadaPorId: "oper-1",
    },
    {
      id: "midia-mt1-async-video-4",
      nome: "Aula 4 — Registrando e ajustando o planejamento",
      tipo: "video",
      arquivoTipo: "video/mp4",
      tamanhoBytes: 88_000_000,
      referenciaDrive:
        "drive-institucional/biblioteca-de-midia/midia-mt1-async-video-4/aula-4.mp4",
      duracaoMin: 13,
      enviadaEmISO: dias(18),
      enviadaPorId: "oper-1",
    },
    {
      id: "midia-mt1-async-texto",
      nome: "Texto-base — Planejamento e intencionalidade (assíncrono)",
      tipo: "texto",
      corpo:
        "O planejamento intencional parte de perguntas simples: o que os estudantes vão aprender, e como vou saber que aprenderam?\n\n" +
        "Assista às quatro aulas na ordem e volte a este texto sempre que precisar — ele resume os pontos centrais de cada uma.\n\n" +
        "Ao final, você vai registrar, na tarefa desta etapa, uma prática concreta que pretende experimentar.",
      enviadaEmISO: dias(18),
      enviadaPorId: "oper-1",
    },
    {
      id: "midia-mt2-sync-texto",
      nome: "Texto-base — Mediação e engajamento",
      tipo: "texto",
      corpo:
        "Mediar não é só intervir quando algo dá errado: é sustentar o engajamento da turma enquanto o percurso acontece.",
      enviadaEmISO: dias(20),
      enviadaPorId: "oper-1",
    },
  ];

  const ofertas: OfertaConteudo[] = [
    {
      id: "oferta-mt1-sync",
      etapaId: "et-3",
      temaId: "mt-1",
      modalidadeId: "mod-sincrona",
      criterios: [
        criterio("aulas_assistidas", false),
        criterio("leitura_concluida", false),
        criterio("presenca", true, { percentualMinimo: 75 }),
        criterio("tarefa_entregue", true),
        criterio("tarefa_validada", false),
      ],
    },
    {
      id: "oferta-mt1-async",
      etapaId: "et-3",
      temaId: "mt-1",
      modalidadeId: "mod-assincrona",
      criterios: [
        criterio("aulas_assistidas", true),
        criterio("leitura_concluida", true),
        criterio("presenca", false),
        criterio("tarefa_entregue", false),
        criterio("tarefa_validada", true, { notaCorte: 7 }),
      ],
    },
    {
      id: "oferta-mt2-sync",
      etapaId: "et-3",
      temaId: "mt-2",
      modalidadeId: "mod-sincrona",
      criterios: [
        criterio("aulas_assistidas", false),
        criterio("leitura_concluida", true),
        criterio("presenca", false),
        criterio("tarefa_entregue", false),
        criterio("tarefa_validada", false),
      ],
    },
  ];

  const itensConteudo: ItemConteudo[] = [
    {
      id: "item-mt1-sync-webconf",
      ofertaId: "oferta-mt1-sync",
      tipo: "webconferencia",
      titulo: "Encontro síncrono do tema",
      descricao: "Encontro ao vivo com a turma para o Tema 1.",
      ordem: 1,
      midiaId: "midia-mt1-sync-webconf",
    },
    {
      id: "item-mt1-sync-texto",
      ofertaId: "oferta-mt1-sync",
      tipo: "texto",
      titulo: "Texto-base do tema",
      descricao: "Leitura de apoio para o encontro síncrono.",
      ordem: 2,
      midiaId: "midia-mt1-sync-texto",
    },
    {
      id: "item-mt1-sync-tarefa",
      ofertaId: "oferta-mt1-sync",
      tipo: "tarefa",
      titulo: "Registro da prática",
      descricao: "",
      ordem: 3,
      enunciado:
        "Depois do encontro síncrono, registre uma prática concreta que você vai experimentar na sua sala nas próximas duas semanas.",
    },
    {
      id: "item-mt1-async-video-1",
      ofertaId: "oferta-mt1-async",
      tipo: "video",
      titulo: "Aula 1 — Introdução ao planejamento intencional",
      descricao: "",
      ordem: 1,
      midiaId: "midia-mt1-async-video-1",
    },
    {
      id: "item-mt1-async-video-2",
      ofertaId: "oferta-mt1-async",
      tipo: "video",
      titulo: "Aula 2 — Da intenção ao objetivo de aprendizagem",
      descricao: "",
      ordem: 2,
      midiaId: "midia-mt1-async-video-2",
    },
    {
      id: "item-mt1-async-video-3",
      ofertaId: "oferta-mt1-async",
      tipo: "video",
      titulo: "Aula 3 — Planejando por etapas",
      descricao: "",
      ordem: 3,
      midiaId: "midia-mt1-async-video-3",
    },
    {
      id: "item-mt1-async-video-4",
      ofertaId: "oferta-mt1-async",
      tipo: "video",
      titulo: "Aula 4 — Registrando e ajustando o planejamento",
      descricao: "",
      ordem: 4,
      midiaId: "midia-mt1-async-video-4",
    },
    {
      id: "item-mt1-async-texto",
      ofertaId: "oferta-mt1-async",
      tipo: "texto",
      titulo: "Texto-base do tema",
      descricao: "Leitura de apoio às quatro aulas.",
      ordem: 5,
      midiaId: "midia-mt1-async-texto",
    },
    {
      id: "item-mt1-async-tarefa",
      ofertaId: "oferta-mt1-async",
      tipo: "tarefa",
      titulo: "Registro da prática",
      descricao: "",
      ordem: 6,
      enunciado:
        "Depois de assistir às quatro aulas e ler o texto-base, registre uma prática concreta que você vai experimentar na sua sala nas próximas duas semanas.",
    },
    {
      id: "item-mt2-sync-texto",
      ofertaId: "oferta-mt2-sync",
      tipo: "texto",
      titulo: "Texto-base do tema",
      descricao: "Leitura de apoio para o Tema 2.",
      ordem: 1,
      midiaId: "midia-mt2-sync-texto",
    },
    // Demonstra questionário como item distinto de tarefa (D31) — múltipla
    // escolha, sem campo de resposta aberta.
    {
      id: "item-mt2-sync-questionario",
      ofertaId: "oferta-mt2-sync",
      tipo: "questionario",
      titulo: "Verificação de leitura — Mediação e engajamento",
      descricao: "Duas perguntas rápidas sobre o texto-base.",
      ordem: 2,
      perguntas: [
        {
          id: "pgq-mt2-1",
          enunciado:
            "Mediar a turma significa, sobretudo, intervir quando algo dá errado.",
          opcoes: ["Verdadeiro", "Falso"],
          ordem: 1,
        },
        {
          id: "pgq-mt2-2",
          enunciado:
            "O que mais sustenta o engajamento da turma ao longo do percurso?",
          opcoes: [
            "Regras rígidas definidas no primeiro dia",
            "A mediação contínua do professor",
            "A ausência de intervenção do professor",
          ],
          ordem: 2,
        },
      ],
    },
  ];

  // doc-1 (turma-1-1-1): 2 de 4 encontros lançados — nem zerado, nem
  // completo, exatamente o roteiro pedido para a demonstração de presença.
  const presencas: Presenca[] = [1, 2].map((encontro) => ({
    id: `pres-doc-1-${encontro}`,
    pessoaId: "doc-1",
    turmaId: "turma-1-1-1",
    etapaId: "et-3",
    encontro,
    presente: true,
    lancadaEmISO: dias(35 + encontro),
    lancadaPorId: "oper-1",
  }));
  // doc-2 (turma-1-1-2): os 4 encontros completos.
  presencas.push(
    ...[1, 2, 3, 4].map((encontro) => ({
      id: `pres-doc-2-${encontro}`,
      pessoaId: "doc-2",
      turmaId: "turma-1-1-2",
      etapaId: "et-3",
      encontro,
      presente: true,
      lancadaEmISO: dias(35 + encontro),
      lancadaPorId: "oper-1",
    })),
  );

  // doc-2: tarefa da etapa de conteúdo entregue (síncrono, critério atendido).
  const entregas: Entrega[] = [
    {
      id: "ent-conteudo-doc-2",
      pessoaId: "doc-2",
      etapaId: "et-3",
      texto:
        "Vou propor uma rotina semanal de intenção de aprendizagem escrita no quadro, revisitada no fechamento de cada aula.",
      enviadaEmISO: dias(40),
      destino: "coordenador",
      status: "em_analise",
    },
    // doc-3: todas as aulas e a leitura concluídas, tarefa entregue e
    // validada com nota acima do corte — critério de nota "atendido".
    {
      id: "ent-conteudo-doc-3",
      pessoaId: "doc-3",
      etapaId: "et-3",
      texto:
        "Vou registrar, em um diário de bordo, o objetivo de aprendizagem de cada aula antes de começar a turma.",
      enviadaEmISO: dias(38),
      destino: "coordenador",
      status: "devolutiva_disponivel",
    },
    // doc-4: só 2 das 4 aulas e leitura parcial — tarefa entregue, mas com
    // nota abaixo do corte — critério de nota "pendente".
    {
      id: "ent-conteudo-doc-4",
      pessoaId: "doc-4",
      etapaId: "et-3",
      texto:
        "Pretendo anotar os objetivos de aprendizagem no diário de classe.",
      enviadaEmISO: dias(41),
      destino: "coordenador",
      status: "devolutiva_disponivel",
    },
  ];

  const devolutivas: Devolutiva[] = [
    {
      id: "dev-conteudo-doc-3",
      entregaId: "ent-conteudo-doc-3",
      pessoaId: "doc-3",
      autorId: "coord-1",
      texto:
        "Registro consistente e alinhado ao tema. A prática proposta é concreta e viável.",
      parecer: "Atende",
      nota: 8,
      criadaEmISO: dias(44),
    },
    {
      id: "dev-conteudo-doc-4",
      entregaId: "ent-conteudo-doc-4",
      pessoaId: "doc-4",
      autorId: "coord-1",
      texto:
        "A prática ainda está genérica. Volte ao texto-base e detalhe como vai saber que os estudantes aprenderam.",
      parecer: "Ajustar",
      nota: 5,
      criadaEmISO: dias(44),
    },
  ];

  const progressoAulas: ProgressoAula[] = [
    ...[
      "item-mt1-async-video-1",
      "item-mt1-async-video-2",
      "item-mt1-async-video-3",
      "item-mt1-async-video-4",
    ].map((aulaId, k) => ({
      id: `paula-doc-3-${k}`,
      pessoaId: "doc-3",
      etapaId: "et-3",
      aulaId,
      concluidaEmISO: dias(30 + k),
    })),
    ...["item-mt1-async-video-1", "item-mt1-async-video-2"].map(
      (aulaId, k) => ({
        id: `paula-doc-4-${k}`,
        pessoaId: "doc-4",
        etapaId: "et-3",
        aulaId,
        concluidaEmISO: dias(30 + k),
      }),
    ),
  ];

  const progressoLeituras: ProgressoLeitura[] = [
    {
      id: "leit-doc-3",
      pessoaId: "doc-3",
      etapaId: "et-3",
      percentual: 100,
      concluidaEmISO: dias(33),
    },
    {
      id: "leit-doc-4",
      pessoaId: "doc-4",
      etapaId: "et-3",
      percentual: 40,
    },
  ];

  // Aviso "antes do prazo" já disparado, plantado no seed — o cálculo
  // dinâmico contra o relógio real não serve para esta demonstração (ver
  // lib/gestao.ts: alertasDisparados), então o momento vem pronto, no mesmo
  // padrão do status "atrasada".
  const notificacoesAlertas: Notificacao[] = [
    {
      id: "not-antes-doc-6",
      pessoaId: "doc-6",
      titulo: "Prazo próximo: Conteúdo base do tema",
      descricao: "Faltam 3 dias para o prazo desta etapa.",
      criadaEmISO: dias(42),
      lida: false,
      tipo: "prazo_proximo",
      momento: "antes",
    },
  ];

  return {
    midias,
    ofertas,
    itensConteudo,
    presencas,
    entregas,
    devolutivas,
    progressoAulas,
    progressoLeituras,
    notificacoesAlertas,
  };
}

export function criarEstadoInicial(): EstadoApp {
  const derivado = construirProgresso();
  const conteudo = construirConteudoDemonstravel();
  return {
    versao: VERSAO_ESTADO,
    perfilAtivo: "docente-regente",
    pessoaAtivaId: "doc-1",
    macrociclos: macrociclosSeed,
    mesociclos: mesociclosSeed,
    temas: temasSeed,
    temasNoMesociclo: temasNoMesocicloSeed,
    cicloConfigs: cicloConfigsSeed,
    pessoas: pessoasSeed,
    turmas: derivado.turmas,
    inscricoes: derivado.inscricoes,
    alocacoes: alocacoesSeed,
    progressoEtapas: derivado.progressoEtapas,
    progressoAulas: conteudo.progressoAulas,
    progressoLeituras: conteudo.progressoLeituras,
    entregas: [...derivado.entregas, ...conteudo.entregas],
    devolutivas: [...derivado.devolutivas, ...conteudo.devolutivas],
    observacoes: derivado.observacoes,
    notificacoes: [...derivado.notificacoes, ...conteudo.notificacoesAlertas],
    autoavaliacoes: derivado.autoavaliacoes,
    historicoTemas: derivado.historicoTemas,
    temaVersoes: temaVersoesSeed,
    // Sem lógica que gere conclusão/certificado ainda (Pacote 0 é só o
    // schema) — o gatilho de conclusão entra no Pacote 2, junto do
    // encerramento; emissão de certificado está fora do MVP de dezembro.
    conclusoes: [],
    certificados: [],
    formularioVersoes: formularioVersoesSeed,
    portfolios: [],
    midias: conteudo.midias,
    ofertas: conteudo.ofertas,
    itensConteudo: conteudo.itensConteudo,
    presencas: conteudo.presencas,
    respostasEnquete: construirRespostasEnquete(),
    // Sem tela que grave auditoria ainda — nasce vazia, como
    // conclusoes/certificados.
    auditorias: [],
  };
}
