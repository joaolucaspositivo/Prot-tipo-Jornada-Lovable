import { createFileRoute } from "@tanstack/react-router";

import { PainelUnidade } from "@/components/diretor/PainelUnidade";

export const Route = createFileRoute("/unidade")({
  head: () => ({
    meta: [
      { title: "Minha unidade — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Acompanhamento por etapa dos docentes da unidade, organizado por coordenador (D18).",
      },
      { property: "og:title", content: "Minha unidade" },
      {
        property: "og:description",
        content:
          "Acompanhamento por etapa dos docentes da unidade, organizado por coordenador (D18).",
      },
    ],
  }),
  component: PainelUnidade,
});
