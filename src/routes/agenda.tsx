import { createFileRoute } from "@tanstack/react-router";

import { AgendaObservacoes } from "@/components/coordenador/AgendaObservacoes";
import { useStore } from "@/data/store";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
  head: () => ({
    meta: [
      { title: "Agenda de observação de aula | Jornada Pedagógica" },
      {
        name: "description",
        content:
          "Calendário das aulas a observar, alimentado pelas datas informadas pelos docentes nas entregas, com registro do parecer.",
      },
      { property: "og:title", content: "Agenda de observação de aula" },
      {
        property: "og:description",
        content:
          "Aulas a observar, semana atual e registro estruturado do parecer da observação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AgendaPage() {
  const { pessoaAtiva } = useStore();
  const ehOperadora = pessoaAtiva.perfil === "operadora";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl">Agenda de observações</h1>
      <p className="mt-1 text-muted-foreground">
        As datas chegam automaticamente das entregas dos docentes. Ninguém agenda
        à mão.
      </p>
      {!ehOperadora && (
        <p className="mt-2 text-sm text-muted-foreground">
          As aulas dos corregentes são observadas pela equipe central e não
          entram na sua agenda.
        </p>
      )}

      <div className="mt-6">
        <AgendaObservacoes escopo={ehOperadora ? "operadora" : "coordenador"} />
      </div>
    </div>
  );
}
