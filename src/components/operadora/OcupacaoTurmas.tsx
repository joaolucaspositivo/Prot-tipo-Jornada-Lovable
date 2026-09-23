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
import {
  cicloConfigAtivo,
  docentesDaTurma,
  encontrosDaTurma,
  formatarData,
  nomeDoProfessor,
  novoId,
} from "@/lib/ciclo";
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
              const sincrona = t.modalidade?.preveEncontroAoVivo === true;
              const totalEncontros = sincrona
                ? encontrosDaTurma(estado, t.turma.id).length
                : 0;
              return (
                <li
                  key={t.turma.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{t.turma.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.temaNome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.modalidadeNome}
                        {sincrona ? ` · ${totalEncontros} encontro(s)` : ""}
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

/** Exportado: o moderador (D33) reaproveita o mesmo lançamento de presença. */
export function PainelLancamentoPresenca({ turma }: { turma: Turma }) {
  const { estado, pessoaAtiva, atualizar } = useStore();
  // Config do PRÓPRIO mesociclo da turma — quem chama esta tela (moderador,
  // gestão) pode estar olhando uma turma de qualquer ciclo, não só o vigente.
  const config =
    estado.cicloConfigs.find((c) => c.mesocicloId === turma.mesocicloId) ??
    cicloConfigAtivo(estado);
  const ofertasDaTurma = estado.ofertas.filter(
    (o) => o.temaId === turma.temaId && o.modalidadeId === turma.modalidadeId,
  );

  const [etapaIdBruto, setEtapaIdBruto] = useState("");
  const etapaId = ofertasDaTurma.some((o) => o.etapaId === etapaIdBruto)
    ? etapaIdBruto
    : (ofertasDaTurma[0]?.etapaId ?? "");
  const etapa = config.etapas.find((e) => e.id === etapaId);

  const encontros = encontrosDaTurma(estado, turma.id);
  const [encontroIdBruto, setEncontroIdBruto] = useState("");
  const encontroId = encontros.some((e) => e.id === encontroIdBruto)
    ? encontroIdBruto
    : (encontros[0]?.id ?? "");
  const encontro = encontros.find((e) => e.id === encontroId);
  const [justificandoId, setJustificandoId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");

  const docentes = docentesDaTurma(estado, turma.id);

  if (ofertasDaTurma.length === 0) {
    return (
      <div className="p-6">
        <SheetHeader>
          <SheetTitle>Lançar presença — {turma.nome}</SheetTitle>
          <SheetDescription>
            Nenhuma oferta de conteúdo configurada para este tema e modalidade
            ainda. Cadastre o conteúdo da etapa na aba Conteúdo antes de lançar
            presença.
          </SheetDescription>
        </SheetHeader>
      </div>
    );
  }

  if (encontros.length === 0) {
    return (
      <div className="p-6">
        <SheetHeader>
          <SheetTitle>Lançar presença — {turma.nome}</SheetTitle>
          <SheetDescription>
            Nenhum encontro cadastrado ainda para esta turma. Cadastre os
            encontros na aba Turmas antes de lançar presença.
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
        p.encontroId === encontroId,
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
          p.encontroId === encontroId,
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
            encontroId,
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
            descricao: `Encontro de ${formatarData(new Date(encontro!.data))} de "${etapa?.nome ?? turma.nome}" registrado pela equipe operadora.`,
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
          Professor: {nomeDoProfessor(estado, turma.professorId)}.{" "}
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
                  const e = config.etapas.find((x) => x.id === o.etapaId);
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
          <Select value={encontroId} onValueChange={setEncontroIdBruto}>
            <SelectTrigger id="presenca-encontro" className="h-10 w-56">
              <SelectValue>
                {encontro
                  ? `${formatarData(new Date(encontro.data))} · ${encontro.horario}`
                  : ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {encontros.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {formatarData(new Date(e.data))} · {e.horario}
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
