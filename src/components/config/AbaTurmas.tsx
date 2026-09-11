import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCicloConfig, useAvisoImpacto } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Modalidade, Turma } from "@/data/types";
import { novoId, usoDaTurma } from "@/lib/ciclo";

const ROTULO_DIA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AbaTurmas() {
  const { estado, atualizar } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();
  const config = estado.cicloConfig;
  const turmas = estado.turmas;

  const gravar = (lista: Turma[]) =>
    atualizar((anterior) => ({ ...anterior, turmas: lista }));

  const editar = (id: string, mudanca: Partial<Turma>) =>
    gravar(turmas.map((t) => (t.id === id ? { ...t, ...mudanca } : t)));

  function adicionar(macrotemaId: string, modalidadeId: string) {
    const daCombinacao = turmas.filter(
      (t) => t.macrotemaId === macrotemaId && t.modalidadeId === modalidadeId,
    );
    gravar([
      ...turmas,
      {
        id: novoId("turma"),
        nome: `Turma ${String.fromCharCode(65 + daCombinacao.length)}`,
        macrotemaId,
        modalidadeId,
        periodo: "",
        horario: "",
        vagas: 20,
        vagasOcupadas: 0,
        professorNome: "",
        diasSemana: [],
        encontrosPrevistos: 4,
      },
    ]);
  }

  function remover(turma: Turma) {
    const uso = usoDaTurma(estado, turma.id);
    confirmar({
      titulo: `Remover “${turma.nome}”?`,
      descricao: "A turma deixa de ser oferecida na escolha do percurso.",
      precisaAviso: uso.inscricoes > 0,
      impacto: `${uso.inscricoes} docente(s) inscrito(s) perdem o vínculo com esta turma.`,
      rotuloAcao: "Remover",
      aoConfirmar: () => gravar(turmas.filter((t) => t.id !== turma.id)),
    });
  }

  function alterarVagas(turma: Turma, bruto: string) {
    const pretendido = Math.max(0, Number(bruto) || 0);
    const minimo = turma.vagasOcupadas;
    if (pretendido < minimo) {
      toast.error(
        `Não é possível reduzir abaixo de ${minimo} vaga(s): já há docente(s) inscrito(s).`,
      );
    }
    editar(turma.id, { vagas: Math.max(minimo, pretendido) });
  }

  function alternarDia(turma: Turma, dia: number) {
    const marcado = turma.diasSemana.includes(dia);
    editar(turma.id, {
      diasSemana: marcado
        ? turma.diasSemana.filter((d) => d !== dia)
        : [...turma.diasSemana, dia].sort((a, b) => a - b),
    });
  }

  const combinacoes = config.macrotemas
    .flatMap((macrotema) =>
      config.modalidades.map((modalidade) => ({ macrotema, modalidade })),
    )
    .filter(({ macrotema, modalidade }) => {
      const existentes = turmas.some(
        (t) =>
          t.macrotemaId === macrotema.id && t.modalidadeId === modalidade.id,
      );
      return (macrotema.ativo && modalidade.ativa) || existentes;
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {turmas.length} turma(s), agrupadas por macrotema e modalidade. Turmas
        nascem aqui — o docente só escolhe entre as que você criar.
      </p>

      <div className="space-y-6">
        {combinacoes.map(({ macrotema, modalidade }) => {
          const daCombinacao = turmas.filter(
            (t) =>
              t.macrotemaId === macrotema.id &&
              t.modalidadeId === modalidade.id,
          );
          const podeAdicionar = macrotema.ativo && modalidade.ativa;
          return (
            <div
              key={`${macrotema.id}-${modalidade.id}`}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{macrotema.nome}</span>
                  <Badge variant="secondary">{modalidade.nome}</Badge>
                  {!podeAdicionar ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      Macrotema ou modalidade desativado(a)
                    </Badge>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!podeAdicionar}
                  onClick={() => adicionar(macrotema.id, modalidade.id)}
                >
                  <Plus className="size-4" /> Adicionar turma
                </Button>
              </div>

              {daCombinacao.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma turma cadastrada nesta combinação.
                </p>
              ) : (
                <ul className="space-y-3">
                  {daCombinacao.map((turma) => (
                    <CartaoTurma
                      key={turma.id}
                      turma={turma}
                      modalidade={modalidade}
                      aoEditar={(mudanca) => editar(turma.id, mudanca)}
                      aoAlterarVagas={(bruto) => alterarVagas(turma, bruto)}
                      aoAlternarDia={(dia) => alternarDia(turma, dia)}
                      aoRemover={() => remover(turma)}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {dialogo}
    </div>
  );
}

function CartaoTurma({
  turma,
  modalidade,
  aoEditar,
  aoAlterarVagas,
  aoAlternarDia,
  aoRemover,
}: {
  turma: Turma;
  modalidade: Modalidade;
  aoEditar: (mudanca: Partial<Turma>) => void;
  aoAlterarVagas: (bruto: string) => void;
  aoAlternarDia: (dia: number) => void;
  aoRemover: () => void;
}) {
  const sincrona = !modalidade.presencaAutomatica;

  return (
    <li className="rounded-lg border border-border bg-background p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={turma.nome}
          aria-label="Nome da turma"
          onChange={(e) => aoEditar({ nome: e.target.value })}
          className="h-10 max-w-xs flex-1 font-medium"
        />
        <Badge
          variant={
            turma.vagasOcupadas >= turma.vagas ? "destructive" : "secondary"
          }
        >
          {turma.vagasOcupadas} de {turma.vagas} vagas
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`prof-${turma.id}`}>Professor responsável</Label>
          <Input
            id={`prof-${turma.id}`}
            value={turma.professorNome}
            onChange={(e) => aoEditar({ professorNome: e.target.value })}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`vagas-${turma.id}`}>Vagas</Label>
          <Input
            id={`vagas-${turma.id}`}
            type="number"
            min={turma.vagasOcupadas}
            value={turma.vagas}
            onChange={(e) => aoAlterarVagas(e.target.value)}
            className="h-10"
          />
          {turma.vagasOcupadas > 0 ? (
            <p className="text-xs text-muted-foreground">
              Mínimo {turma.vagasOcupadas} — já ocupadas.
            </p>
          ) : null}
        </div>
        {sincrona ? (
          <div className="space-y-1.5">
            <Label htmlFor={`encontros-${turma.id}`}>Encontros previstos</Label>
            <Input
              id={`encontros-${turma.id}`}
              type="number"
              min={1}
              value={turma.encontrosPrevistos}
              onChange={(e) =>
                aoEditar({
                  encontrosPrevistos: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="h-10"
            />
          </div>
        ) : null}
      </div>

      {sincrona ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`link-${turma.id}`}>
                Link de acesso ao encontro
              </Label>
              <Input
                id={`link-${turma.id}`}
                value={turma.linkAcesso ?? ""}
                placeholder="https://..."
                onChange={(e) =>
                  aoEditar({ linkAcesso: e.target.value || undefined })
                }
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`horario-${turma.id}`}>Horário</Label>
              <Input
                id={`horario-${turma.id}`}
                value={turma.horario}
                placeholder="ex.: Terças, 8h30 às 10h30"
                onChange={(e) => aoEditar({ horario: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Dias da semana</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {ROTULO_DIA_SEMANA.map((rotulo, dia) => (
                <label
                  key={dia}
                  className="flex items-center gap-1.5 text-sm"
                  htmlFor={`dia-${turma.id}-${dia}`}
                >
                  <Checkbox
                    id={`dia-${turma.id}-${dia}`}
                    checked={turma.diasSemana.includes(dia)}
                    onCheckedChange={() => aoAlternarDia(dia)}
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <Button
        variant="ghost"
        className="mt-3 text-atraso hover:bg-atraso-suave"
        onClick={aoRemover}
      >
        <Trash2 className="size-4" /> Remover turma
      </Button>
    </li>
  );
}
