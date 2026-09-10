import { Plus, Trash2 } from "lucide-react";

import { ItemArrastavel, useAvisoImpacto, useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { moverItem, novoId, usoDaModalidade } from "@/lib/ciclo";
import type { Modalidade } from "@/data/types";

export function AbaModalidades() {
  const { estado, config, salvarConfig } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();

  const modalidades = config.modalidades;

  const gravar = (lista: Modalidade[]) =>
    salvarConfig((c) => ({ ...c, modalidades: lista }));

  const editar = (id: string, mudanca: Partial<Modalidade>) =>
    gravar(modalidades.map((m) => (m.id === id ? { ...m, ...mudanca } : m)));

  const adicionar = () =>
    gravar([
      ...modalidades,
      {
        id: novoId("mod"),
        nome: `Modalidade ${modalidades.length + 1}`,
        descricao: "",
        ativa: true,
        presencaAutomatica: false,
      },
    ]);

  const remover = (m: Modalidade) => {
    const uso = usoDaModalidade(estado, m.id);
    confirmar({
      titulo: `Remover “${m.nome}”?`,
      descricao: "As turmas desta modalidade deixam de ser ofertadas.",
      precisaAviso: uso.turmas > 0 || uso.inscricoes > 0,
      impacto:
        uso.turmas > 0 || uso.inscricoes > 0
          ? `Modalidade em uso: ${uso.turmas} turma(s) e ${uso.inscricoes} inscrição(ões).`
          : undefined,
      rotuloAcao: "Remover",
      aoConfirmar: () => gravar(modalidades.filter((x) => x.id !== m.id)),
    });
  };

  const alterarPresenca = (m: Modalidade, valor: boolean) =>
    confirmar({
      titulo: "Alterar registro de presença?",
      descricao: valor
        ? "O envio da tarefa passará a registrar presença automaticamente nesta modalidade."
        : "A presença desta modalidade deixará de ser registrada pelo envio da tarefa.",
      precisaAviso: usoDaModalidade(estado, m.id).inscricoes > 0,
      impacto: `${usoDaModalidade(estado, m.id).inscricoes} inscrição(ões) já usam esta modalidade.`,
      rotuloAcao: "Alterar",
      aoConfirmar: () => editar(m.id, { presencaAutomatica: valor }),
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {modalidades.length} modalidade(s). Cada uma define se o envio da
          tarefa gera presença automática.
        </p>
        <Button onClick={adicionar}>
          <Plus className="size-4" /> Adicionar modalidade
        </Button>
      </div>

      <ul className="space-y-3">
        {modalidades.map((m, i) => {
          const uso = usoDaModalidade(estado, m.id);
          return (
            <ItemArrastavel
              key={m.id}
              indice={i}
              total={modalidades.length}
              aoMover={(de, para) => gravar(moverItem(modalidades, de, para))}
              rotulo={m.nome}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={m.nome}
                    aria-label="Nome da modalidade"
                    onChange={(e) => editar(m.id, { nome: e.target.value })}
                    className="h-10 max-w-md flex-1 font-medium"
                  />
                  <Badge variant="secondary">
                    {uso.turmas} turma(s) · {uso.inscricoes} inscrição(ões)
                  </Badge>
                </div>
                <Textarea
                  value={m.descricao}
                  aria-label="Descrição da modalidade"
                  placeholder="Como esta modalidade funciona para o docente"
                  onChange={(e) => editar(m.id, { descricao: e.target.value })}
                  rows={2}
                />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`mod-ativa-${m.id}`}
                      checked={m.ativa}
                      onCheckedChange={(v) => editar(m.id, { ativa: v })}
                    />
                    <Label htmlFor={`mod-ativa-${m.id}`}>
                      {m.ativa ? "Ativa" : "Desativada"}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`mod-presenca-${m.id}`}
                      checked={m.presencaAutomatica}
                      onCheckedChange={(v) => alterarPresenca(m, v)}
                    />
                    <Label htmlFor={`mod-presenca-${m.id}`}>
                      Presença automática pelo envio da tarefa
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    className="ml-auto text-atraso hover:bg-atraso-suave"
                    onClick={() => remover(m)}
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
