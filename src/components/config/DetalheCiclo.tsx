import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { AbaConteudo } from "@/components/config/AbaConteudo";
import { AbaEnqueteConfig } from "@/components/config/AbaEnqueteConfig";
import { AbaEtapas } from "@/components/config/AbaEtapas";
import { AbaGeral } from "@/components/config/AbaGeral";
import { AbaModalidades } from "@/components/config/AbaModalidades";
import { AbaPortfolioConfig } from "@/components/config/AbaPortfolioConfig";
import { AbaTemas } from "@/components/config/AbaTemas";
import { AbaTurmas } from "@/components/config/AbaTurmas";
import {
  MesocicloEmEdicaoProvider,
  useCicloConfig,
} from "@/components/config/comum";
import {
  CabecalhoModoGuiado,
  PASSOS_GUIADOS,
  ResumoConferencia,
  type PassoGuiado,
} from "@/components/config/ModoGuiado";
import { PreviaTrilha } from "@/components/config/PreviaTrilha";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { passoGuiadoTravado } from "@/lib/ciclo";

/**
 * Abas da tela — o afunilamento (PassoGuiado) mais "Configurações"
 * (Portfólio, Enquete), que fica fora da sequência de dependência e por
 * isso fora do modo guiado (D57 §5: são bancos de pergunta do ciclo, sem
 * ordem a respeitar entre si nem com o resto).
 */
type AbaConfiguracao = PassoGuiado | "portfolio" | "enquete";

/**
 * Configuração de UM ciclo — nível de baixo da navegação (Pacote 2B). O
 * chamador (`ConfiguracaoPage`) monta este componente com `key={mesocicloId}`:
 * trocar de ciclo remonta do zero em vez de reaproveitar estado, para a
 * aba selecionada e o modo guiado de um ciclo nunca vazarem para o outro.
 */
export function DetalheCiclo({
  mesocicloId,
  nomeCiclo,
  aoVoltar,
}: {
  mesocicloId: string;
  nomeCiclo: string;
  aoVoltar: () => void;
}) {
  return (
    <div className="space-y-4">
      <Migalha nomeCiclo={nomeCiclo} aoVoltar={aoVoltar} />
      <MesocicloEmEdicaoProvider mesocicloId={mesocicloId}>
        <ConteudoDoCiclo />
      </MesocicloEmEdicaoProvider>
    </div>
  );
}

function Migalha({
  nomeCiclo,
  aoVoltar,
}: {
  nomeCiclo: string;
  aoVoltar: () => void;
}) {
  return (
    <nav
      aria-label="Navegação hierárquica"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <button
        type="button"
        onClick={aoVoltar}
        className="hover:text-foreground hover:underline"
      >
        Configuração de ciclos
      </button>
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="text-foreground">Ciclo {nomeCiclo}</span>
    </nav>
  );
}

function ConteudoDoCiclo() {
  const { config, temas } = useCicloConfig();

  const [guiado, setGuiado] = useState(false);
  const [aba, setAba] = useState<AbaConfiguracao>("geral");
  const [passosConcluidos, setPassosConcluidos] = useState<Set<PassoGuiado>>(
    new Set(),
  );

  function passoTravado(p: AbaConfiguracao): boolean {
    return (
      guiado && p !== "conferencia" && passoGuiadoTravado(config, temas, p)
    );
  }

  const travadoAgora = passoTravado(aba);
  useEffect(() => {
    if (travadoAgora) setAba("geral");
    // Se o pré-requisito do passo atual deixar de ser cumprido (ex.: a
    // operadora desativa o único tema ativo enquanto está em
    // Modalidades), volta para um passo sempre livre em vez de deixar a
    // tela editável presa atrás de um cadeado.
  }, [travadoAgora]);

  function alternarGuiado(v: boolean) {
    setGuiado(v);
    if (!v && aba === "conferencia") setAba("conteudo");
  }

  function irParaPasso(p: PassoGuiado) {
    if (passoTravado(p)) return;
    setAba(p);
  }

  function avancar() {
    const indice = (PASSOS_GUIADOS as readonly string[]).indexOf(aba);
    const proximo = PASSOS_GUIADOS[indice + 1];
    if (!proximo || passoTravado(proximo)) return;
    setPassosConcluidos((anterior) =>
      new Set(anterior).add(aba as PassoGuiado),
    );
    setAba(proximo);
  }

  function voltar() {
    const indice = (PASSOS_GUIADOS as readonly string[]).indexOf(aba);
    const anterior = PASSOS_GUIADOS[indice - 1];
    if (anterior) setAba(anterior);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <CabecalhoModoGuiado
          guiado={guiado}
          aoAlternarGuiado={alternarGuiado}
          passoAtual={aba as PassoGuiado}
          passosConcluidos={passosConcluidos}
          passoTravado={passoTravado}
          aoIrParaPasso={irParaPasso}
          aoAvancar={avancar}
          aoVoltar={voltar}
        />

        {aba === "conferencia" ? (
          <ResumoConferencia />
        ) : (
          <Tabs value={aba} onValueChange={(v) => setAba(v as AbaConfiguracao)}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="geral" disabled={passoTravado("geral")}>
                Geral
              </TabsTrigger>
              <TabsTrigger value="temas" disabled={passoTravado("temas")}>
                Temas
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
              <TabsTrigger value="conteudo" disabled={passoTravado("conteudo")}>
                Conteúdo
              </TabsTrigger>
            </TabsList>

            {/* Fora do afunilamento (D57 §5) — só aparece fora do modo
                guiado, que existe para percorrer a sequência com dependência. */}
            {!guiado && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Configurações
                </p>
                <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                  <TabsTrigger value="portfolio">
                    Campos do portfólio
                  </TabsTrigger>
                  <TabsTrigger value="enquete">Enquete 360°</TabsTrigger>
                </TabsList>
              </div>
            )}

            <TabsContent value="geral" className="mt-4">
              <AbaGeral />
            </TabsContent>
            <TabsContent value="temas" className="mt-4">
              <AbaTemas />
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
            <TabsContent value="portfolio" className="mt-4">
              <AbaPortfolioConfig />
            </TabsContent>
            <TabsContent value="enquete" className="mt-4">
              <AbaEnqueteConfig />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <PreviaTrilha />
      </aside>
    </div>
  );
}
