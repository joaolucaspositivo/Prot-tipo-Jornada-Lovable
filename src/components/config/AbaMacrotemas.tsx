import { Plus, Trash2 } from "lucide-react";

import { ItemArrastavel, useAvisoImpacto, useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { moverItem, novoId, reindexar, usoDoTema } from "@/lib/ciclo";
import type { Tema } from "@/data/types";

export function AbaMacrotemas() {
  const { estado, config, salvarConfig } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();

  const temas = [...config.temas].sort((a, b) => a.ordem - b.ordem);

  const gravar = (lista: Tema[]) =>
    salvarConfig((c) => ({ ...c, temas: reindexar(lista) }));

  const editar = (id: string, mudanca: Partial<Tema>) =>
    gravar(temas.map((m) => (m.id === id ? { ...m, ...mudanca } : m)));

  const adicionar = () =>
    gravar([
      ...temas,
      {
        id: novoId("mt"),
        linhagemId: novoId("mt"),
        nome: `Macrotema ${temas.length + 1}`,
        descricao: "",
        ativo: true,
        ordem: temas.length + 1,
      },
    ]);

  const remover = (m: Tema) => {
    const uso = usoDoTema(estado, m.id);
    confirmar({
      titulo: `Remover “${m.nome}”?`,
      descricao:
        "O macrotema deixa de aparecer na escolha do percurso do docente imediatamente.",
      precisaAviso: uso.turmas > 0 || uso.inscricoes > 0,
      impacto:
        uso.turmas > 0 || uso.inscricoes > 0
          ? `Este macrotema está em uso: ${uso.turmas} turma(s) e ${uso.inscricoes} inscrição(ões) já registradas. Essas pessoas ficarão sem percurso vinculado.`
          : undefined,
      rotuloAcao: "Remover",
      aoConfirmar: () => gravar(temas.filter((x) => x.id !== m.id)),
    });
  };

  const mover = (de: number, para: number) =>
    gravar(moverItem(temas, de, para));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {temas.length} macrotema(s) configurado(s) ·{" "}
          {temas.filter((m) => m.ativo).length} ativo(s). A quantidade é livre.
        </p>
        <Button onClick={adicionar}>
          <Plus className="size-4" /> Adicionar macrotema
        </Button>
      </div>

      <ul className="space-y-3">
        {temas.map((m, i) => {
          const uso = usoDoTema(estado, m.id);
          return (
            <ItemArrastavel
              key={m.id}
              indice={i}
              total={temas.length}
              aoMover={mover}
              rotulo={m.nome}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={m.nome}
                    aria-label="Nome do macrotema"
                    onChange={(e) => editar(m.id, { nome: e.target.value })}
                    className="h-10 max-w-md flex-1 font-medium"
                  />
                  <Badge variant="secondary">
                    {uso.turmas} turma(s) · {uso.inscricoes} inscrição(ões)
                  </Badge>
                </div>
                <Textarea
                  value={m.descricao}
                  aria-label="Descrição do macrotema"
                  placeholder="Descrição curta exibida ao docente"
                  onChange={(e) => editar(m.id, { descricao: e.target.value })}
                  rows={2}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`ativo-${m.id}`}
                      checked={m.ativo}
                      onCheckedChange={(v) => editar(m.id, { ativo: v })}
                    />
                    <Label htmlFor={`ativo-${m.id}`}>
                      {m.ativo ? "Ativo para escolha" : "Desativado"}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-atraso hover:bg-atraso-suave"
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
