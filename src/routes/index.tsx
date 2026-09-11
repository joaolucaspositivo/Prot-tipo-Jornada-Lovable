import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { EstadoBadge } from "@/components/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROTULO_PERFIL, useStore } from "@/data/store";
import type { PerfilId } from "@/data/types";
import { contadores, linhasDaEquipe } from "@/lib/equipe";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Protótipo navegável da Jornada Pedagógica de Desenvolvimento do Ciclo 2 (2027–2030).",
      },
      {
        property: "og:title",
        content: "Jornada Pedagógica de Desenvolvimento",
      },
      {
        property: "og:description",
        content:
          "Protótipo navegável para validação: trilha configurável, perfis alternáveis e dados fictícios.",
      },
    ],
  }),
  component: Painel,
});

function Painel() {
  const { estado, pessoaAtiva } = useStore();
  const perfil = estado.perfilAtivo;
  const ciclo = estado.cicloConfig;

  const docentes = estado.pessoas.filter((p) => p.perfil === "docente");
  const progressoDoDocente = estado.progressoEtapas.filter(
    (p) => p.pessoaId === pessoaAtiva.id,
  );
  const concluidas = progressoDoDocente.filter(
    (p) => p.status === "concluida",
  ).length;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {ROTULO_PERFIL[perfil]}
        </p>
        <h1 className="text-2xl font-semibold md:text-3xl">
          Olá, {pessoaAtiva.nome.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          {ciclo.nome} · {ciclo.periodo} · {ciclo.etapas.length} etapas
          configuradas · {ciclo.macrotemas.filter((m) => m.ativo).length}{" "}
          macrotemas ativos
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Resumo titulo="Docentes na base" valor={docentes.length} />
        <Resumo titulo="Turmas do ciclo" valor={estado.turmas.length} />
        <Resumo
          titulo="Inscrições confirmadas"
          valor={estado.inscricoes.length}
        />
        <Resumo titulo="Entregas recebidas" valor={estado.entregas.length} />
      </div>

      {perfil.startsWith("docente") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sua situação no ciclo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <EstadoBadge
              status={
                progressoDoDocente.find(
                  (p) => p.status === "em_andamento" || p.status === "atrasada",
                )?.status ?? "concluida"
              }
            />
            <span>
              {concluidas} de {ciclo.etapas.length} etapas concluídas
            </span>
          </CardContent>
        </Card>
      )}

      <AtalhoDoPerfil perfil={perfil} />
    </div>
  );
}

/** Resumo compacto + atalho por perfil — porta de entrada, não painel completo. */
function AtalhoDoPerfil({ perfil }: { perfil: PerfilId }) {
  const { estado, pessoaAtiva } = useStore();

  if (perfil === "coordenador") {
    const c = contadores(
      linhasDaEquipe(estado, { coordenadorId: pessoaAtiva.id }),
    );
    return <CartaoAtalho dados={c} rotulo="Ver minha equipe" para="/equipe" />;
  }

  if (perfil === "operadora") {
    const c = contadores(linhasDaEquipe(estado));
    return (
      <CartaoAtalho dados={c} rotulo="Ver gestão do ciclo" para="/gestao" />
    );
  }

  if (perfil === "diretor") {
    const c = contadores(
      linhasDaEquipe(estado, { unidade: pessoaAtiva.unidade }),
    );
    return (
      <CartaoAtalho dados={c} rotulo="Ver minha unidade" para="/unidade" />
    );
  }

  return (
    <div>
      <Button asChild className="gap-1.5">
        <Link to="/jornada">
          Ver Minha Jornada
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

function CartaoAtalho({
  dados,
  rotulo,
  para,
}: {
  dados: ReturnType<typeof contadores>;
  rotulo: string;
  para: "/equipe" | "/gestao" | "/unidade";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acompanhamento por etapa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Indicador rotulo="Em dia" valor={dados.emDia} />
          <Indicador rotulo="Pendentes" valor={dados.pendentes} />
          <Indicador rotulo="Atrasados" valor={dados.atrasados} destaque />
          <Indicador rotulo="Concluídos" valor={dados.concluidos} />
        </div>
        <Button asChild className="gap-1.5">
          <Link to={para}>
            {rotulo}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function Indicador({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
      <p
        className={destaque && valor > 0 ? "text-2xl text-atraso" : "text-2xl"}
      >
        {valor}
      </p>
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}
