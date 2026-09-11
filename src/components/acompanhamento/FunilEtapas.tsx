import { useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { EstadoBadge } from "@/components/EstadoBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";
import type { EstadoApp } from "@/data/types";
import { ROTULO_TIPO_ETAPA, novoId } from "@/lib/ciclo";
import type { LinhaEquipe } from "@/lib/equipe";
import { funilDeEtapas } from "@/lib/gestao";
import type { ItemTrilha } from "@/lib/jornada";

interface FunilEtapasProps {
  estado: EstadoApp;
  linhas: LinhaEquipe[];
}

interface DocenteNaEtapa {
  linha: LinhaEquipe;
  item: ItemTrilha;
}

/**
 * Funil de etapas compartilhado por operadora, coordenador e diretor (RF32):
 * mesma barra por etapa, agora com detalhamento clicável e "avisar todos".
 * Um só componente para os três perfis — não crie uma versão por perfil.
 */
export function FunilEtapas({ estado, linhas }: FunilEtapasProps) {
  const { pessoaAtiva, atualizar } = useStore();
  const funil = funilDeEtapas(estado, linhas);
  const [expandida, setExpandida] = useState<string | null>(null);

  function avisarTodos(etapaNome: string, alvos: LinhaEquipe[]) {
    if (alvos.length === 0) return;
    const agora = new Date().toISOString();
    atualizar((anterior) => ({
      ...anterior,
      notificacoes: [
        ...alvos.map((l) => ({
          id: novoId("not"),
          pessoaId: l.pessoa.id,
          titulo: `Lembrete da etapa "${etapaNome}"`,
          descricao: `${pessoaAtiva.nome} sinalizou: você está na etapa "${etapaNome}" e ainda não a concluiu.`,
          criadaEmISO: agora,
          lida: false,
          tipo: "pendencia" as const,
        })),
        ...anterior.notificacoes,
      ],
    }));
    toast.success(
      alvos.length === 1
        ? `Aviso enviado a ${alvos[0]!.pessoa.nome}.`
        : `Aviso enviado a ${alvos.length} docentes.`,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funil das etapas do ciclo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {funil.map((p) => {
          const aberta = expandida === p.etapa.id;
          const docentesNaEtapa: DocenteNaEtapa[] = [];
          linhas.forEach((l) => {
            const item = l.trilha.find((i) => i.etapa.id === p.etapa.id);
            if (item) docentesNaEtapa.push({ linha: l, item });
          });
          const naoConcluidos = docentesNaEtapa.filter(
            (d) => d.item.status !== "concluida",
          );

          return (
            <div key={p.etapa.id}>
              <button
                type="button"
                onClick={() => setExpandida(aberta ? null : p.etapa.id)}
                className="w-full rounded-lg text-left"
                aria-expanded={aberta}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {p.etapa.nome}{" "}
                    <Badge variant="secondary" className="ml-1">
                      {ROTULO_TIPO_ETAPA[p.etapa.tipo]}
                    </Badge>
                  </span>

                  <p className="text-sm text-muted-foreground">
                    {p.concluidas} concluíram · {p.emAndamento} em andamento ·{" "}
                    {p.naoIniciadas} não começaram
                  </p>
                </div>
                <div
                  className="mt-1 h-3 w-full overflow-hidden rounded-full bg-secondary"
                  role="img"
                  aria-label={`${p.etapa.nome}: ${p.percentual}% concluído`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${p.percentual}%` }}
                  />
                </div>
              </button>

              {aberta && (
                <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-3">
                  {naoConcluidos.length > 0 && (
                    <div className="mb-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          avisarTodos(
                            p.etapa.nome,
                            naoConcluidos.map((d) => d.linha),
                          )
                        }
                      >
                        <BellRing className="size-4" aria-hidden />
                        Avisar todos
                      </Button>
                    </div>
                  )}
                  {docentesNaEtapa.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum docente nesta etapa.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {docentesNaEtapa.map(({ linha, item }) => (
                        <li
                          key={linha.pessoa.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {linha.pessoa.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {linha.pessoa.unidade}
                            </p>
                          </div>
                          <EstadoBadge status={item.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
