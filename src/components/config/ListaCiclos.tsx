import { useEffect, useState } from "react";
import { Check, ChevronRight, Plus, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { Macrociclo, Mesociclo } from "@/data/types";
import { formatarData, novaCicloConfigVazia, novoId } from "@/lib/ciclo";

/**
 * Lista de ciclos — nível acima da configuração de um ciclo específico
 * (Pacote 2B). O seletor de QUAL ciclo e as abas de QUAL PARTE dele são
 * dois níveis de navegação distintos; antes do Pacote 2B os dois eram
 * abas irmãs no mesmo componente, e "Ciclo 2028" parecia irmão de
 * "Turmas" quando na verdade a contém.
 */
export function ListaCiclos({
  aoAbrirCiclo,
}: {
  aoAbrirCiclo: (mesocicloId: string) => void;
}) {
  const { estado, atualizar } = useStore();
  const macrociclo = estado.macrociclos[0]!;
  const mesociclosOrdenados = [...estado.mesociclos].sort((a, b) =>
    a.dataInicio.localeCompare(b.dataInicio),
  );
  const [dialogoNovoCiclo, setDialogoNovoCiclo] = useState(false);

  function editarMacrociclo(mudanca: Partial<Macrociclo>) {
    atualizar((anterior) => ({
      ...anterior,
      macrociclos: anterior.macrociclos.map((m) =>
        m.id === macrociclo.id ? { ...m, ...mudanca } : m,
      ),
    }));
  }

  function tornarVigente(mesocicloId: string) {
    editarMacrociclo({ mesocicloVigenteId: mesocicloId });
  }

  /** Cria o ciclo e permanece na lista — ver nota em ConfiguracaoPage sobre por quê. */
  function criarCiclo(nome: string, dataInicio: string) {
    const novoMesociclo: Mesociclo = {
      id: novoId("meso"),
      macrocicloId: macrociclo.id,
      nome,
      dataInicio,
      fasesObrigatorias: [],
    };
    const novaConfig = novaCicloConfigVazia(novoMesociclo.id);
    atualizar((anterior) => ({
      ...anterior,
      mesociclos: [...anterior.mesociclos, novoMesociclo],
      cicloConfigs: [...anterior.cicloConfigs, novaConfig],
    }));
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {mesociclosOrdenados.length} ciclo(s) nesta jornada.
        </p>
        <Button onClick={() => setDialogoNovoCiclo(true)}>
          <Plus className="size-4" /> Novo ciclo
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ciclo</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Turmas</TableHead>
              <TableHead>Etapas</TableHead>
              <TableHead>Vigente</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mesociclosOrdenados.map((m) => (
              <LinhaCiclo
                key={m.id}
                mesociclo={m}
                vigente={m.id === macrociclo.mesocicloVigenteId}
                aoAbrir={() => aoAbrirCiclo(m.id)}
                aoTornarVigente={() => tornarVigente(m.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <DialogoNovoCiclo
        aberto={dialogoNovoCiclo}
        aoFechar={() => setDialogoNovoCiclo(false)}
        aoCriar={criarCiclo}
      />
    </div>
  );
}

function LinhaCiclo({
  mesociclo,
  vigente,
  aoAbrir,
  aoTornarVigente,
}: {
  mesociclo: Mesociclo;
  vigente: boolean;
  aoAbrir: () => void;
  aoTornarVigente: () => void;
}) {
  const { estado } = useStore();
  const config = estado.cicloConfigs.find(
    (c) => c.mesocicloId === mesociclo.id,
  );
  const totalTurmas = estado.turmas.filter(
    (t) => t.mesocicloId === mesociclo.id,
  ).length;
  const totalEtapas = config?.etapas.length ?? 0;

  return (
    <TableRow
      className="cursor-pointer"
      onClick={aoAbrir}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") aoAbrir();
      }}
    >
      <TableCell className="font-medium">Ciclo {mesociclo.nome}</TableCell>
      <TableCell>{formatarData(new Date(mesociclo.dataInicio))}</TableCell>
      <TableCell>
        {totalTurmas > 0 ? (
          `${totalTurmas} turma(s)`
        ) : (
          <span className="text-muted-foreground">Sem turmas ainda</span>
        )}
      </TableCell>
      <TableCell>
        {totalEtapas > 0 ? (
          `${totalEtapas} etapa(s)`
        ) : (
          <span className="text-muted-foreground">
            Sem etapas configuradas ainda
          </span>
        )}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {vigente ? (
          <Badge className="gap-1 bg-primary text-primary-foreground">
            <Star className="size-3" aria-hidden fill="currentColor" />
            Vigente
          </Badge>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={aoTornarVigente}
          >
            Tornar vigente
          </Button>
        )}
      </TableCell>
      <TableCell>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </TableCell>
    </TableRow>
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
