import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { ItemArrastavel, useAvisoImpacto, useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type {
  Etapa,
  Subtipo,
  TelaEtapa,
  TipoEtapa,
  TipoParticipacao,
} from "@/data/types";
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

const NOVO_SUBTIPO = "__novo__";

const ROTULO_PARTICIPACAO: Record<TipoParticipacao, string> = {
  regente: "Regente",
  corregente: "Corregente",
};
const TIPOS_PARTICIPACAO: TipoParticipacao[] = ["regente", "corregente"];

export function AbaEtapas() {
  const { estado, config, salvarConfig } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();
  const [subtipoParaCriar, setSubtipoParaCriar] = useState<Etapa | null>(null);

  const etapas = [...config.etapas].sort((a, b) => a.ordem - b.ordem);

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

  /** Trocar o tipo genérico limpa o subtipo — os dois têm que ficar coerentes. */
  function trocarTipo(etapa: Etapa, tipo: TipoEtapa) {
    const primeiroSubtipo = config.subtipos.find(
      (s) => s.tipoGenerico === tipo,
    );
    editarComAviso(
      etapa,
      {
        tipo,
        subtipoId: primeiroSubtipo?.id,
        tela: primeiroSubtipo?.tela ?? etapa.tela,
      },
      "o tipo",
    );
  }

  function escolherSubtipo(etapa: Etapa, subtipoId: string) {
    if (subtipoId === NOVO_SUBTIPO) {
      setSubtipoParaCriar(etapa);
      return;
    }
    const subtipo = config.subtipos.find((s) => s.id === subtipoId);
    if (!subtipo) return;
    editarComAviso(
      etapa,
      { subtipoId: subtipo.id, tela: subtipo.tela },
      "o subtipo",
    );
  }

  function alternarParticipacao(etapa: Etapa, tipo: TipoParticipacao) {
    const marcado = etapa.perfisParticipantes.includes(tipo);
    editarComAviso(
      etapa,
      {
        perfisParticipantes: marcado
          ? etapa.perfisParticipantes.filter((p) => p !== tipo)
          : [...etapa.perfisParticipantes, tipo],
      },
      "quem participa desta etapa",
    );
  }

  function criarSubtipo(novo: Subtipo) {
    salvarConfig((c) => ({ ...c, subtipos: [...c.subtipos, novo] }));
    if (subtipoParaCriar) {
      editar(subtipoParaCriar.id, { subtipoId: novo.id, tela: novo.tela });
    }
    setSubtipoParaCriar(null);
  }

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
        perfisParticipantes: [],
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
          const subtiposDoTipo = config.subtipos.filter(
            (s) => s.tipoGenerico === etapa.tipo,
          );
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
                      onValueChange={(v) => trocarTipo(etapa, v as TipoEtapa)}
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
                    <Label htmlFor={`subtipo-${etapa.id}`}>
                      Formulário/tela (subtipo)
                    </Label>
                    <Select
                      value={etapa.subtipoId ?? ""}
                      onValueChange={(v) => escolherSubtipo(etapa, v)}
                    >
                      <SelectTrigger
                        id={`subtipo-${etapa.id}`}
                        className="h-10"
                      >
                        <SelectValue placeholder="Escolher subtipo">
                          {
                            config.subtipos.find(
                              (s) => s.id === etapa.subtipoId,
                            )?.nome
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {subtiposDoTipo.length === 0 ? (
                          <p className="px-2 py-1.5 text-sm text-muted-foreground">
                            Nenhum subtipo de {ROTULO_TIPO_ETAPA[etapa.tipo]}{" "}
                            ainda.
                          </p>
                        ) : (
                          subtiposDoTipo.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))
                        )}
                        <SelectItem value={NOVO_SUBTIPO}>
                          + Novo subtipo…
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Abre: {ROTULO_TELA_ETAPA[etapa.tela]}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`prazo-${etapa.id}`}>
                      Prazo (dias após o vencimento da etapa anterior)
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

                <div className="rounded-lg border border-dashed border-border p-3">
                  <p className="mb-2 text-sm font-medium">
                    Quem participa desta etapa
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {TIPOS_PARTICIPACAO.map((tipo) => (
                      <div key={tipo} className="flex items-center gap-2">
                        <Checkbox
                          id={`part-${etapa.id}-${tipo}`}
                          checked={etapa.perfisParticipantes.includes(tipo)}
                          onCheckedChange={() =>
                            alternarParticipacao(etapa, tipo)
                          }
                        />
                        <Label htmlFor={`part-${etapa.id}-${tipo}`}>
                          {ROTULO_PARTICIPACAO[tipo]}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Nenhum marcado = etapa vale para regente e corregente.
                  </p>
                </div>

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

      <DialogoNovoSubtipo
        etapa={subtipoParaCriar}
        aoFechar={() => setSubtipoParaCriar(null)}
        aoCriar={criarSubtipo}
      />
      {dialogo}
    </div>
  );
}

/**
 * Cadastro mínimo de subtipo (D30): nome + tipo genérico + a tela que ele
 * abre. A etapa não cria mais o formulário inline — só passa a poder
 * escolher entre subtipos já cadastrados, e este é o jeito de cadastrar um.
 */
function DialogoNovoSubtipo({
  etapa,
  aoFechar,
  aoCriar,
}: {
  etapa: Etapa | null;
  aoFechar: () => void;
  aoCriar: (subtipo: Subtipo) => void;
}) {
  const [nome, setNome] = useState("");
  const [tela, setTela] = useState<TelaEtapa>("painel");

  function salvar() {
    if (!etapa || !nome.trim()) return;
    aoCriar({
      id: novoId("sub"),
      nome: nome.trim(),
      tipoGenerico: etapa.tipo,
      tela,
    });
    setNome("");
    setTela("painel");
  }

  return (
    <Dialog
      open={etapa !== null}
      onOpenChange={(v) => {
        if (!v) {
          setNome("");
          setTela("painel");
          aoFechar();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo subtipo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="subtipo-tipo">Tipo genérico</Label>
            <Input
              id="subtipo-tipo"
              disabled
              value={etapa ? ROTULO_TIPO_ETAPA[etapa.tipo] : ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subtipo-nome">Nome do subtipo</Label>
            <Input
              id="subtipo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Autoavaliação do coordenador"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subtipo-tela">Tela que este subtipo abre</Label>
            <Select value={tela} onValueChange={(v) => setTela(v as TelaEtapa)}>
              <SelectTrigger id="subtipo-tela">
                <SelectValue>{ROTULO_TELA_ETAPA[tela]}</SelectValue>
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!nome.trim()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
