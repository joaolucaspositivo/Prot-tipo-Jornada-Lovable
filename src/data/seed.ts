// ATENÇÃO: tudo neste arquivo é SEED de demonstração, não é regra do sistema.
// A equipe operadora edita a configuração pela interface; estes valores apenas
// dão um ponto de partida coerente para a validação do protótipo.

import type {
  Autoavaliacao,
  CicloConfig,
  Devolutiva,
  Entrega,
  EstadoApp,
  Etapa,
  HistoricoMacrotema,
  Inscricao,
  Notificacao,
  Observacao,
  Pessoa,
  ProgressoEtapa,
  RespostaEnquete,
  Turma,
} from "./types";

export const VERSAO_ESTADO = 6;
export const CHAVE_STORAGE = "jornada-prototipo-v1";

const ABERTURA = "2027-02-08T00:00:00.000Z";

const alertaPadrao = { diasParaCoordenador: 3, alertarDocente: true };

const segmentosSeed = [
  { id: "seg-ei", nome: "Educação Infantil" },
  { id: "seg-fi", nome: "Fundamental I" },
  { id: "seg-fii", nome: "Fundamental II" },
  { id: "seg-em", nome: "Ensino Médio" },
];

const macrotemasSeed = [
  {
    id: "mt-1",
    nome: "Macrotema 1 — Planejamento e intencionalidade",
    descricao: "Como o planejamento se conecta às intenções de aprendizagem.",
    dimensaoRelacionada: "planejamento",
  },
  {
    id: "mt-2",
    nome: "Macrotema 2 — Mediação e engajamento",
    descricao: "Estratégias de mediação que sustentam o engajamento da turma.",
    dimensaoRelacionada: "mediacao",
  },
  {
    id: "mt-3",
    nome: "Macrotema 3 — Avaliação formativa",
    descricao: "Uso da avaliação como instrumento de percurso.",
    dimensaoRelacionada: "avaliacao",
  },
  {
    id: "mt-4",
    nome: "Macrotema 4 — Cultura de sala e convivência",
    descricao: "Clima, combinados e relações na sala de aula.",
    dimensaoRelacionada: "clima",
  },
  {
    id: "mt-5",
    nome: "Macrotema 5 — Tecnologias na aprendizagem",
    descricao: "Integração de recursos digitais com propósito pedagógico.",
    dimensaoRelacionada: "planejamento",
  },
  {
    id: "mt-6",
    nome: "Macrotema 6 — Inclusão e equidade",
    descricao: "Práticas que ampliam o acesso de todos à aprendizagem.",
    dimensaoRelacionada: "clima",
  },
].map((m, i) => ({ ...m, ativo: true, ordem: i + 1 }));

const modalidadesSeed = [
  {
    id: "mod-sincrona",
    nome: "Síncrona",
    descricao: "Encontros ao vivo em data e horário definidos.",
    ativa: true,
    presencaAutomatica: false,
  },
  {
    id: "mod-assincrona",
    nome: "Assíncrona",
    descricao: "Percurso no próprio ritmo; a entrega registra a presença.",
    ativa: true,
    presencaAutomatica: true,
  },
];

const etapasSeed: Etapa[] = [
  {
    id: "et-1",
    nome: "Autoavaliação da prática pedagógica",
    descricao: "Reflita sobre sua prática para escolher bem o seu percurso.",
    tipo: "autoavaliacao",
    ordem: 1,
    obrigatoria: true,
    prazoDias: 14,
    segmentos: [],
    alerta: alertaPadrao,
  },
  {
    id: "et-2",
    nome: "Escolha do macrotema e da turma",
    descricao: "Escolha o tema do ciclo e garanta sua vaga.",
    tipo: "avaliacao",
    ordem: 2,
    obrigatoria: true,
    prazoDias: 21,
    segmentos: [],
    alerta: alertaPadrao,
  },
  {
    id: "et-3",
    nome: "Conteúdo base do macrotema",
    descricao: "Aulas em vídeo e texto-base do seu macrotema.",
    tipo: "conteudo",
    ordem: 3,
    obrigatoria: true,
    prazoDias: 45,
    segmentos: [],
    alerta: alertaPadrao,
  },
  {
    id: "et-4",
    nome: "Encontro formativo",
    descricao: "Encontro com a turma para aprofundar o macrotema.",
    tipo: "encontro",
    ordem: 4,
    obrigatoria: true,
    prazoDias: 60,
    segmentos: [],
    alerta: { diasParaCoordenador: 2, alertarDocente: true },
  },
  {
    id: "et-5",
    nome: "Envio do planejamento de aula",
    descricao: "Envie a tarefa, o planejamento e a data da aula a ser observada.",
    tipo: "entrega",
    ordem: 5,
    obrigatoria: true,
    prazoDias: 75,
    segmentos: [],
    alerta: alertaPadrao,
  },
  {
    id: "et-6",
    nome: "Observação de aula",
    descricao: "Sua aula é observada e você recebe um parecer.",
    tipo: "encontro",
    ordem: 6,
    obrigatoria: true,
    prazoDias: 100,
    segmentos: [],
    alerta: { diasParaCoordenador: 5, alertarDocente: false },
  },
  {
    id: "et-7",
    nome: "Portfólio de Inovação Docente",
    descricao: "Reúna o percurso do ciclo e registre suas reflexões.",
    tipo: "entrega",
    ordem: 7,
    obrigatoria: true,
    prazoDias: 130,
    segmentos: [],
    alerta: alertaPadrao,
  },
  {
    id: "et-8",
    nome: "Enquete 360°",
    descricao: "Percepções de diferentes públicos sobre a sua prática.",
    tipo: "avaliacao",
    ordem: 8,
    obrigatoria: false,
    prazoDias: 150,
    segmentos: [],
    alerta: { diasParaCoordenador: 7, alertarDocente: false },
  },
];

