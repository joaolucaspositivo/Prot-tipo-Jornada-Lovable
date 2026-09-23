import { Plus, Trash2 } from "lucide-react";

import { useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { novoId } from "@/lib/ciclo";

/** Perguntas e públicos da Enquete 360°, editáveis em runtime. */
export function AbaEnqueteConfig() {
  const { config, salvarConfig } = useCicloConfig();
  const enquete = config.enquete;
  const perguntas = [...enquete.perguntas].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">Enquete 360°</h3>
          <p className="text-sm text-muted-foreground">
            As perguntas ainda não estão fechadas: o que estiver aqui é o que
            cada público vai responder.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-2"
          onClick={() =>
            salvarConfig((c) => ({
              ...c,
              enquete: {
                ...c.enquete,
                perguntas: [
                  ...c.enquete.perguntas,
                  {
                    id: novoId("pg"),
                    texto: "Nova pergunta",
                    tipo: "escala" as const,
                    ordem: c.enquete.perguntas.length + 1,
                    respondentes: [],
                  },
                ],
              },
            }))
          }
        >
          <Plus className="size-4" aria-hidden />
          Adicionar pergunta
        </Button>
      </div>

      <ul className="space-y-3">
        {perguntas.map((pg, i) => (
          <li
            key={pg.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                {i + 1}
              </span>
              <Input
                value={pg.texto}
                aria-label="Texto da pergunta"
                onChange={(e) =>
                  salvarConfig((c) => ({
                    ...c,
                    enquete: {
                      ...c.enquete,
                      perguntas: c.enquete.perguntas.map((x) =>
                        x.id === pg.id ? { ...x, texto: e.target.value } : x,
                      ),
                    },
                  }))
                }
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label="Remover pergunta"
                onClick={() =>
                  salvarConfig((c) => ({
                    ...c,
                    enquete: {
                      ...c.enquete,
                      perguntas: c.enquete.perguntas.filter(
                        (x) => x.id !== pg.id,
                      ),
                    },
                  }))
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id={`tipo-${pg.id}`}
                  checked={pg.tipo === "escala"}
                  onCheckedChange={(v) =>
                    salvarConfig((c) => ({
                      ...c,
                      enquete: {
                        ...c.enquete,
                        perguntas: c.enquete.perguntas.map((x) =>
                          x.id === pg.id
                            ? { ...x, tipo: v ? "escala" : "texto" }
                            : x,
                        ),
                      },
                    }))
                  }
                />
                <Label htmlFor={`tipo-${pg.id}`}>
                  {pg.tipo === "escala" ? "Escala de 1 a 5" : "Resposta aberta"}
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Públicos que respondem (sem nenhum marcado, todos respondem)
              </p>
              <div className="flex flex-wrap gap-2">
                {enquete.respondentes.map((pub) => {
                  const marcado = pg.respondentes.includes(pub.id);
                  return (
                    <button
                      key={pub.id}
                      type="button"
                      aria-pressed={marcado}
                      onClick={() =>
                        salvarConfig((c) => ({
                          ...c,
                          enquete: {
                            ...c.enquete,
                            perguntas: c.enquete.perguntas.map((x) =>
                              x.id === pg.id
                                ? {
                                    ...x,
                                    respondentes: marcado
                                      ? x.respondentes.filter(
                                          (r) => r !== pub.id,
                                        )
                                      : [...x.respondentes, pub.id],
                                  }
                                : x,
                            ),
                          },
                        }))
                      }
                    >
                      <Badge variant={marcado ? "default" : "outline"}>
                        {pub.nome}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
