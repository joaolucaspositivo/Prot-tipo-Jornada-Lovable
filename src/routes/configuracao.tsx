import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { AbaAlertas } from "@/components/config/AbaAlertas";
import { AbaConteudo } from "@/components/config/AbaConteudo";
import { AbaEncerramento } from "@/components/config/AbaEncerramento";
import { AbaEtapas } from "@/components/config/AbaEtapas";
import { AbaGeral } from "@/components/config/AbaGeral";
import { AbaMacrotemas } from "@/components/config/AbaMacrotemas";
import { AbaModalidades } from "@/components/config/AbaModalidades";
import { AbaTurmas } from "@/components/config/AbaTurmas";
import {
  CabecalhoModoGuiado,
  PASSOS_GUIADOS,
  ResumoConferencia,
  type PassoGuiado,
} from "@/components/config/ModoGuiado";
import { PreviaTrilha } from "@/components/config/PreviaTrilha";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/data/store";
import { passoGuiadoTravado } from "@/lib/ciclo";

export const Route = createFileRoute("/configuracao")({
  head: () => ({
    meta: [
      {
        title: "Configuração do Ciclo — Jornada Pedagógica de Desenvolvimento",
      },
      {
        name: "description",
        content:
          "Edição de macrotemas, modalidades, turmas, etapas, conteúdo e alertas do ciclo.",
      },
      { property: "og:title", content: "Configuração do Ciclo" },
      {
        property: "og:description",
        content:
          "Edição de macrotemas, modalidades, turmas, etapas, conteúdo e alertas do ciclo.",
      },
    ],
  }),
  component: ConfiguracaoPage,
});

function ConfiguracaoPage() {
  const { estado } = useStore();
  const config = estado.cicloConfig;

  const [guiado, setGuiado] = useState(false);
  const [aba, setAba] = useState<PassoGuiado>("geral");
  const [passosConcluidos, setPassosConcluidos] = useState<Set<PassoGuiado>>(
    new Set(),
  );

  function passoTravado(p: PassoGuiado): boolean {
    return guiado && p !== "conferencia" && passoGuiadoTravado(estado, p);
  }

  const travadoAgora = passoTravado(aba);
  useEffect(() => {
    if (travadoAgora) setAba("geral");
    // Se o pré-requisito do passo atual deixar de ser cumprido (ex.: a
    // operadora desativa o único macrotema ativo enquanto está em
    // Modalidades), volta para um passo sempre livre em vez de deixar a
    // tela editável presa atrás de um cadeado.
  }, [travadoAgora]);

  function alternarGuiado(v: boolean) {
    setGuiado(v);
    if (!v && aba === "conferencia") setAba("encerramento");
  }

  function irParaPasso(p: PassoGuiado) {
    if (passoTravado(p)) return;
    setAba(p);
  }

  function avancar() {
    const indice = PASSOS_GUIADOS.indexOf(aba);
    const proximo = PASSOS_GUIADOS[indice + 1];
    if (!proximo || passoTravado(proximo)) return;
    setPassosConcluidos((anterior) => new Set(anterior).add(aba));
    setAba(proximo);
  }

  function voltar() {
    const indice = PASSOS_GUIADOS.indexOf(aba);
    const anterior = PASSOS_GUIADOS[indice - 1];
    if (anterior) setAba(anterior);
  }

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
        <div className="space-y-4">
          <CabecalhoModoGuiado
            guiado={guiado}
            aoAlternarGuiado={alternarGuiado}
            passoAtual={aba}
            passosConcluidos={passosConcluidos}
            passoTravado={passoTravado}
            aoIrParaPasso={irParaPasso}
            aoAvancar={avancar}
            aoVoltar={voltar}
          />

          {aba === "conferencia" ? (
            <ResumoConferencia estado={estado} />
          ) : (
            <Tabs value={aba} onValueChange={(v) => setAba(v as PassoGuiado)}>
              <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                <TabsTrigger value="geral" disabled={passoTravado("geral")}>
                  Geral
                </TabsTrigger>
                <TabsTrigger
                  value="macrotemas"
                  disabled={passoTravado("macrotemas")}
                >
                  Macrotemas
                </TabsTrigger>
                <TabsTrigger
                  value="modalidades"
                  disabled={passoTravado("modalidades")}
                >
                  Modalidades
                </TabsTrigger>
                <TabsTrigger value="turmas" disabled={passoTravado("turmas")}>
                  Turmas
                </TabsTrigger>
                <TabsTrigger value="etapas" disabled={passoTravado("etapas")}>
                  Etapas da trilha
                </TabsTrigger>
                <TabsTrigger
                  value="conteudo"
                  disabled={passoTravado("conteudo")}
                >
                  Conteúdo
                </TabsTrigger>
                <TabsTrigger value="alertas" disabled={passoTravado("alertas")}>
                  Alertas de pendência
                </TabsTrigger>
                <TabsTrigger
                  value="encerramento"
                  disabled={passoTravado("encerramento")}
                >
                  Encerramento
                </TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="mt-4">
                <AbaGeral />
              </TabsContent>
              <TabsContent value="macrotemas" className="mt-4">
                <AbaMacrotemas />
              </TabsContent>
              <TabsContent value="modalidades" className="mt-4">
                <AbaModalidades />
              </TabsContent>
              <TabsContent value="turmas" className="mt-4">
                <AbaTurmas />
              </TabsContent>
              <TabsContent value="etapas" className="mt-4">
                <AbaEtapas />
              </TabsContent>
              <TabsContent value="conteudo" className="mt-4">
                <AbaConteudo />
              </TabsContent>
              <TabsContent value="alertas" className="mt-4">
                <AbaAlertas />
              </TabsContent>
              <TabsContent value="encerramento" className="mt-4">
                <AbaEncerramento />
              </TabsContent>
            </Tabs>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <PreviaTrilha />
        </aside>
      </div>
    </div>
  );
}
