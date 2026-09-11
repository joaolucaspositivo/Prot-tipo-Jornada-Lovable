import { Plus, Trash2 } from "lucide-react";

import { useAvisoImpacto, useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CenarioSegmentacao, Segmento } from "@/data/types";
import { etapasDoSegmento, novoId } from "@/lib/ciclo";

const CENARIOS: { valor: CenarioSegmentacao; titulo: string; texto: string }[] =
  [
    {
      valor: "trilha_unica",
      titulo: "Trilha única para todos",
      texto:
        "Todos os segmentos percorrem exatamente as mesmas etapas, na mesma ordem.",
    },
    {
      valor: "trilha_por_segmento",
      titulo: "Trilhas distintas por segmento",
      texto:
        "Cada etapa passa a indicar quais segmentos a enxergam, na aba Etapas da trilha.",
    },
  ];

export function AbaSegmentos() {
  const { estado, config, salvarConfig } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();

  const gravar = (lista: Segmento[]) =>
    salvarConfig((c) => ({ ...c, segmentos: lista }));

  const trocarCenario = (valor: CenarioSegmentacao) =>
    confirmar({
      titulo: "Mudar o cenário de segmentação?",
      descricao:
        "A trilha de todos os docentes é recalculada na hora, sem recarregar.",
      precisaAviso: estado.progressoEtapas.length > 0,
      impacto: `${new Set(estado.progressoEtapas.map((p) => p.pessoaId)).size} docente(s) já têm progresso registrado no ciclo.`,
      rotuloAcao: "Mudar cenário",
      aoConfirmar: () =>
        salvarConfig((c) => ({ ...c, cenarioSegmentacao: valor })),
    });

  const adicionar = () =>
    gravar([
      ...config.segmentos,
      { id: novoId("seg"), nome: `Segmento ${config.segmentos.length + 1}` },
    ]);

  const remover = (s: Segmento) => {
    const pessoas = estado.pessoas.filter((p) => p.segmentoId === s.id).length;
    confirmar({
      titulo: `Remover o segmento “${s.nome}”?`,
      descricao: "Ele deixa de existir na configuração do ciclo.",
      precisaAviso: pessoas > 0,
      impacto: `${pessoas} pessoa(s) estão vinculadas a este segmento.`,
      rotuloAcao: "Remover",
      aoConfirmar: () => {
        gravar(config.segmentos.filter((x) => x.id !== s.id));
        salvarConfig((c) => ({
          ...c,
          etapas: c.etapas.map((e) => ({
            ...e,
            segmentos: e.segmentos.filter((id) => id !== s.id),
          })),
        }));
      },
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-lg">Cenário de segmentação</h3>
          <p className="text-sm text-muted-foreground">
            Nada aqui é definitivo: o cenário pode ser trocado ao vivo.
          </p>
        </div>
        <RadioGroup
          value={config.cenarioSegmentacao}
          onValueChange={(v) => trocarCenario(v as CenarioSegmentacao)}
          className="grid gap-3 md:grid-cols-2"
        >
          {CENARIOS.map((c) => (
            <label
              key={c.valor}
              htmlFor={`cenario-${c.valor}`}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                config.cenarioSegmentacao === c.valor
                  ? "border-primary bg-secondary"
                  : "border-border bg-card"
              }`}
            >
              <RadioGroupItem
                id={`cenario-${c.valor}`}
                value={c.valor}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{c.titulo}</span>
                <span className="block text-sm text-muted-foreground">
                  {c.texto}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg">Segmentos da rede</h3>
          <Button onClick={adicionar}>
            <Plus className="size-4" /> Adicionar segmento
          </Button>
        </div>
        <ul className="space-y-3">
          {config.segmentos.map((s) => {
            const etapas = etapasDoSegmento(config, s.id).length;
            const pessoas = estado.pessoas.filter(
              (p) => p.segmentoId === s.id,
            ).length;
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <Input
                  value={s.nome}
                  aria-label="Nome do segmento"
                  onChange={(e) =>
                    gravar(
                      config.segmentos.map((x) =>
                        x.id === s.id ? { ...x, nome: e.target.value } : x,
                      ),
                    )
                  }
                  className="h-10 max-w-xs flex-1"
                />
                <Badge variant="secondary">{etapas} etapa(s) na trilha</Badge>
                <Badge variant="secondary">{pessoas} pessoa(s)</Badge>
                <Button
                  variant="ghost"
                  className="ml-auto text-atraso hover:bg-atraso-suave"
                  onClick={() => remover(s)}
                >
                  <Trash2 className="size-4" /> Remover
                </Button>
              </li>
            );
          })}
        </ul>
        {config.cenarioSegmentacao === "trilha_unica" ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            <Label className="font-medium">Cenário atual: trilha única.</Label>{" "}
            Os segmentos seguem cadastrados, mas todos veem a mesma sequência de
            etapas.
          </p>
        ) : null}
      </section>
      {dialogo}
    </div>
  );
}
