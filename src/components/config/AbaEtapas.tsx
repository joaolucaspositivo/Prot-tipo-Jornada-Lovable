import { Plus, Trash2 } from "lucide-react";

import { ItemArrastavel, useAvisoImpacto, useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Etapa, TelaEtapa, TipoEtapa } from "@/data/types";
import {
  ROTULO_TELA_ETAPA,
  ROTULO_TIPO_ETAPA,
  TELAS_ETAPA,
  TIPOS_ETAPA,
  docentesComProgressoNaEtapa,
  formatarData,
  moverItem,
  novoId,
  prazoDaEtapa,
  reindexar,
} from "@/lib/ciclo";

export function AbaEtapas() {
  const { estado, config, salvarConfig } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();

  const etapas = [...config.etapas].sort((a, b) => a.ordem - b.ordem);
  const porSegmento = config.cenarioSegmentacao === "trilha_por_segmento";

  const gravar = (lista: Etapa[]) =>
    salvarConfig((c) => ({ ...c, etapas: reindexar(lista) }));

  const editar = (id: string, mudanca: Partial<Etapa>) =>
    gravar(etapas.map((e) => (e.id === id ? { ...e, ...mudanca } : e)));

  const editarComAviso = (
    etapa: Etapa,
    mudanca: Partial<Etapa>,
    oQue: string,
  ) => {
    const afetados = docentesComProgressoNaEtapa(estado, etapa.id);
    confirmar({
      titulo: `Alterar ${oQue} de “${etapa.nome}”?`,
      descricao:
        "A mudança aparece na hora para docentes e coordenadores, sem recarregar.",
      precisaAviso: afetados > 0,
      impacto: `${afetados} docente(s) já têm progresso registrado nesta etapa.`,
      rotuloAcao: "Alterar",
      aoConfirmar: () => editar(etapa.id, mudanca),
    });
  };

  const adicionar = () =>
    gravar([
      ...etapas,
      {
        id: novoId("etapa"),
        nome: `Etapa ${etapas.length + 1}`,
        descricao: "",
        tipo: "conteudo",
        ordem: etapas.length + 1,
        obrigatoria: true,
        prazoDias: 30 * (etapas.length + 1),
        segmentos: [],
        alerta: {
          diasAntes: 3,
          noVencimento: true,
          diasParaCoordenador: 3,
          alertarDocente: true,
        },
        tela: "conteudo",
      },
    ]);

  const remover = (etapa: Etapa) => {
    const afetados = docentesComProgressoNaEtapa(estado, etapa.id);
    confirmar({
      titulo: `Remover “${etapa.nome}”?`,
      descricao: "A etapa some da trilha do docente imediatamente.",
      precisaAviso: afetados > 0,
      impacto: `${afetados} docente(s) já registraram progresso nesta etapa. O histórico deles fica órfão.`,
      rotuloAcao: "Remover",
      aoConfirmar: () => gravar(etapas.filter((e) => e.id !== etapa.id)),
    });
  };

  const alternarSegmento = (etapa: Etapa, segmentoId: string) => {
    const marcado = etapa.segmentos.includes(segmentoId);
    editar(etapa.id, {
      segmentos: marcado
        ? etapa.segmentos.filter((s) => s !== segmentoId)
        : [...etapa.segmentos, segmentoId],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {etapas.length} etapa(s). Arraste pelo punho ou use as setas para
          reordenar.
        </p>
        <Button onClick={adicionar}>
          <Plus className="size-4" /> Adicionar etapa
        </Button>
      </div>

      <ul className="space-y-3">
        {etapas.map((etapa, i) => {
          const afetados = docentesComProgressoNaEtapa(estado, etapa.id);
          return (
            <ItemArrastavel
              key={etapa.id}
              indice={i}
              total={etapas.length}
              aoMover={(de, para) => gravar(moverItem(etapas, de, para))}
              rotulo={etapa.nome}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={etapa.nome}
                    aria-label="Nome da etapa"
                    onChange={(e) => editar(etapa.id, { nome: e.target.value })}
                    className="h-10 max-w-md flex-1 font-medium"
                  />
                  {afetados > 0 ? (
                    <Badge variant="secondary">
                      {afetados} docente(s) com progresso
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`tipo-${etapa.id}`}>Tipo da etapa</Label>
                    <Select
                      value={etapa.tipo}
                      onValueChange={(v) =>
                        editarComAviso(
                          etapa,
                          { tipo: v as TipoEtapa },
                          "o tipo",
                        )
                      }
                    >
                      <SelectTrigger id={`tipo-${etapa.id}`} className="h-10">
                        <SelectValue>
                          {ROTULO_TIPO_ETAPA[etapa.tipo]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_ETAPA.map((t) => (
                          <SelectItem key={t} value={t}>
                            {ROTULO_TIPO_ETAPA[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`tela-${etapa.id}`}>
                      Tela que esta etapa abre para o docente
                    </Label>
                    <Select
                      value={etapa.tela}
                      onValueChange={(v) =>
                        editarComAviso(
                          etapa,
                          { tela: v as TelaEtapa },
                          "a tela desta etapa",
                        )
                      }
                    >
                      <SelectTrigger id={`tela-${etapa.id}`} className="h-10">
                        <SelectValue>
                          {ROTULO_TELA_ETAPA[etapa.tela]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TELAS_ETAPA.map((t) => (
                          <SelectItem key={t} value={t}>
                            {ROTULO_TELA_ETAPA[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`prazo-${etapa.id}`}>
                      Prazo (dias após a abertura do ciclo)
                    </Label>
                    <Input
                      id={`prazo-${etapa.id}`}
                      type="number"
                      min={0}
                      value={etapa.prazoDias}
                      onChange={(e) =>
                        editar(etapa.id, {
                          prazoDias: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Vence em {formatarData(prazoDaEtapa(config, etapa))}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`carga-${etapa.id}`}>
                      Carga horária (opcional)
                    </Label>
                    <Input
                      id={`carga-${etapa.id}`}
                      type="number"
                      min={0}
                      placeholder="Sem carga horária declarada"
                      value={etapa.cargaHoraria ?? ""}
                      onChange={(e) => {
                        const bruto = e.target.value;
                        editar(etapa.id, {
                          cargaHoraria:
                            bruto === ""
                              ? undefined
                              : Math.max(0, Number(bruto) || 0),
                        });
                      }}
                      className="h-10"
                    />
                  </div>
                </div>

                <Textarea
                  value={etapa.descricao}
                  aria-label="Descrição exibida ao docente"
                  placeholder="Descrição curta exibida ao docente na trilha"
                  onChange={(e) =>
                    editar(etapa.id, { descricao: e.target.value })
                  }
                  rows={2}
                />

                {porSegmento ? (
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <p className="mb-2 text-sm font-medium">
                      Segmentos que veem esta etapa
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {config.segmentos.map((s) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`seg-${etapa.id}-${s.id}`}
                            checked={etapa.segmentos.includes(s.id)}
                            onCheckedChange={() =>
                              alternarSegmento(etapa, s.id)
                            }
                          />
                          <Label htmlFor={`seg-${etapa.id}-${s.id}`}>
                            {s.nome}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Nenhum marcado = etapa vale para todos os segmentos.
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`obr-${etapa.id}`}
                      checked={etapa.obrigatoria}
                      onCheckedChange={(v) =>
                        editarComAviso(
                          etapa,
                          { obrigatoria: v },
                          "a obrigatoriedade",
                        )
                      }
                    />
                    <Label htmlFor={`obr-${etapa.id}`}>
                      {etapa.obrigatoria ? "Obrigatória" : "Opcional"}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    className="ml-auto text-atraso hover:bg-atraso-suave"
                    onClick={() => remover(etapa)}
                  >
                    <Trash2 className="size-4" /> Remover
                  </Button>
                </div>
              </div>
            </ItemArrastavel>
          );
        })}
      </ul>
      {dialogo}
    </div>
  );
}
