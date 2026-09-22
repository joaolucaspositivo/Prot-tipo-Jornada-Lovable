import { useState } from "react";
import { CalendarCheck, Users } from "lucide-react";

import { PainelEquipe } from "@/components/coordenador/PainelEquipe";
import { PainelLancamentoPresenca } from "@/components/operadora/OcupacaoTurmas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useStore } from "@/data/store";
import { ocupacaoDasTurmas } from "@/lib/gestao";

/**
 * Área do moderador de turma (D33): acesso restrito às turmas em
 * `pessoaAtiva.turmaIds` — lança presença e valida entrega/devolutiva dos
 * docentes dessas turmas, sem acesso à configuração de turma ou do ciclo.
 */
export function PainelModeracao() {
  const { estado, pessoaAtiva } = useStore();
  const turmaIds = new Set(pessoaAtiva.turmaIds ?? []);
  const turmas = ocupacaoDasTurmas(estado).filter((t) =>
    turmaIds.has(t.turma.id),
  );
  const [turmaAbertaId, setTurmaAbertaId] = useState<string | null>(null);
  const turmaAberta = turmas.find((t) => t.turma.id === turmaAbertaId)?.turma;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Moderador de turma
        </p>
        <h1 className="text-2xl font-semibold md:text-3xl">Minhas turmas</h1>
        <p className="text-muted-foreground">
          Lançamento de presença nas turmas às quais você foi vinculado.
        </p>
      </header>

      {turmas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhuma turma vinculada a este moderador no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {turmas.map((t) => {
            const sincrona = t.modalidade?.presencaAutomatica === false;
            return (
              <Card key={t.turma.id}>
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{t.turma.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t.temaNome}
                    </p>
                  </div>
                  <Badge variant="secondary">{t.modalidadeNome}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {t.turma.horario || "Sem horário definido"}
                  </p>
                  <Progress value={t.percentual} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {t.turma.vagasOcupadas} de {t.turma.vagas} vagas ocupadas
                  </p>
                  {sincrona ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTurmaAbertaId(t.turma.id)}
                    >
                      <CalendarCheck className="size-4" /> Lançar presença
                    </Button>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" aria-hidden />
                      Modalidade assíncrona — presença automática pelo envio da
                      tarefa.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={Boolean(turmaAberta)}
        onOpenChange={(v) => !v && setTurmaAbertaId(null)}
      >
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
          {turmaAberta && (
            <PainelLancamentoPresenca
              key={turmaAberta.id}
              turma={turmaAberta}
            />
          )}
        </SheetContent>
      </Sheet>

      <header className="space-y-1 pt-2">
        <h2 className="text-xl font-semibold">Entregas para validar</h2>
        <p className="text-muted-foreground">
          Docentes das suas turmas — valide a entrega e registre a devolutiva.
        </p>
      </header>
      <PainelEquipe escopo="moderador" />
    </div>
  );
}
