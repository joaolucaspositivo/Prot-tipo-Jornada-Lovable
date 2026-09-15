import { createFileRoute } from "@tanstack/react-router";

import { PainelPerfil } from "@/components/perfil/PainelPerfil";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Dados da base institucional, tipo de participação, líderes e alocações (D35).",
      },
      { property: "og:title", content: "Perfil" },
      {
        property: "og:description",
        content:
          "Dados da base institucional, tipo de participação, líderes e alocações (D35).",
      },
    ],
  }),
  component: PainelPerfil,
});
