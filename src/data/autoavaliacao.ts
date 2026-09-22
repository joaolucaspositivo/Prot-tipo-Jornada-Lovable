// Cálculos sobre as respostas da autoavaliação. As dimensões e afirmações em
// si vêm de `estado.cicloConfig.dimensoesAutoavaliacao` (v3) — antes eram
// hardcoded aqui, o que violava a regra de ouro; a escala de resposta
// continua fixa, por não ter sido pedida como configurável.

import type { DimensaoAutoavaliacao } from "./types";

export const ESCALA = [
  { valor: 1, rotulo: "Ainda não faço" },
  { valor: 2, rotulo: "Faço raramente" },
  { valor: 3, rotulo: "Faço às vezes" },
  { valor: 4, rotulo: "Faço com frequência" },
  { valor: 5, rotulo: "Faço com segurança" },
];

export function totalAfirmacoes(dimensoes: DimensaoAutoavaliacao[]): number {
  return dimensoes.reduce((total, d) => total + d.afirmacoes.length, 0);
}

/** Média de 1 a 5 por dimensão a partir das respostas. */
export function calcularDimensoes(
  respostas: Record<string, number>,
  dimensoes: DimensaoAutoavaliacao[],
): Record<string, number> {
  const resultado: Record<string, number> = {};
  for (const dim of dimensoes) {
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
  dimensoesRespondidas: Record<string, number>,
  dimensoes: DimensaoAutoavaliacao[],
): DimensaoAutoavaliacao | null {
  const conhecidas = dimensoes.filter(
    (d) => typeof dimensoesRespondidas[d.id] === "number",
  );
  if (!conhecidas.length) return null;
  return conhecidas.reduce((menor, atual) =>
    (dimensoesRespondidas[atual.id] ?? 5) <
    (dimensoesRespondidas[menor.id] ?? 5)
      ? atual
      : menor,
  );
}
