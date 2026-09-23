import { Plus, Trash2 } from "lucide-react";

import { useCicloConfig } from "./comum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { novoId } from "@/lib/ciclo";

/** Campos de reflexão do Portfólio de Inovação Docente, editáveis em runtime. */
export function AbaPortfolioConfig() {
  const { config, salvarConfig } = useCicloConfig();
  const reflexoes = [...config.reflexoesPortfolio].sort(
    (a, b) => a.ordem - b.ordem,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">Campos do portfólio</h3>
          <p className="text-sm text-muted-foreground">
            O docente responde exatamente estes campos ao montar o portfólio.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-2"
          onClick={() =>
            salvarConfig((c) => ({
              ...c,
              reflexoesPortfolio: [
                ...c.reflexoesPortfolio,
                {
                  id: novoId("rf"),
                  pergunta: "Nova pergunta de reflexão",
                  ajuda: "",
                  ordem: c.reflexoesPortfolio.length + 1,
                },
              ],
            }))
          }
        >
          <Plus className="size-4" aria-hidden />
          Adicionar campo
        </Button>
      </div>

      <ul className="space-y-3">
        {reflexoes.map((r, i) => (
          <li
            key={r.id}
            className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                {i + 1}
              </span>
              <Label htmlFor={`rf-${r.id}`} className="sr-only">
                Pergunta
              </Label>
              <Input
                id={`rf-${r.id}`}
                value={r.pergunta}
                onChange={(e) =>
                  salvarConfig((c) => ({
                    ...c,
                    reflexoesPortfolio: c.reflexoesPortfolio.map((x) =>
                      x.id === r.id ? { ...x, pergunta: e.target.value } : x,
                    ),
                  }))
                }
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label="Remover campo"
                onClick={() =>
                  salvarConfig((c) => ({
                    ...c,
                    reflexoesPortfolio: c.reflexoesPortfolio.filter(
                      (x) => x.id !== r.id,
                    ),
                  }))
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
            <Input
              value={r.ajuda}
              placeholder="Texto de apoio exibido ao docente"
              onChange={(e) =>
                salvarConfig((c) => ({
                  ...c,
                  reflexoesPortfolio: c.reflexoesPortfolio.map((x) =>
                    x.id === r.id ? { ...x, ajuda: e.target.value } : x,
                  ),
                }))
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
