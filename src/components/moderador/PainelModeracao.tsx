import { useState } from "react";
import { CalendarCheck, ClipboardCheck, Users } from "lucide-react";

import { ConteudoLancamentoPresenca } from "@/components/operadora/OcupacaoTurmas";
import { TabelaValidacaoEntregas } from "@/components/moderador/TabelaValidacaoEntregas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/data/store";
import { encontrosDaTurma } from "@/lib/ciclo";
import { ocupacaoDasTurmas, type OcupacaoTurma } from "@/lib/gestao";
import { cn } from "@/lib/utils";

type Modo = "presenca" | "entregas";

/**
 * Área do moderador de turma (D33/D49/D50): acesso restrito às turmas em
 * `pessoaAtiva.turmaIds` — lança presença e valida entrega/devolutiva dos
 * docentes dessas turmas, sem acesso à configuração de turma, do ciclo,
 * nem à trilha completa do docente (autoavaliação e escolha de tema ficam
 * de fora em qualquer caminho desta tela).
 *
 * As turmas fazem as vezes de filtro (D48-adjacent, aqui por D50): clicar
 * numa entra nela. Abaixo, "Lançar presença" e "Validar entregas" são
 * botões de mesmo nível que trocam só o conteúdo da tabela central — nunca
 * um Sheet lateral, nunca uma navegação de página.
 */
export function PainelModeracao() {
  const { estado, pessoaAtiva } = useStore();
  const turmaIds = new Set(pessoaAtiva.turmaIds ?? []);
  const turmas = ocupacaoDasTurmas(estado).filter((t) =>
    turmaIds.has(t.turma.id),
  );

  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<string | null>(
    turmas[0]?.turma.id ?? null,
  );
  const selecionada = turmas.find((t) => t.turma.id === turmaSelecionadaId);
  const sincrona = selecionada?.modalidade?.preveEncontroAoVivo === true;

  const [modo, setModo] = useState<Modo>("entregas");

  function selecionarTurma(t: OcupacaoTurma) {
    setTurmaSelecionadaId(t.turma.id);
    setModo(
      t.modalidade?.preveEncontroAoVivo === true ? "presenca" : "entregas",
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Moderador de turma
        </p>
        <h1 className="text-2xl font-semibold md:text-3xl">Minhas turmas</h1>
        <p className="text-muted-foreground">
          Lançamento de presença e validação de entregas nas turmas às quais
          você foi vinculado.
        </p>
      </header>

      {turmas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhuma turma vinculada a este moderador no momento.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {turmas.map((t) => {
              const ehSincrona = t.modalidade?.preveEncontroAoVivo === true;
              const totalEncontros = ehSincrona
                ? encontrosDaTurma(estado, t.turma.id).length
                : 0;
              const ativa = t.turma.id === turmaSelecionadaId;
              return (
                <Card
                  key={t.turma.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={ativa}
                  onClick={() => selecionarTurma(t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selecionarTurma(t);
                    }
                  }}
                  className={cn(
                    "cursor-pointer transition-colors",
                    ativa
                      ? "border-primary ring-2 ring-primary/30"
                      : "hover:border-primary/40",
                  )}
                >
                  <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {t.turma.nome}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {t.temaNome}
                      </p>
                    </div>
                    <Badge variant="secondary">{t.modalidadeNome}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ehSincrona ? (
                      <p className="text-xs text-muted-foreground">
                        {totalEncontros} encontro(s)
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" aria-hidden />
                        Modalidade assíncrona — presença automática pelo envio
                        da tarefa.
                      </p>
                    )}
                    <Progress value={t.percentual} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {t.turma.vagasOcupadas} de {t.turma.vagas} vagas ocupadas
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selecionada && (
            <Card>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    {selecionada.turma.nome}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selecionada.temaNome} · {selecionada.modalidadeNome}
                  </p>
                </div>
                <div className="flex gap-2">
                  {sincrona && (
                    <Button
                      size="sm"
                      variant={modo === "presenca" ? "default" : "outline"}
                      onClick={() => setModo("presenca")}
                    >
                      <CalendarCheck className="size-4" aria-hidden />
                      Lançar presença
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={modo === "entregas" ? "default" : "outline"}
                    onClick={() => setModo("entregas")}
                  >
                    <ClipboardCheck className="size-4" aria-hidden />
                    Validar entregas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {modo === "presenca" && sincrona ? (
                  <ConteudoLancamentoPresenca
                    key={`presenca-${selecionada.turma.id}`}
                    turma={selecionada.turma}
                  />
                ) : (
                  <TabelaValidacaoEntregas
                    key={`entregas-${selecionada.turma.id}`}
                    turma={selecionada.turma}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
