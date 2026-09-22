import { createFileRoute } from "@tanstack/react-router";

import { PainelPresencas } from "@/components/conteudo/PainelPresencas";
import { PainelEquipe } from "@/components/coordenador/PainelEquipe";
import { PainelEntregasRecebidas } from "@/components/entrega/PainelEntregasRecebidas";
import { OcupacaoTurmas } from "@/components/operadora/OcupacaoTurmas";
import { PainelAlertas } from "@/components/operadora/PainelAlertas";
import { PainelConferencias } from "@/components/operadora/PainelConferencias";
import { PainelGestaoCiclo } from "@/components/operadora/PainelGestaoCiclo";
import { ResumoEnquete } from "@/components/enquete/ResumoEnquete";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/data/store";
import { cicloConfigAtivo } from "@/lib/ciclo";

export const Route = createFileRoute("/gestao")({
  head: () => ({
    meta: [
      { title: "Gestão do ciclo — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Visão consolidada do ciclo, conferências, ocupação das turmas e alertas.",
      },
      { property: "og:title", content: "Gestão do ciclo" },
      {
        property: "og:description",
        content:
          "Visão consolidada do ciclo, conferências, ocupação das turmas e alertas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GestaoPage,
});

function GestaoPage() {
  const { estado } = useStore();
  const config = cicloConfigAtivo(estado);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Equipe operadora
        </p>
        <h1 className="text-2xl sm:text-3xl">Gestão do ciclo</h1>
        <p className="text-muted-foreground">
          {config.nome} · {config.periodo}. Tudo o que hoje sai de planilhas
          cruzadas à mão, pronto e acionável aqui.
        </p>
      </header>

      <Tabs defaultValue="visao">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="visao">Visão do ciclo</TabsTrigger>
          <TabsTrigger value="conferencias">Conferências</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
          <TabsTrigger value="docentes">Docentes</TabsTrigger>
          <TabsTrigger value="enquete">Enquete 360°</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-4">
          <PainelGestaoCiclo />
        </TabsContent>
        <TabsContent value="conferencias" className="mt-4">
          <PainelConferencias />
        </TabsContent>
        <TabsContent value="turmas" className="mt-4">
          <OcupacaoTurmas />
        </TabsContent>
        <TabsContent value="docentes" className="mt-4 space-y-6">
          <PainelEquipe escopo="operadora" />
          <PainelEntregasRecebidas escopo="operadora" />
          <PainelPresencas />
        </TabsContent>
        <TabsContent value="enquete" className="mt-4">
          <ResumoEnquete />
        </TabsContent>
        <TabsContent value="alertas" className="mt-4">
          <PainelAlertas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
