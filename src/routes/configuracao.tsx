import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { AbaAlertas } from "@/components/config/AbaAlertas";
import { AbaConteudo } from "@/components/config/AbaConteudo";
import { AbaEncerramento } from "@/components/config/AbaEncerramento";
import { AbaEtapas } from "@/components/config/AbaEtapas";
import { AbaGeral } from "@/components/config/AbaGeral";
import { AbaMacrotemas } from "@/components/config/AbaMacrotemas";
import { AbaModalidades } from "@/components/config/AbaModalidades";
import { AbaTurmas } from "@/components/config/AbaTurmas";
import { MesocicloEmEdicaoProvider } from "@/components/config/comum";
import {
  CabecalhoModoGuiado,
  PASSOS_GUIADOS,
  ResumoConferencia,
  type PassoGuiado,
} from "@/components/config/ModoGuiado";
import { PreviaTrilha } from "@/components/config/PreviaTrilha";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { Macrociclo, Mesociclo } from "@/data/types";
import { novaCicloConfigVazia, novoId, passoGuiadoTravado } from "@/lib/ciclo";

export const Route = createFileRoute("/configuracao")({
  head: () => ({
    meta: [
      {
        title: "Configuração de ciclos — Jornada Pedagógica de Desenvolvimento",
      },
      {
        name: "description",
        content:
          "Edição de macrotemas, modalidades, turmas, etapas, conteúdo e alertas de cada ciclo.",
      },
      { property: "og:title", content: "Configuração de ciclos" },
      {
        property: "og:description",
        content:
          "Edição de macrotemas, modalidades, turmas, etapas, conteúdo e alertas de cada ciclo.",
      },
    ],
  }),
  component: ConfiguracaoPage,
});

