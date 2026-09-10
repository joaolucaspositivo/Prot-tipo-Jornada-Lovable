import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";
import { novoId } from "@/lib/ciclo";
import { linhasDaEquipe } from "@/lib/equipe";
import { conferencias, type Conferencia } from "@/lib/gestao";

/**
 * Reproduz, em listas acionáveis, as conferências hoje feitas cruzando
 * planilhas. Cada item aponta uma pessoa e uma ação, nunca só um número.
 */
export function PainelConferencias() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const listas = useMemo(
    () => conferencias(estado, linhasDaEquipe(estado)),
    [estado],
  );
  const [aberta, setAberta] = useState<string | null>(listas[0]?.id ?? null);

  function cobrar(conf: Conferencia) {
    if (conf.itens.length === 0) return;
    const agora = new Date().toISOString();
    atualizar((anterior) => ({
      ...anterior,
      notificacoes: [
        ...conf.itens.map((i) => ({
          id: novoId("not"),
          pessoaId: i.pessoa.id,
          titulo: `Pendência do ciclo: ${conf.titulo.toLowerCase()}`,
          descricao: `${pessoaAtiva.nome}, da equipe operadora, sinalizou: ${i.detalhe}.`,
          criadaEmISO: agora,
          lida: false,
          tipo: "pendencia" as const,
        })),
        ...anterior.notificacoes,
      ],
    }));
    toast.success(`Aviso enviado a ${conf.itens.length} pessoa(s).`);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        As mesmas verificações que hoje exigem cruzar planilhas, prontas e
        acionáveis.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {listas.map((conf) => (
          <button
            key={conf.id}
            type="button"
            onClick={() => setAberta(conf.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              aberta === conf.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-secondary"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {conf.titulo}
            </p>
            <p
              className={
                conf.itens.length > 0 ? "text-2xl text-atraso" : "text-2xl"
              }
            >
              {conf.itens.length}
            </p>
          </button>
        ))}
      </div>

      {listas
        .filter((c) => c.id === aberta)
        .map((conf) => (
          <Card key={conf.id}>
            <CardHeader className="flex-row flex-wrap items-center gap-3 space-y-0">
              <ListChecks className="size-5 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{conf.titulo}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {conf.explicacao}
                </p>
              </div>
              {conf.itens.length > 0 && (
                <Button size="sm" onClick={() => cobrar(conf)}>
                  <BellRing className="size-4" aria-hidden />
                  Avisar todos
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {conf.itens.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-sucesso">
                  <CheckCircle2 className="size-4" aria-hidden />
                  Nada pendente nesta conferência.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {conf.itens.map((item, i) => (
                    <li
                      key={`${item.pessoa.id}-${i}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {item.pessoa.nome}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.detalhe}
                        </p>
                      </div>
                      <Badge variant="outline">{item.pessoa.unidade}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