export const cicloConfigSeed: CicloConfig = {
  id: "ciclo-2",
  nome: "Ciclo 2",
  periodo: "2027–2030",
  aberturaISO: ABERTURA,
  cenarioSegmentacao: "trilha_unica",
  segmentos: segmentosSeed,
  macrotemas: macrotemasSeed,
  modalidades: modalidadesSeed,
  etapas: etapasSeed,
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
      ajuda: "Um compromisso concreto para o próximo macrotema.",
      ordem: 4,
    },
  ],
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
    segmentoId: "seg-fi",
    cargo: "regente",
    perfil: "coordenador",
    email: "beatriz.coelho@rede.edu.br",
  },
  {
    id: "coord-2",
    nome: "Marcelo Pires Aguiar",
    matricula: "C-1002",
    unidade: "Unidade Norte",
    segmentoId: "seg-fii",
    cargo: "regente",
    perfil: "coordenador",
    email: "marcelo.aguiar@rede.edu.br",
  },
];

const outrasPessoas: Pessoa[] = [
  {
    id: "oper-1",
    nome: "Equipe Operadora — Renata Vasques",
    matricula: "O-2001",
    unidade: "Sede",
    segmentoId: "seg-fi",
    cargo: "regente",
    perfil: "operadora",
    email: "renata.vasques@rede.edu.br",
  },
  {
    id: "dir-1",
    nome: "Sérgio Lacerda Pontes",
    matricula: "D-3001",
    unidade: "Unidade Centro",
    segmentoId: "seg-em",
    cargo: "regente",
    perfil: "diretor",
    email: "sergio.pontes@rede.edu.br",
  },
];

const docentesSeed: Pessoa[] = nomesDocentes.map((nome, i) => ({
  id: `doc-${i + 1}`,
  nome,
  matricula: `M-${4000 + i}`,
  unidade: unidades[i % unidades.length]!,
  segmentoId: segmentosSeed[i % segmentosSeed.length]!.id,
  cargo: i % 4 === 3 ? "corregente" : "regente",
  perfil: "docente",
  // Blocos de 4: cada coordenador recebe docentes em todos os estágios.
  coordenadorId: Math.floor(i / 4) % 2 === 0 ? "coord-1" : "coord-2",
  email: `${nome.split(" ")[0]!.toLowerCase()}.${i + 1}@rede.edu.br`,
}));

export const pessoasSeed: Pessoa[] = [
  ...docentesSeed,
  ...coordenadoresSeed,
  ...outrasPessoas,
];

// Duas turmas por modalidade em cada macrotema: permite trocar de turma
// mantendo a mesma modalidade.
const horariosSeed = [
  [
    { sufixo: "Turma A", periodo: "Manhã", horario: "Terças, 8h30 às 10h30" },
    { sufixo: "Turma B", periodo: "Tarde", horario: "Quintas, 14h às 16h" },
  ],
  [
    { sufixo: "Turma A", periodo: "Livre", horario: "No seu ritmo" },
    {
      sufixo: "Turma B",
      periodo: "Livre",
      horario: "No seu ritmo, com tutoria quinzenal",
    },
  ],
];

