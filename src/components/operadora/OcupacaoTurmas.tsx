import { AlertTriangle, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/data/store";
import { ocupacaoDasTurmas } from "@/lib/gestao";

export function OcupacaoTurmas() {
  const { estado } = useStore();
  const turmas = ocupacaoDasTurmas(estado);
  const esgotadas = turmas.filter((t) => t.alerta === "esgotada");
  const vazias = turmas.filter((t) => t.alerta === "vazia");

  return (
    <div className="space-y-4">
      {(esgotadas.length > 0 || vazias.length > 0) && (
        <Card className="border-atraso/40 bg-atraso-suave">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <AlertTriangle className="size-5 text-atraso" aria-hidden />
            <p className="text-sm">
              {esgotadas.length} turma(s) esgotada(s) e {vazias.length} sem
              nenhuma inscrição.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Users className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">
            Ocupação das turmas ({turmas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {turmas.map((t) => (
              <li
                key={t.turma.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{t.turma.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.macrotemaNome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.modalidadeNome} · {t.turma.periodo} ·{" "}
                      {t.turma.horario}
                    </p>
                  </div>
                  {t.alerta === "esgotada" && (
                    <Badge variant="destructive">Esgotada</Badge>
                  )}
                  {t.alerta === "vazia" && (
                    <Badge variant="outline">Sem inscritos</Badge>
                  )}
                </div>
                <Progress value={t.percentual} className="mt-3 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.turma.vagasOcupadas} de {t.turma.vagas} vagas ocupadas ·{" "}
                  {t.livres} livre(s)
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