function ConfiguracaoPage() {
  const { estado, atualizar } = useStore();
  const macrociclo = estado.macrociclos[0]!;
  const mesociclosOrdenados = [...estado.mesociclos].sort((a, b) =>
    a.dataInicio.localeCompare(b.dataInicio),
  );

  const [mesocicloId, setMesocicloId] = useState(macrociclo.mesocicloVigenteId);
  const mesociclo =
    estado.mesociclos.find((m) => m.id === mesocicloId) ??
    mesociclosOrdenados[0]!;
  const config =
    estado.cicloConfigs.find((c) => c.mesocicloId === mesociclo.id) ??
    estado.cicloConfigs[0]!;

  const [guiado, setGuiado] = useState(false);
  const [aba, setAba] = useState<PassoGuiado>("geral");
  const [passosConcluidos, setPassosConcluidos] = useState<Set<PassoGuiado>>(
    new Set(),
  );
  const [dialogoNovoCiclo, setDialogoNovoCiclo] = useState(false);

  function passoTravado(p: PassoGuiado): boolean {
    return guiado && p !== "conferencia" && passoGuiadoTravado(config, p);
  }

  const travadoAgora = passoTravado(aba);
  useEffect(() => {
    if (travadoAgora) setAba("geral");
    // Se o pré-requisito do passo atual deixar de ser cumprido (ex.: a
    // operadora desativa o único tema ativo enquanto está em
    // Modalidades), volta para um passo sempre livre em vez de deixar a
    // tela editável presa atrás de um cadeado.
  }, [travadoAgora]);

  useEffect(() => {
    // Trocar de ciclo pode tornar o passo atual inválido (ex.: Conteúdo
    // num ciclo sem nenhuma etapa ainda) — mesma lógica de trava acima,
    // disparada pela troca em vez da edição.
    if (guiado && aba !== "conferencia" && passoGuiadoTravado(config, aba)) {
      setAba("geral");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesociclo.id]);

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

  function editarMacrociclo(mudanca: Partial<Macrociclo>) {
    atualizar((anterior) => ({
      ...anterior,
      macrociclos: anterior.macrociclos.map((m) =>
        m.id === macrociclo.id ? { ...m, ...mudanca } : m,
      ),
    }));
  }

  function criarCiclo(nome: string, dataInicio: string) {
    const novoMesociclo: Mesociclo = {
      id: novoId("meso"),
      macrocicloId: macrociclo.id,
      nome,
      dataInicio,
      fasesObrigatorias: [],
    };
    const novaConfig = novaCicloConfigVazia(novoMesociclo.id, config.temas);
    atualizar((anterior) => ({
      ...anterior,
      mesociclos: [...anterior.mesociclos, novoMesociclo],
      cicloConfigs: [...anterior.cicloConfigs, novaConfig],
    }));
    setMesocicloId(novoMesociclo.id);
    setDialogoNovoCiclo(false);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Equipe operadora
        </p>
        <h1 className="text-3xl">Configuração de ciclos</h1>
        <p className="text-muted-foreground">
          Tudo o que você edita aqui vale na hora para docentes e coordenadores.
        </p>
        <p className="flex items-center gap-2 text-sm text-sucesso">
          <Check className="size-4" aria-hidden />
          Alterações gravadas automaticamente neste navegador
        </p>
      </header>

      <SecaoJornada macrociclo={macrociclo} aoEditar={editarMacrociclo} />

      <div className="flex flex-wrap items-center gap-2">
        {mesociclosOrdenados.map((m) => (
          <Button
            key={m.id}
            type="button"
            variant={m.id === mesociclo.id ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setMesocicloId(m.id)}
          >
            {m.id === macrociclo.mesocicloVigenteId && (
              <Star className="size-3.5" aria-hidden fill="currentColor" />
            )}
            Ciclo {m.nome}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setDialogoNovoCiclo(true)}
        >
          <Plus className="size-4" /> Novo ciclo
        </Button>
        {mesociclo.id !== macrociclo.mesocicloVigenteId && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() =>
              editarMacrociclo({ mesocicloVigenteId: mesociclo.id })
            }
          >
            Tornar este o ciclo vigente
          </Button>
        )}
      </div>

      <MesocicloEmEdicaoProvider mesocicloId={mesociclo.id}>
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
              <ResumoConferencia />
            ) : (
              <Tabs value={aba} onValueChange={(v) => setAba(v as PassoGuiado)}>
                <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                  <TabsTrigger value="geral" disabled={passoTravado("geral")}>
                    Geral
                  </TabsTrigger>
                  <TabsTrigger value="temas" disabled={passoTravado("temas")}>
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
                  <TabsTrigger
                    value="alertas"
                    disabled={passoTravado("alertas")}
                  >
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
                <TabsContent value="temas" className="mt-4">
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
      </MesocicloEmEdicaoProvider>

      <DialogoNovoCiclo
        aberto={dialogoNovoCiclo}
        aoFechar={() => setDialogoNovoCiclo(false)}
        aoCriar={criarCiclo}
      />
    </div>
  );
}

/** Edição do macrociclo (nome/descrição da jornada) — nunca chamado assim na tela (D39/D40). */
function SecaoJornada({
  macrociclo,
  aoEditar,
}: {
  macrociclo: Macrociclo;
  aoEditar: (mudanca: Partial<Macrociclo>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jornada-nome">Nome da jornada</Label>
          <Input
            id="jornada-nome"
            value={macrociclo.nome}
            onChange={(e) => aoEditar({ nome: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jornada-descricao">Descrição</Label>
          <Textarea
            id="jornada-descricao"
            value={macrociclo.descricao}
            onChange={(e) => aoEditar({ descricao: e.target.value })}
            rows={1}
          />
        </div>
      </div>
    </div>
  );
}

function DialogoNovoCiclo({
  aberto,
  aoFechar,
  aoCriar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoCriar: (nome: string, dataInicio: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setNome("");
    setDataInicio("");
  }, [aberto]);

  function salvar() {
    if (!nome.trim() || !dataInicio) return;
    aoCriar(nome.trim(), new Date(`${dataInicio}T00:00:00.000Z`).toISOString());
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo ciclo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="novo-ciclo-nome">Nome</Label>
            <Input
              id="novo-ciclo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="2028"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="novo-ciclo-inicio">Data de início</Label>
            <Input
              id="novo-ciclo-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="max-w-[12rem]"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            O ciclo nasce vazio — modalidades, turmas e etapas são configuradas
            do zero, sem afetar os demais.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!nome.trim() || !dataInicio}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
