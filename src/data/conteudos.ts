// Conteúdo mock das etapas de tipo `conteudo`.
// Os vídeos simulam arquivos hospedados no Drive institucional: nada aqui
// exige login, download ou link colado à mão.

export interface AulaConteudo {
  id: string;
  titulo: string;
  resumo: string;
  duracaoMin: number;
  /** identificação do arquivo no Drive institucional (simulada) */
  arquivoDrive: string;
}

export interface TextoBase {
  titulo: string;
  autoria: string;
  tempoLeituraMin: number;
  paragrafos: string[];
}

export interface MaterialConteudo {
  aulas: AulaConteudo[];
  texto: TextoBase;
}

const textoPadrao: TextoBase = {
  titulo: "Texto-base do macrotema",
  autoria: "Equipe de Desenvolvimento Pedagógico",
  tempoLeituraMin: 9,
  paragrafos: [
    "A jornada de desenvolvimento parte de uma ideia simples: a prática pedagógica melhora quando o professor tem tempo protegido para olhar para ela com intenção. Este texto acompanha as aulas em vídeo desta etapa e serve de apoio para a tarefa que você vai enviar no final.",
    "O primeiro movimento é de leitura da própria sala. Antes de mudar qualquer estratégia, vale descrever o que já acontece: como a aula começa, quanto tempo a turma leva para entrar na proposta, quais alunos participam e quais ficam à margem. Essa descrição, feita sem julgamento, é o material bruto do seu planejamento.",
    "O segundo movimento é de escolha. Nenhuma prática precisa ser reinventada por inteiro. Escolher um ponto pequeno e concreto — a abertura da aula, a forma de dar um retorno, o modo de organizar duplas — costuma produzir mais efeito do que uma reforma ampla que não se sustenta na rotina.",
    "O terceiro movimento é de registro. Aquilo que não é registrado se perde entre uma semana e outra. O registro pode ser curto: o que foi tentado, o que aconteceu, o que você faria diferente. Ele será a base da sua tarefa desta etapa e, mais adiante, do seu portfólio.",
    "Ao longo do ciclo, o encontro formativo e a observação de aula funcionam como espelhos externos. Eles não existem para avaliar você, e sim para devolver o que, de dentro da sala, é difícil enxergar. Chegar a esses momentos com um registro já feito muda completamente a qualidade da conversa.",
    "Encerre a leitura escolhendo uma única prática para experimentar nas próximas duas semanas. Anote a escolha: ela é o começo da tarefa que fecha esta etapa e que também registra a sua presença, quando a sua turma for da modalidade assíncrona.",
  ],
};

const aulasPadrao: AulaConteudo[] = [
  {
    id: "aula-1",
    titulo: "Abertura: por que este macrotema",
    resumo:
      "Apresentação do macrotema, do que se espera do ciclo e de como as etapas se conectam.",
    duracaoMin: 8,
    arquivoDrive: "drive-institucional/abertura-macrotema.mp4",
  },
  {
    id: "aula-2",
    titulo: "Fundamentos da prática",
    resumo:
      "Os conceitos centrais do macrotema, com exemplos de sala de aula da própria rede.",
    duracaoMin: 17,
    arquivoDrive: "drive-institucional/fundamentos-da-pratica.mp4",
  },
  {
    id: "aula-3",
    titulo: "Estudo de caso comentado",
    resumo: "Uma aula real analisada passo a passo, com pausas para reflexão.",
    duracaoMin: 21,
    arquivoDrive: "drive-institucional/estudo-de-caso.mp4",
  },
  {
    id: "aula-4",
    titulo: "Do vídeo para a sua sala",
    resumo:
      "Como transformar o que você viu em uma escolha concreta de planejamento.",
    duracaoMin: 12,
    arquivoDrive: "drive-institucional/do-video-para-a-sala.mp4",
  },
];

/**
 * Material da etapa de conteúdo. O tema apenas personaliza os títulos:
 * a estrutura vale para qualquer configuração de trilha.
 */
export function materialDaEtapa(temaNome?: string): MaterialConteudo {
  const tema = temaNome?.split("—").pop()?.trim();
  return {
    aulas: aulasPadrao.map((a) => ({
      ...a,
      titulo: tema && a.id === "aula-2" ? `Fundamentos: ${tema}` : a.titulo,
    })),
    texto: {
      ...textoPadrao,
      titulo: tema ? `Texto-base — ${tema}` : textoPadrao.titulo,
    },
  };
}
