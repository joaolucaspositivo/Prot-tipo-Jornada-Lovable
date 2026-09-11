import { AlertTriangle, CalendarCheck, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/data/store";
import type { Presenca, Turma } from "@/data/types";
import { docentesDaTurma, novoId } from "@/lib/ciclo";
import { ocupacaoDasTurmas } from "@/lib/gestao";

export function OcupacaoTurmas() {
  const { estado } = useStore();
  const turmas = ocupacaoDasTurmas(estado);
  const esgotadas = turmas.filter((t) => t.alerta === "esgotada");
  const vazias = turmas.filter((t) => t.alerta === "vazia");
  const [turmaAbertaId, setTurmaAbertaId] = useState<string | null>(null);
  const turmaAberta = turmas.find((t) => t.turma.id === turmaAbertaId)?.turma;

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
            {turmas.map((t) => {
              const sincrona = t.modalidade?.presencaAutomatica === false;
              return (
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
                  {sincrona ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setTurmaAbertaId(t.turma.id)}
                    >
                      <CalendarCheck className="size-4" /> Lançar presença
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

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
    </div>
  );
}

function PainelLancamentoPresenca({ turma }: { turma: Turma }) {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const ofertasDaTurma = estado.ofertas.filter(
    (o) =>
      o.macrotemaId === turma.macrotemaId &&
      o.modalidadeId === turma.modalidadeId,
  );

  const [etapaIdBruto, setEtapaIdBruto] = useState("");
  const etapaId = ofertasDaTurma.some((o) => o.etapaId === etapaIdBruto)
    ? etapaIdBruto
    : (ofertasDaTurma[0]?.etapaId ?? "");
  const etapa = estado.cicloConfig.etapas.find((e) => e.id === etapaId);

  const [encontro, setEncontro] = useState(1);
  const [justificandoId, setJustificandoId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");

  const docentes = docentesDaTurma(estado, turma.id);

  if (ofertasDaTurma.length === 0) {
    return (
      <div className="p-6">
        <SheetHeader>
          <SheetTitle>Lançar presença — {turma.nome}</SheetTitle>
          <SheetDescription>
            Nenhuma oferta de conteúdo configurada para este macrotema e
            modalidade ainda. Cadastre o conteúdo da etapa na aba Conteúdo antes
            de lançar presença.
          </SheetDescription>
        </SheetHeader>
      </div>
    );
  }

  function presencaDoDocente(pessoaId: string): Presenca | undefined {
    return estado.presencas.find(
      (p) =>
        p.pessoaId === pessoaId &&
        p.turmaId === turma.id &&
        p.etapaId === etapaId &&
        p.encontro === encontro,
    );
  }

  function upsert(pessoaId: string, mudanca: Partial<Presenca>) {
    atualizar((anterior) => {
      const agora = new Date().toISOString();
      const existente = anterior.presencas.find(
        (p) =>
          p.pessoaId === pessoaId &&
          p.turmaId === turma.id &&
          p.etapaId === etapaId &&
          p.encontro === encontro,
      );
      const registro: Presenca = existente
        ? {
            ...existente,
            ...mudanca,
            lancadaEmISO: agora,
            lancadaPorId: pessoaAtiva.id,
          }
        : {
            id: novoId("pres"),
            pessoaId,
            turmaId: turma.id,
            etapaId,
            encontro,
            presente: false,
            lancadaEmISO: agora,
            lancadaPorId: pessoaAtiva.id,
            ...mudanca,
          };
      return {
        ...anterior,
        presencas: [
          ...anterior.presencas.filter((p) => p.id !== registro.id),
          registro,
        ],
        notificacoes: [
          {
            id: novoId("not"),
            pessoaId,
            titulo: "Presença lançada",
            descricao: `Encontro ${encontro} de "${etapa?.nome ?? turma.nome}" registrado pela equipe operadora.`,
            criadaEmISO: agora,
            lida: false,
            tipo: "mudanca_etapa" as const,
          },
          ...anterior.notificacoes,
        ],
      };
    });
  }

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Lançar presença — {turma.nome}</SheetTitle>
        <SheetDescription>
          {turma.professorNome ? `Professor: ${turma.professorNome}. ` : ""}
          {docentes.length} docente(s) inscrito(s).
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-3 border-b border-border p-4">
        {ofertasDaTurma.length > 1 ? (
          <div className="space-y-1.5">
            <Label htmlFor="presenca-etapa">Etapa</Label>
            <Select value={etapaId} onValueChange={setEtapaIdBruto}>
              <SelectTrigger id="presenca-etapa" className="h-10">
                <SelectValue>{etapa?.nome}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ofertasDaTurma.map((o) => {
                  const e = estado.cicloConfig.etapas.find(
                    (x) => x.id === o.etapaId,
                  );
                  return (
                    <SelectItem key={o.etapaId} value={o.etapaId}>
                      {e?.nome ?? o.etapaId}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="presenca-encontro">Encontro</Label>
          <Select
            value={String(encontro)}
            onValueChange={(v) => setEncontro(Number(v))}
          >
            <SelectTrigger id="presenca-encontro" className="h-10 w-40">
              <SelectValue>{`Encontro ${encontro}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                { length: Math.max(1, turma.encontrosPrevistos) },
                (_, i) => i + 1,
              ).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {`Encontro ${n}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ul className="flex-1 divide-y divide-border overflow-y-auto">
        {docentes.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">
            Nenhum docente inscrito nesta turma ainda.
          </li>
        ) : null}
        {docentes.map((pessoa) => {
          const registro = presencaDoDocente(pessoa.id);
          const presente = registro?.presente ?? false;
          const justificada = registro?.justificada ?? false;
          return (
            <li key={pessoa.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{pessoa.nome}</p>
                  {justificada ? (
                    <Badge
                      variant="outline"
                      className="mt-1 border-andamento/40 text-andamento"
                    >
                      Falta justificada
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`presente-${pessoa.id}`}
                    checked={presente}
                    onCheckedChange={(v) =>
                      upsert(pessoa.id, {
                        presente: v,
                        justificada: v ? false : justificada,
                      })
                    }
                  />
                  <Label htmlFor={`presente-${pessoa.id}`}>
                    {presente ? "Presente" : "Ausente"}
                  </Label>
                </div>
              </div>

              {!presente ? (
                justificandoId === pessoa.id ? (
                  <div className="space-y-2 rounded-lg border border-border p-2">
                    <Input
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex.: atestado médico"
                      className="h-9"
                      aria-label="Observação da liberação manual"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          upsert(pessoa.id, { justificada: true, observacao });
                          setJustificandoId(null);
                          setObservacao("");
                        }}
                      >
                        Salvar justificativa
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setJustificandoId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-accent-foreground underline underline-offset-2"
                    onClick={() => setJustificandoId(pessoa.id)}
                  >
                    Liberação manual (atestado etc.)
                  </button>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
