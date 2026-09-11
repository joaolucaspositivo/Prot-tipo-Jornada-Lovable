import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/data/store";

export const Route = createFileRoute("/acesso")({
  head: () => ({
    meta: [
      { title: "Acesso ao ciclo — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Acesso identificado pela base institucional, sem digitar matrícula.",
      },
      { property: "og:title", content: "Acesso ao ciclo do docente" },
      {
        property: "og:description",
        content:
          "Acesso identificado pela base institucional, sem digitar matrícula.",
      },
    ],
  }),
  component: AcessoPage,
});

function AcessoPage() {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const navigate = useNavigate();
  const config = estado.cicloConfig;

  const docentes = estado.pessoas.filter((p) => p.perfil === "docente");
  const segmento =
    config.segmentos.find((s) => s.id === pessoaAtiva.segmentoId)?.nome ??
    "Segmento não informado";

  const jaConcluiu = estado.autoavaliacoes.some(
    (a) => a.pessoaId === pessoaAtiva.id && a.concluidaEmISO,
  );

  function escolherDocente(id: string) {
    const pessoa = docentes.find((p) => p.id === id);
    if (!pessoa) return;
    atualizar({
      pessoaAtivaId: pessoa.id,
      perfilAtivo:
        pessoa.cargo === "corregente"
          ? "docente-corregente"
          : "docente-regente",
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {config.nome} · {config.periodo}
        </p>
        <h1 className="text-3xl">Bem-vindo à sua Jornada</h1>
        <p className="text-muted-foreground">
          Você já está identificado. Confirme que é você para abrir o ciclo.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sucesso/30 bg-sucesso-suave px-3 py-1 text-sm font-medium text-sucesso">
            <ShieldCheck className="size-4" aria-hidden />
            Identificado pela base institucional
          </span>
          <CardTitle className="font-display text-2xl">
            {pessoaAtiva.nome}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            <Dado
              Icone={Building2}
              rotulo="Unidade"
              valor={pessoaAtiva.unidade}
            />
            <Dado Icone={GraduationCap} rotulo="Segmento" valor={segmento} />
            <Dado
              Icone={BadgeCheck}
              rotulo="Cargo"
              valor={
                pessoaAtiva.cargo === "corregente" ? "Corregente" : "Regente"
              }
            />
          </dl>

          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Nada para digitar: seus dados vêm da base da rede. Se algo estiver
            errado, fale com a secretaria da sua unidade.
          </p>

          <Button
            size="lg"
            className="w-full text-base"
            onClick={() =>
              navigate({ to: jaConcluiu ? "/jornada" : "/autoavaliacao" })
            }
          >
            Sou eu — abrir meu ciclo
          </Button>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Somente para a demonstração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Escolha qual docente da base está acessando agora.
          </p>
          <Select value={pessoaAtiva.id} onValueChange={escolherDocente}>
            <SelectTrigger
              className="h-11 w-full"
              aria-label="Escolher o docente da demonstração"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {docentes.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nome} ·{" "}
                  {d.cargo === "corregente" ? "Corregente" : "Regente"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}

function Dado({
  Icone,
  rotulo,
  valor,
}: {
  Icone: typeof Building2;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icone className="size-4" aria-hidden />
        {rotulo}
      </dt>
      <dd className="mt-1 font-medium">{valor}</dd>
    </div>
  );
}
