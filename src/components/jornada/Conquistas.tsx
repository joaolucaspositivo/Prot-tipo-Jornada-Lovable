import { Award, Lock } from "lucide-react";

import type { ConquistaTrilha } from "@/lib/jornada";
import { cn } from "@/lib/utils";

/** Insígnias do ciclo: acendem quando a etapa configurada é concluída. */
export function Conquistas({ itens }: { itens: ConquistaTrilha[] }) {
  if (itens.length === 0) return null;
  const acesas = itens.filter((i) => i.conquistada).length;

  return (
    <section
      aria-labelledby="titulo-conquistas"
      className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-conquistas" className="text-base">
          Conquistas do ciclo
        </h2>
        <span className="text-sm text-muted-foreground">
          {acesas} de {itens.length} conquistadas
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {itens.map(({ conquista, etapa, conquistada }) => (
          <li
            key={conquista.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
              conquistada
                ? "border-conquista/40 bg-conquista-suave"
                : "border-dashed border-border bg-muted/40",
            )}
          >
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-full",
                conquistada
                  ? "bg-conquista text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {conquistada ? (
                <Award className="size-5" aria-hidden />
              ) : (
                <Lock className="size-5" aria-hidden />
              )}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                conquistada ? "text-conquista" : "text-muted-foreground",
              )}
            >
              {conquista.nome}
            </span>
            <span className="text-xs text-muted-foreground">
              {conquistada
                ? conquista.descricao
                : `Acende ao concluir "${etapa?.nome ?? conquista.descricao}"`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
