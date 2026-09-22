import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ItemArrastavel } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { Tema } from "@/data/types";
import {
  moverItem,
  novaAuditoria,
  novoId,
  reindexar,
  temasDoMacrociclo,
  usoDoTema,
} from "@/lib/ciclo";

/**
 * Temas do macrociclo (D40) — não vive mais na configuração de um mesociclo
 * específico: o mesmo conjunto vale para todos os ciclos desta jornada.
 */
export function AbaTemas() {
  const { estado, atualizar, pessoaAtiva } = useStore();
  const macrociclo = estado.macrociclos[0]!;

  const temas = [...temasDoMacrociclo(estado, macrociclo.id)].sort(
    (a, b) => a.ordem - b.ordem,
  );

  const gravar = (lista: Tema[]) => {
    const atualizados = reindexar(lista);
    atualizar((anterior) => ({
      ...anterior,
      temas: [
        ...anterior.temas.filter((t) => t.macrocicloId !== macrociclo.id),
        ...atualizados,
      ],
    }));
  };

  const editar = (id: string, mudanca: Partial<Tema>) =>
    gravar(temas.map((m) => (m.id === id ? { ...m, ...mudanca } : m)));

  /** Nome corrigido dentro do mesmo macrociclo (D41): grava com auditoria, sem versão nova. */
  function renomear(id: string, nomeAnterior: string) {
    atualizar((anterior) => ({
      ...anterior,
      auditorias: [
        novaAuditoria("Tema", id, "nome", nomeAnterior, pessoaAtiva.id),
        ...anterior.auditorias,
      ],
    }));
  }

  const adicionar = () =>
    gravar([
      ...temas,
      {
        id: novoId("tema"),
        macrocicloId: macrociclo.id,
        linhagemId: novoId("tema"),
        nome: `Tema ${temas.length + 1}`,
        descricao: "",
        ativo: true,
        ordem: temas.length + 1,
      },
    ]);

  /** Exclusão bloqueada de fato quando há participante vinculado (D41) — não é mais aviso-que-deixa-passar. */
  function remover(m: Tema) {
    const uso = usoDoTema(estado, m.id);
    if (uso.turmas > 0 || uso.inscricoes > 0) {
      toast.error(
        `"${m.nome}" não pode ser excluído: ${uso.turmas} turma(s) e ${uso.inscricoes} inscrição(ões) já vinculadas a ele.`,
      );
      return;
    }
    gravar(temas.filter((x) => x.id !== m.id));
  }

  const mover = (de: number, para: number) =>
    gravar(moverItem(temas, de, para));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {temas.length} tema(s) configurado(s) ·{" "}
          {temas.filter((m) => m.ativo).length} ativo(s). Vale para todos os
          ciclos desta jornada.
        </p>
        <Button onClick={adicionar}>
          <Plus className="size-4" /> Adicionar tema
        </Button>
      </div>

      <ul className="space-y-3">
        {temas.map((m, i) => (
          <LinhaTema
            key={m.id}
            tema={m}
            indice={i}
            total={temas.length}
            uso={usoDoTema(estado, m.id)}
            aoMover={mover}
            aoEditar={(mudanca) => editar(m.id, mudanca)}
            aoRenomear={(nomeAnterior) => renomear(m.id, nomeAnterior)}
            aoRemover={() => remover(m)}
          />
        ))}
      </ul>
    </div>
  );
}

function LinhaTema({
  tema,
  indice,
  total,
  uso,
  aoMover,
  aoEditar,
  aoRenomear,
  aoRemover,
}: {
  tema: Tema;
  indice: number;
  total: number;
  uso: { turmas: number; inscricoes: number };
  aoMover: (de: number, para: number) => void;
  aoEditar: (mudanca: Partial<Tema>) => void;
  aoRenomear: (nomeAnterior: string) => void;
  aoRemover: () => void;
}) {
  // Marca o nome no momento em que o campo ganha foco, para a auditoria
  // registrar a mudança completa da edição (foco → blur), não uma por tecla.
  const [nomeAoFocar, setNomeAoFocar] = useState(tema.nome);

  return (
    <ItemArrastavel
      indice={indice}
      total={total}
      aoMover={aoMover}
      rotulo={tema.nome}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={tema.nome}
            aria-label="Nome do tema"
            onFocus={() => setNomeAoFocar(tema.nome)}
            onChange={(e) => aoEditar({ nome: e.target.value })}
            onBlur={() => {
              if (tema.nome !== nomeAoFocar) aoRenomear(nomeAoFocar);
            }}
            className="h-10 max-w-md flex-1 font-medium"
          />
          <Badge variant="secondary">
            {uso.turmas} turma(s) · {uso.inscricoes} inscrição(ões)
          </Badge>
        </div>
        <Textarea
          value={tema.descricao}
          aria-label="Descrição do tema"
          placeholder="Descrição curta exibida ao docente"
          onChange={(e) => aoEditar({ descricao: e.target.value })}
          rows={2}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`ativo-${tema.id}`}
              checked={tema.ativo}
              onCheckedChange={(v) => aoEditar({ ativo: v })}
            />
            <Label htmlFor={`ativo-${tema.id}`}>
              {tema.ativo ? "Ativo para escolha" : "Desativado"}
            </Label>
          </div>
          <Button
            variant="ghost"
            className="text-atraso hover:bg-atraso-suave"
            onClick={aoRemover}
          >
            <Trash2 className="size-4" /> Remover
          </Button>
        </div>
      </div>
    </ItemArrastavel>
  );
}
