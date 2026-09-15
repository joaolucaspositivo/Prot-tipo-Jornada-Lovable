import { createFileRoute } from "@tanstack/react-router";

import { PainelModeracao } from "@/components/moderador/PainelModeracao";

export const Route = createFileRoute("/moderacao")({
  head: () => ({
    meta: [
      { title: "Minhas turmas — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Lançamento de presença nas turmas vinculadas ao moderador (D33).",
      },
      { property: "og:title", content: "Minhas turmas" },
      {
        property: "og:description",
        content:
          "Lançamento de presença nas turmas vinculadas ao moderador (D33).",
      },
    ],
  }),
  component: PainelModeracao,
});
