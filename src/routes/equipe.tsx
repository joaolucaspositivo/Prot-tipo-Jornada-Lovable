import { createFileRoute } from "@tanstack/react-router";

import { FunilEtapas } from "@/components/acompanhamento/FunilEtapas";
import { PainelPresencas } from "@/components/conteudo/PainelPresencas";
import { PainelEquipe } from "@/components/coordenador/PainelEquipe";
import { useStore } from "@/data/store";
import { linhasDaEquipe } from "@/lib/equipe";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Minha equipe — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Progresso, pendências, entregas e devolutivas dos docentes sob a liderança do coordenador.",
      },
      { property: "og:title", content: "Minha equipe" },
      {
        property: "og:description",
        content:
          "Progresso, pendências, entregas e devolutivas dos docentes sob a liderança do coordenador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EquipePage,
});

function EquipePage() {
  const { estado, pessoaAtiva } = useStore();
  const linhas = linhasDaEquipe(estado, { coordenadorId: pessoaAtiva.id });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl sm:text-3xl">Minha equipe</h1>
        <p className="mt-1 text-muted-foreground">
          Acompanhe o percurso de cada docente, abra a entrega e registre a
          devolutiva sem sair daqui.
        </p>
      </div>
      <FunilEtapas estado={estado} linhas={linhas} />
      <PainelEquipe escopo="coordenador" />
      <PainelPresencas apenasMinhaEquipe />
    </div>
  );
}
