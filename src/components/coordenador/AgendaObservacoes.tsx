import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { Observacao } from "@/data/types";
import { formatarData, novoId } from "@/lib/ciclo";
import { formatarTamanho } from "@/lib/entrega";
import {
  CRITERIOS_OBSERVACAO,
  ESCALA_OBSERVACAO,
  NOMES_DIA_CURTOS,
  NOMES_MES,
  ROTULO_SITUACAO_COMPROMISSO,
  compromissosDeObservacao,
  daSemana,
  gradeDoMes,
  pendentesDoCoordenador,
  type Compromisso,
} from "@/lib/observacao";

function hora(data: Date): string {
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CLASSE_SITUACAO: Record<Compromisso["situacao"], string> = {
  agendada: "bg-pendente-suave text-pendente",
  realizada: "bg-sucesso-suave text-sucesso",
  pendente: "bg-atraso-suave text-atraso",
};

interface Props {
  escopo: "coordenador" | "operadora";
}

/** Calendário mensal e lista da semana, alimentados pelas entregas. */
export function AgendaObservacoes({ escopo }: Props) {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const compromissos = useMemo(
    () =>
      compromissosDeObservacao(
        estado,
        escopo === "operadora"
          ? { todos: true }
          : { coordenadorId: pessoaAtiva.id },
      ),
    [estado, escopo, pessoaAtiva.id],
  );

  const grade = useMemo(
    () => gradeDoMes(mes, compromissos),
    [mes, compromissos],
  );
  const semana = useMemo(() => daSemana(compromissos), [compromissos]);
  const pendentes = useMemo(
    () => pendentesDoCoordenador(compromissos),
    [compromissos],
  );
  const aberto = compromissos.find((c) => c.id === abertoId);

  function salvarParecer(
    c: Compromisso,
    dados: {
      dataISO: string;
      criterios: Record<string, number>;
      comentario: string;
    },
  ) {
    const agora = new Date().toISOString();
    const etapaId = c.etapaObservacao?.id ?? "";
    atualizar((anterior) => {
      const existente = anterior.observacoes.find(
        (o) => o.pessoaId === c.entrega.pessoaId && o.etapaId === etapaId,
      );
      const registro: Observacao = {
        id: existente?.id ?? novoId("obs"),
        pessoaId: c.entrega.pessoaId,
        coordenadorId: pessoaAtiva.id,
        etapaId,
        dataAulaISO: c.dataAula.toISOString(),
        realizadaEmISO: dados.dataISO,
        criterios: dados.criterios,
        comentario: dados.comentario,
      };
      return {
        ...anterior,
        observacoes: existente
          ? anterior.observacoes.map((o) =>
              o.id === existente.id ? registro : o,
            )
          : [...anterior.observacoes, registro],
        progressoEtapas: anterior.progressoEtapas.map((p) =>
          p.pessoaId === c.entrega.pessoaId && p.etapaId === etapaId
            ? { ...p, status: "concluida" as const, atualizadoEmISO: agora }
            : p,
        ),
        notificacoes: [
          {
            id: novoId("not"),
            pessoaId: c.entrega.pessoaId,
            titulo: "Parecer da observação de aula disponível",
            descricao: `${pessoaAtiva.nome} registrou o parecer da sua aula. Registre a ciência na sua jornada.`,
            criadaEmISO: agora,
            lida: false,
            tipo: "devolutiva" as const,
          },
          ...anterior.notificacoes,
        ],
      };
    });
    toast.success("Parecer salvo. A etapa foi concluída e o docente avisado.");
    setAbertoId(null);
  }

  return (
    <div className="space-y-6">
      {pendentes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-atraso/40 bg-atraso-suave p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-atraso" aria-hidden />
            <div>
              <p className="text-sm font-medium text-atraso">
                {pendentes.length} aula(s) já observada(s) na data e sem parecer
                registrado
              </p>
              <p className="text-sm text-muted-foreground">
                Esta pendência é sua, e não do docente:{" "}
                {pendentes
                  .slice(0, 3)
                  .map((c) => c.docente?.nome)
                  .join(" · ")}
                {pendentes.length > 3 ? " …" : ""}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setAbertoId(pendentes[0]!.id)}>
            Registrar parecer
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-5 text-primary" aria-hidden />
            {NOMES_MES[mes.getMonth()]} de {mes.getFullYear()}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Mês anterior"
              onClick={() =>
                setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo mês"
              onClick={() =>
                setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {NOMES_DIA_CURTOS.map((d) => (
              <div key={d} className="pb-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grade.map((dia) => (
              <div
                key={dia.data.toISOString()}
                className={`min-h-16 rounded-lg border border-border p-1 text-left sm:min-h-24 ${
                  dia.doMes ? "bg-card" : "bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="text-xs">{dia.data.getDate()}</div>
                <div className="mt-1 space-y-1">
                  {dia.compromissos.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAbertoId(c.id)}
                      className={`block w-full truncate rounded px-1 py-0.5 text-left text-[11px] ${CLASSE_SITUACAO[c.situacao]}`}
                      title={`${c.docente?.nome} · ${hora(c.dataAula)}`}
                    >
                      {hora(c.dataAula)} {c.docente?.nome?.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-3 rounded bg-pendente-suave" aria-hidden />{" "}
              a observar
            </span>
            <span className="flex items-center gap-1">
              <span className="size-3 rounded bg-sucesso-suave" aria-hidden />{" "}
              observada
            </span>
            <span className="flex items-center gap-1">
              <span className="size-3 rounded bg-atraso-suave" aria-hidden />{" "}
              parecer pendente
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <CalendarClock className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base">Próximos sete dias</CardTitle>
        </CardHeader>
        <CardContent>
          {semana.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma aula a observar nesta semana.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {semana.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setAbertoId(c.id)}
                    className="flex w-full flex-wrap items-baseline justify-between gap-2 py-3 text-left hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {c.docente?.nome}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {c.turma?.nome ?? "Turma"} · {c.docente?.unidade} ·{" "}
                        {c.macrotema?.nome ?? "Macrotema"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">
                        {ROTULO_SITUACAO_COMPROMISSO[c.situacao]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatarData(c.dataAula)} · {hora(c.dataAula)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={Boolean(aberto)}
        onOpenChange={(v) => !v && setAbertoId(null)}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
          {aberto && (
            <DetalheObservacao
              key={aberto.id}
              compromisso={aberto}
              aoSalvar={(dados) => salvarParecer(aberto, dados)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetalheObservacao({
  compromisso: c,
  aoSalvar,
}: {
  compromisso: Compromisso;
  aoSalvar: (dados: {
    dataISO: string;
    criterios: Record<string, number>;
    comentario: string;
  }) => void;
}) {
  const jaObservada = Boolean(c.observacao?.realizadaEmISO);
  // Sugere a data da própria aula quando ela já aconteceu; senão, hoje.
  const [dataObs, setDataObs] = useState(() =>
    new Date(Math.min(Date.now(), c.dataAula.getTime()))
      .toISOString()
      .slice(0, 10),
  );
  const [criterios, setCriterios] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-xl leading-snug">
          {c.docente?.nome ?? "Docente"}
        </SheetTitle>
        <SheetDescription>
          {c.turma?.nome ?? "Turma"} · {c.docente?.unidade} ·{" "}
          {c.macrotema?.nome ?? "Macrotema"} · {formatarData(c.dataAula)} às{" "}
          {hora(c.dataAula)}
        </SheetDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge className={CLASSE_SITUACAO[c.situacao]} variant="secondary">
            {ROTULO_SITUACAO_COMPROMISSO[c.situacao]}
          </Badge>
          {c.daEquipeCentral && <Badge variant="outline">Equipe central</Badge>}
          {c.turma?.horario && (
            <Badge variant="outline">{c.turma.horario}</Badge>
          )}
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-8">
        <section>
          <h3 className="mb-2 text-base">Entrega e planejamento</h3>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm">{c.entrega.texto}</p>
            {c.entrega.arquivoNome && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <FileText className="size-4 text-primary" aria-hidden />
                {c.entrega.arquivoNome}
                <span className="text-muted-foreground">
                  {formatarTamanho(c.entrega.arquivoTamanho)}
                </span>
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {c.etapaEntrega?.nome ?? "Entrega"} · enviada em{" "}
              {formatarData(new Date(c.entrega.enviadaEmISO))}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-base">Parecer da observação</h3>
          {jaObservada ? (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="flex items-center gap-2 text-sm text-sucesso">
                <CheckCircle2 className="size-4" aria-hidden />
                Observada em{" "}
                {formatarData(new Date(c.observacao!.realizadaEmISO!))}
              </p>
              {c.observacao?.criterios && (
                <ul className="mt-3 space-y-1 text-sm">
                  {CRITERIOS_OBSERVACAO.filter(
                    (crit) => c.observacao?.criterios?.[crit.id],
                  ).map((crit) => (
                    <li key={crit.id} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        {crit.rotulo}
                      </span>
                      <span>
                        {
                          ESCALA_OBSERVACAO.find(
                            (e) =>
                              e.valor === c.observacao?.criterios?.[crit.id],
                          )?.rotulo
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {c.observacao?.comentario && (
                <p className="mt-3 text-sm">{c.observacao.comentario}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {c.observacao?.cienciaEmISO
                  ? `Docente deu ciência em ${formatarData(new Date(c.observacao.cienciaEmISO))}.`
                  : "Aguardando a ciência do docente."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-border bg-card p-3">
              <div>
                <Label htmlFor="data-obs">Data da observação</Label>
                <input
                  id="data-obs"
                  type="date"
                  value={dataObs}
                  onChange={(e) => setDataObs(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {CRITERIOS_OBSERVACAO.map((crit) => (
                <fieldset key={crit.id}>
                  <legend className="text-sm font-medium">{crit.rotulo}</legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {ESCALA_OBSERVACAO.map((op) => (
                      <Button
                        key={op.valor}
                        type="button"
                        size="sm"
                        variant={
                          criterios[crit.id] === op.valor
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setCriterios((a) => ({ ...a, [crit.id]: op.valor }))
                        }
                      >
                        {op.rotulo}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              ))}

              <div>
                <Label htmlFor="comentario-obs">
                  Comentário aberto para o docente
                </Label>
                <Textarea
                  id="comentario-obs"
                  rows={5}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="O que foi observado na aula e o que pode avançar no próximo passo."
                  className="mt-1"
                />
              </div>

              {erro && <p className="text-sm text-atraso">{erro}</p>}

              <Button
                onClick={() => {
                  if (!dataObs) return setErro("Informe a data da observação.");
                  if (
                    Object.keys(criterios).length < CRITERIOS_OBSERVACAO.length
                  )
                    return setErro("Avalie todos os critérios observáveis.");
                  if (comentario.trim().length < 10)
                    return setErro("Escreva um comentário para o docente.");
                  setErro(null);
                  aoSalvar({
                    dataISO: new Date(`${dataObs}T12:00:00`).toISOString(),
                    criterios,
                    comentario: comentario.trim(),
                  });
                }}
              >
                Salvar parecer e concluir etapa
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
