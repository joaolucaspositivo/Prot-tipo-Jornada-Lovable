import { createFileRoute } from "@tanstack/react-router";

import { Placeholder } from "@/components/layout/Placeholder";

export const Route = createFileRoute("/unidade")({
  head: () => ({
    meta: [
      { title: "Minha unidade — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content: "Visão do diretor sobre o andamento do ciclo na unidade.",
      },
      { property: "og:title", content: "Minha unidade" },
      {
        property: "og:description",
        content: "Visão do diretor sobre o andamento do ciclo na unidade.",
      },
    ],
  }),
  component: () => (
    <Placeholder
      titulo="Minha unidade"
      descricao="Representação mínima: papel do diretor ainda a confirmar."
      etapa="Transversais e ajustes finais"
    />
  ),
});
