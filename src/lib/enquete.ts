// Enquete 360°: perguntas, públicos e agregação.
// Nada de pergunta fixa no código — tudo vem de `cicloConfig.enquete`.

import type {
  EstadoApp,
  Etapa,
  PerguntaEnquete,
  RespostaEnquete,
  TipoRespondente,
} from "@/data/types";
import { cicloConfigAtivo, etapasEmOrdem } from "@/lib/ciclo";

export function etapaDeEnquete(estado: EstadoApp): Etapa | undefined {
  return etapasEmOrdem(cicloConfigAtivo(estado)).find(
    (e) => e.tela === "enquete",
  );
}

export function publicosDaEnquete(estado: EstadoApp): TipoRespondente[] {
  return cicloConfigAtivo(estado).enquete.respondentes;
}

/** Perguntas visíveis para um público, na ordem configurada. */
export function perguntasDoPublico(
  estado: EstadoApp,
  respondenteTipoId: string,
): PerguntaEnquete[] {
  return [...cicloConfigAtivo(estado).enquete.perguntas]
    .filter(
      (p) =>
        p.respondentes.length === 0 ||
        p.respondentes.includes(respondenteTipoId),
    )
    .sort((a, b) => a.ordem - b.ordem);
}

export function respostasDoDocente(
  estado: EstadoApp,
  docenteId: string,
): RespostaEnquete[] {
  return estado.respostasEnquete.filter((r) => r.docenteId === docenteId);
}

export interface MediaPorPublico {
  publico: TipoRespondente;
  media: number;
  respostas: number;
}

export interface ResumoPergunta {
  pergunta: PerguntaEnquete;
  mediaGeral: number;
  respostas: number;
  porPublico: MediaPorPublico[];
  comentarios: string[];
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return (
    Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 10) / 10
  );
}

/** Resumo agregado, opcionalmente restrito a um docente. */
export function resumoDaEnquete(
  estado: EstadoApp,
  docenteId?: string,
): ResumoPergunta[] {
  const base = docenteId
    ? estado.respostasEnquete.filter((r) => r.docenteId === docenteId)
    : estado.respostasEnquete;
  const publicos = publicosDaEnquete(estado);

  return [...cicloConfigAtivo(estado).enquete.perguntas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((pergunta) => {
      const notas = base
        .map((r) => r.escalas[pergunta.id])
        .filter((v): v is number => typeof v === "number");
      const comentarios = base
        .map((r) => r.textos[pergunta.id])
        .filter((t): t is string => Boolean(t && t.trim()));

      return {
        pergunta,
        mediaGeral: media(notas),
        respostas:
          pergunta.tipo === "escala" ? notas.length : comentarios.length,
        porPublico: publicos
          .map((publico) => {
            const doPublico = base
              .filter((r) => r.respondenteTipoId === publico.id)
              .map((r) => r.escalas[pergunta.id])
              .filter((v): v is number => typeof v === "number");
            return {
              publico,
              media: media(doPublico),
              respostas: doPublico.length,
            };
          })
          .filter((m) => m.respostas > 0),
        comentarios,
      };
    });
}

export interface ParticipacaoPublico {
  publico: TipoRespondente;
  respostas: number;
  docentes: number;
}

export function participacaoPorPublico(
  estado: EstadoApp,
): ParticipacaoPublico[] {
  return publicosDaEnquete(estado).map((publico) => {
    const respostas = estado.respostasEnquete.filter(
      (r) => r.respondenteTipoId === publico.id,
    );
    return {
      publico,
      respostas: respostas.length,
      docentes: new Set(respostas.map((r) => r.docenteId)).size,
    };
  });
}
