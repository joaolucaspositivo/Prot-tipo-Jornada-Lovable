import { Plus, Trash2 } from "lucide-react";

import { useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { novoId } from "@/lib/ciclo";

/** Campos do portfólio e perguntas da Enquete 360°, editáveis em runtime. */
export function AbaEncerramento() {
  const { config, salvarConfig } = useCicloConfig();
  const reflexoes = [...config.reflexoesPortfolio].sort(
    (a, b) => a.ordem - b.ordem,
  );
  const enquete = config.enquete;
  const perguntas = [...enquete.perguntas].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
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
      </section>

      <section className="space-y-3">
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
                    {pg.tipo === "escala"
                      ? "Escala de 1 a 5"
                      : "Resposta aberta"}
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
      </section>
    </div>
  );
}
