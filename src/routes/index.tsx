import { createFileRoute } from "@tanstack/react-router";

import { Placeholder } from "@/components/layout/Placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ROTULO_PERFIL, useStore } from "@/data/store";

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

      <Placeholder
        titulo="Painel do perfil"
        descricao="Os indicadores completos deste perfil entram nas próximas etapas."
        etapa={
          perfil === "coordenador"
            ? "Painel do coordenador e devolutivas"
            : perfil === "operadora"
              ? "Painel de gestão da operadora"
              : perfil === "diretor"
                ? "Visão da unidade"
                : "Minha Jornada"
        }
      />
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
