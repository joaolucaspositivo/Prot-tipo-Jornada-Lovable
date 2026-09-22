import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ESCALA, totalAfirmacoes } from "@/data/autoavaliacao";
import type { DimensaoAutoavaliacao } from "@/data/types";
import { cn } from "@/lib/utils";

export function FormularioAutoavaliacao({
  respostas,
  dimensoes,
  aoResponder,
  aoConcluir,
}: {
  respostas: Record<string, number>;
  dimensoes: DimensaoAutoavaliacao[];
  aoResponder: (afirmacaoId: string, valor: number) => void;
  aoConcluir: () => void;
}) {
  const [passo, setPasso] = useState(0);
  const dimensao = dimensoes[passo]!;
  const total = dimensoes.length;
  const totalAfirm = useMemo(() => totalAfirmacoes(dimensoes), [dimensoes]);

  const respondidas = useMemo(() => Object.keys(respostas).length, [respostas]);
  const faltaNoPasso = dimensao.afirmacoes.some(
    (a) => typeof respostas[a.id] !== "number",
  );
  const ultimo = passo === total - 1;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Dimensão {passo + 1} de {total}: {dimensao.nome}
          </span>
          <span>
            {respondidas} de {totalAfirm} afirmações respondidas
          </span>
        </div>
        <Progress value={(respondidas / totalAfirm) * 100} />
        <p className="flex items-center gap-1.5 text-xs text-sucesso">
          <Save className="size-3.5" aria-hidden />
          Rascunho salvo automaticamente — você pode sair e voltar depois.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{dimensao.nome}</CardTitle>
          <p className="text-muted-foreground">{dimensao.resumo}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {dimensao.afirmacoes.map((afirmacao, i) => (
            <fieldset key={afirmacao.id} className="space-y-3">
              <legend className="text-base font-medium">
                {i + 1}. {afirmacao.texto}
              </legend>
              <div className="grid gap-2 sm:grid-cols-5">
                {ESCALA.map((opcao) => {
                  const marcada = respostas[afirmacao.id] === opcao.valor;
                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      aria-pressed={marcada}
                      onClick={() => aoResponder(afirmacao.id, opcao.valor)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-3 text-center text-xs transition-colors",
                        marcada
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/50 hover:bg-accent/40",
                      )}
                    >
                      <span className="font-display text-lg font-semibold">
                        {opcao.valor}
                      </span>
                      {opcao.rotulo}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setPasso((p) => Math.max(0, p - 1))}
          disabled={passo === 0}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Dimensão anterior
        </Button>

        {ultimo ? (
          <Button size="lg" onClick={aoConcluir} disabled={faltaNoPasso}>
            <Check className="size-4" aria-hidden />
            Concluir autoavaliação
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => setPasso((p) => Math.min(total - 1, p + 1))}
            disabled={faltaNoPasso}
          >
            Próxima dimensão
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      {faltaNoPasso && (
        <p className="text-sm text-muted-foreground">
          Responda todas as afirmações desta dimensão para seguir.
        </p>
      )}
    </div>
  );
}