export const turmasSeed: Turma[] = macrotemasSeed.flatMap((mt, i) =>
  modalidadesSeed.flatMap((mod, j) =>
    (horariosSeed[j] ?? horariosSeed[0]!).map((h, k) => ({
      id: `turma-${i + 1}-${j + 1}-${k + 1}`,
      nome: `${mt.nome.split("—")[0]!.trim()} · ${mod.nome} · ${h.sufixo}`,
      macrotemaId: mt.id,
      modalidadeId: mod.id,
      periodo: h.periodo,
      horario: h.horario,
      vagas: k === 0 ? 20 : 12,
      // uma turma já nasce esgotada para a demonstração
      vagasOcupadas: i === 1 && j === 0 && k === 1 ? 12 : 0,
    })),
  ),
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
  // Ciclo 1 (2023–2026): macrotemas já cumpridos, usados para bloquear repetição.
  const historicoMacrotemas: HistoricoMacrotema[] = [];
  const turmas = turmasSeed.map((t) => ({ ...t }));

  const dimensoesBase = ["planejamento", "mediacao", "avaliacao", "clima"];

  docentesSeed.forEach((doc, i) => {
    // Cada docente cumpriu dois macrotemas no ciclo anterior.
    [
      { indice: (i + 2) % macrotemasSeed.length, ano: 2024 },
      { indice: (i + 5) % macrotemasSeed.length, ano: 2026 },
    ].forEach(({ indice, ano }, k) => {
      const mt = macrotemasSeed[indice]!;
      historicoMacrotemas.push({
        id: `hist-${doc.id}-${k}`,
        pessoaId: doc.id,
        macrotemaId: mt.id,
        macrotemaNome: mt.nome,
        ciclo: "Ciclo 1",
        ano,
        turmaNome: `Turma ${k === 0 ? "A" : "B"} · ${ano}`,
        modalidadeNome: k === 0 ? "Síncrona" : "Assíncrona",
        entregaTitulo: "Planejamento de aula e portfólio",
        entregaResumo:
          "Sequência didática construída a partir do macrotema, com registro da aula observada.",
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
        respostas: {},
        dimensoes: Object.fromEntries(
          dimensoesBase.map((d, k) => [d, 2 + ((i + k) % 4) * 0.7]),
        ),
        concluidaEmISO: dias(5 + (i % 4)),
      });
    }

    if (etapasConcluidas >= 2) {
      const turma = turmas[i % turmas.length]!;
      turma.vagasOcupadas += 1;
      inscricoes.push({
        id: `insc-${doc.id}`,
        pessoaId: doc.id,
        turmaId: turma.id,
        macrotemaId: turma.macrotemaId,
        criadaEmISO: dias(12 + (i % 5)),
      });
    }

    etapasSeed.forEach((etapa, idx) => {
      let status: ProgressoEtapa["status"] = "nao_iniciada";
      if (idx < etapasConcluidas) status = "concluida";
      else if (idx === etapasConcluidas)
        status = estagio === 2 ? "atrasada" : "em_andamento";

      const presencaAuto =
        etapa.tipo === "conteudo" && status === "concluida"
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
          "Planejamento da sequência didática desenvolvida a partir do macrotema do ciclo.",
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
        destino: doc.cargo === "corregente" ? "equipe_central" : "coordenador",
        status:
          etapasConcluidas >= 6 && !entregaAguardando
            ? "devolutiva_disponivel"
            : "em_analise",
      });

      if (etapasConcluidas >= 6 && !entregaAguardando) {
        devolutivas.push({
          id: `dev-${doc.id}`,
          entregaId,
          pessoaId: doc.id,
          autorId: doc.coordenadorId ?? "coord-1",
          texto:
            "Planejamento coerente com o macrotema. Sugiro ampliar as estratégias de mediação na etapa de fechamento.",
          parecer: "Atende",
          criadaEmISO: dias(88 + (i % 5)),
          cienciaEmISO: i % 3 === 0 ? dias(90 + (i % 5)) : undefined,
        });

        observacoes.push({
          id: `obs-${doc.id}`,
          pessoaId: doc.id,
          coordenadorId: doc.coordenadorId ?? "coord-1",
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
    historicoMacrotemas,
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
          respondenteTipoId: publico.id,
          respondenteNome:
            publico.id === "resp-docente"
              ? doc.nome
              : `${publico.nome} ${n + 1}`,
          escalas,
          textos,
          enviadaEmISO: dias(120 + ((i + p) % 8)),
        });
      }
    });
  });

  return respostas;
}

export function criarEstadoInicial(): EstadoApp {
  const derivado = construirProgresso();
  return {
    versao: VERSAO_ESTADO,
    perfilAtivo: "docente-regente",
    pessoaAtivaId: "doc-1",
    cicloConfig: cicloConfigSeed,
    pessoas: pessoasSeed,
    turmas: derivado.turmas,
    inscricoes: derivado.inscricoes,
    progressoEtapas: derivado.progressoEtapas,
    progressoAulas: [],
    progressoLeituras: [],
    entregas: derivado.entregas,
    devolutivas: derivado.devolutivas,
    observacoes: derivado.observacoes,
    notificacoes: derivado.notificacoes,
    autoavaliacoes: derivado.autoavaliacoes,
    historicoMacrotemas: derivado.historicoMacrotemas,
    portfolios: [],
    arquivosConteudo: [],
    respostasEnquete: construirRespostasEnquete(),
  };
}

