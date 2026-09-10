import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";

import { AbaAlertas } from "@/components/config/AbaAlertas";
import { AbaEncerramento } from "@/components/config/AbaEncerramento";
import { AbaEtapas } from "@/components/config/AbaEtapas";
import { AbaMacrotemas } from "@/components/config/AbaMacrotemas";
import { AbaModalidades } from "@/components/config/AbaModalidades";
import { AbaSegmentos } from "@/components/config/AbaSegmentos";
import { PreviaTrilha } from "@/components/config/PreviaTrilha";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/data/store";

export const Route = createFileRoute("/configuracao")({
  head: () => ({
    meta: [
      { title: "Configuração do Ciclo — Jornada Pedagógica de Desenvolvimento" },
      {
        name: "description",
        content:
          "Edição de macrotemas, modalidades, etapas, segmentos e alertas do ciclo.",
      },
      { property: "og:title", content: "Configuração do Ciclo" },
      {
        property: "og:description",
        content:
          "Edição de macrotemas, modalidades, etapas, segmentos e alertas do ciclo.",
      },
    ],
  }),
  component: ConfiguracaoPage,
});

function ConfiguracaoPage() {
  const { estado } = useStore();
  const config = estado.cicloConfig;
  const [segmentoPrevia, setSegmentoPrevia] = useState(
    config.segmentos[0]?.id ?? "",
  );

  const segmentoValido = config.segmentos.some((s) => s.id === segmentoPrevia)
    ? segmentoPrevia
    : (config.segmentos[0]?.id ?? "");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Equipe operadora
        </p>
        <h1 className="text-3xl">Configuração do Ciclo</h1>
        <p className="text-muted-foreground">
          {config.nome} · {config.periodo}. Tudo o que você edita aqui vale na
          hora para docentes e coordenadores.
        </p>
        <p className="flex items-center gap-2 text-sm text-sucesso">
          <Check className="size-4" aria-hidden />
          Alterações gravadas automaticamente neste navegador
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Tabs defaultValue="macrotemas">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="macrotemas">Macrotemas</TabsTrigger>
            <TabsTrigger value="modalidades">Modalidades</TabsTrigger>
            <TabsTrigger value="etapas">Etapas da trilha</TabsTrigger>
            <TabsTrigger value="segmentos">Segmentos</TabsTrigger>
            <TabsTrigger value="alertas">Alertas de pendência</TabsTrigger>
            <TabsTrigger value="encerramento">Encerramento</TabsTrigger>
          </TabsList>

          <TabsContent value="macrotemas" className="mt-4">
            <AbaMacrotemas />
          </TabsContent>
          <TabsContent value="modalidades" className="mt-4">
            <AbaModalidades />
          </TabsContent>
          <TabsContent value="etapas" className="mt-4">
            <AbaEtapas />
          </TabsContent>
          <TabsContent value="segmentos" className="mt-4">
            <AbaSegmentos />
          </TabsContent>
          <TabsContent value="alertas" className="mt-4">
            <AbaAlertas />
          </TabsContent>
          <TabsContent value="encerramento" className="mt-4">
            <AbaEncerramento />
          </TabsContent>
        </Tabs>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <PreviaTrilha
            segmentoId={segmentoValido}
            aoTrocarSegmento={setSegmentoPrevia}
          />
        </aside>
      </div>
    </div>
  );
}
