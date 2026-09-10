import { createFileRoute } from "@tanstack/react-router";

import { GestaoConteudo } from "@/components/operadora/GestaoConteudo";

export const Route = createFileRoute("/conteudo")({
  head: () => ({
    meta: [
      { title: "Conteúdo do ciclo — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Envio de vídeos e textos-base associados a etapas e macrotemas, sem copiar link.",
      },
      { property: "og:title", content: "Conteúdo do ciclo" },
      {
        property: "og:description",
        content:
          "Envio de vídeos e textos-base associados a etapas e macrotemas, sem copiar link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConteudoPage,
});

function ConteudoPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Equipe operadora
        </p>
        <h1 className="text-2xl sm:text-3xl">Conteúdo do ciclo</h1>
        <p className="text-muted-foreground">
          Vídeos e textos-base entram por aqui e aparecem na trilha do docente.
        </p>
      </header>
      <GestaoConteudo />
    </div>
  );
}
