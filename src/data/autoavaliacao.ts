// Banco de afirmações da autoavaliação (conteúdo de demonstração).
// A etapa em si vem da configuração do ciclo (tipo `autoavaliacao`);
// aqui ficam apenas as dimensões e afirmações usadas no formulário.

export interface DimensaoAutoavaliacao {
  id: string;
  nome: string;
  resumo: string;
  afirmacoes: { id: string; texto: string }[];
}

export const DIMENSOES_AUTOAVALIACAO: DimensaoAutoavaliacao[] = [
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
        texto: "Dou devolutivas que ajudam o estudante a saber o próximo passo.",
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

export const ESCALA = [
  { valor: 1, rotulo: "Ainda não faço" },
  { valor: 2, rotulo: "Faço raramente" },
  { valor: 3, rotulo: "Faço às vezes" },
  { valor: 4, rotulo: "Faço com frequência" },
  { valor: 5, rotulo: "Faço com segurança" },
];

export const TOTAL_AFIRMACOES = DIMENSOES_AUTOAVALIACAO.reduce(
  (total, d) => total + d.afirmacoes.length,
  0,
);

/** Média de 1 a 5 por dimensão a partir das respostas. */
export function calcularDimensoes(
  respostas: Record<string, number>,
): Record<string, number> {
  const resultado: Record<string, number> = {};
  for (const dim of DIMENSOES_AUTOAVALIACAO) {
    const valores = dim.afirmacoes
      .map((a) => respostas[a.id])
      .filter((v): v is number => typeof v === "number");
    resultado[dim.id] = valores.length
      ? valores.reduce((s, v) => s + v, 0) / valores.length
      : 0;
  }
  return resultado;
}

export function dimensaoMaisFragil(
  dimensoes: Record<string, number>,
): DimensaoAutoavaliacao | null {
  const conhecidas = DIMENSOES_AUTOAVALIACAO.filter(
    (d) => typeof dimensoes[d.id] === "number",
  );
  if (!conhecidas.length) return null;
  return conhecidas.reduce((menor, atual) =>
    (dimensoes[atual.id] ?? 5) < (dimensoes[menor.id] ?? 5) ? atual : menor,
  );
}
