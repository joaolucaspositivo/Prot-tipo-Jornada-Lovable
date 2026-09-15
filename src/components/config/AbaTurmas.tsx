import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAvisoImpacto, useCicloConfig } from "./comum";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Macrotema, Modalidade, Turma } from "@/data/types";
import { ROTULO_DIA_SEMANA, novoId, usoDaTurma } from "@/lib/ciclo";

const TODOS = "todos";

type DadosTurma = Omit<Turma, "id" | "vagasOcupadas">;

export function AbaTurmas() {
  const { estado, atualizar } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();
  const config = estado.cicloConfig;
  const turmas = estado.turmas;

  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [turmaEmEdicaoId, setTurmaEmEdicaoId] = useState<string | null>(null);

  const [fMacrotema, setFMacrotema] = useState(TODOS);
  const [fModalidade, setFModalidade] = useState(TODOS);
  const [fDia, setFDia] = useState(TODOS);
  const [fProfessor, setFProfessor] = useState(TODOS);
  const [fHorario, setFHorario] = useState(TODOS);

  const gravar = (lista: Turma[]) =>
    atualizar((anterior) => ({ ...anterior, turmas: lista }));

  const editar = (id: string, mudanca: Partial<Turma>) =>
    gravar(turmas.map((t) => (t.id === id ? { ...t, ...mudanca } : t)));

  const professores = [...new Set(turmas.map((t) => t.professorNome))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const horarios = [...new Set(turmas.map((t) => t.horario))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  const filtradas = turmas.filter(
    (t) =>
      (fMacrotema === TODOS || t.macrotemaId === fMacrotema) &&
      (fModalidade === TODOS || t.modalidadeId === fModalidade) &&
      (fDia === TODOS || t.diasSemana.includes(Number(fDia))) &&
      (fProfessor === TODOS || t.professorNome === fProfessor) &&
      (fHorario === TODOS || t.horario === fHorario),
  );

  function abrirNovo() {
    setTurmaEmEdicaoId(null);
    setDialogoAberto(true);
  }

  function abrirEdicao(turma: Turma) {
    setTurmaEmEdicaoId(turma.id);
    setDialogoAberto(true);
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

  const turmaEmEdicao = turmas.find((t) => t.id === turmaEmEdicaoId);

  function salvar(dados: DadosTurma) {
    if (turmaEmEdicao) {
      const minimo = turmaEmEdicao.vagasOcupadas;
      if (dados.vagas < minimo) {
        toast.error(
          `Não é possível reduzir abaixo de ${minimo} vaga(s): já há docente(s) inscrito(s).`,
        );
        return;
      }
      editar(turmaEmEdicao.id, dados);
    } else {
      // Nova turma no topo da lista — ordem decrescente de criação.
      gravar([{ id: novoId("turma"), vagasOcupadas: 0, ...dados }, ...turmas]);
    }
    setDialogoAberto(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {turmas.length} turma(s). Turmas nascem aqui — o docente só escolhe
          entre as que você criar.
        </p>
        <Button onClick={abrirNovo}>
          <Plus className="size-4" /> Adicionar turma
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Filtro
          rotulo="Macrotema"
          valor={fMacrotema}
          aoMudar={setFMacrotema}
          opcoes={config.macrotemas.map((m) => ({
            valor: m.id,
            rotulo: m.nome,
          }))}
        />
        <Filtro
          rotulo="Modalidade"
          valor={fModalidade}
          aoMudar={setFModalidade}
          opcoes={config.modalidades.map((m) => ({
            valor: m.id,
            rotulo: m.nome,
          }))}
        />
        <Filtro
          rotulo="Dia da semana"
          valor={fDia}
          aoMudar={setFDia}
          opcoes={ROTULO_DIA_SEMANA.map((rotulo, dia) => ({
            valor: String(dia),
            rotulo,
          }))}
        />
        <Filtro
          rotulo="Professor"
          valor={fProfessor}
          aoMudar={setFProfessor}
          opcoes={professores.map((p) => ({ valor: p, rotulo: p }))}
        />
        <Filtro
          rotulo="Horário"
          valor={fHorario}
          aoMudar={setFHorario}
          opcoes={horarios.map((h) => ({ valor: h, rotulo: h }))}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turma</TableHead>
              <TableHead>Macrotema</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Vagas</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead className="w-10" aria-label="Ações" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Nenhuma turma com esses filtros.
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((turma) => {
              const macrotema = config.macrotemas.find(
                (m) => m.id === turma.macrotemaId,
              );
              const modalidade = config.modalidades.find(
                (m) => m.id === turma.modalidadeId,
              );
              return (
                <TableRow key={turma.id}>
                  <TableCell className="font-medium">{turma.nome}</TableCell>
                  <TableCell className="text-sm">
                    {macrotema?.nome ?? "Macrotema removido"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {modalidade?.nome ?? "Modalidade removida"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {turma.professorNome || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        turma.vagasOcupadas >= turma.vagas
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {turma.vagasOcupadas}/{turma.vagas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {turma.horario || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {turma.diasSemana.length > 0
                      ? turma.diasSemana
                          .map((d) => ROTULO_DIA_SEMANA[d])
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Ações de ${turma.nome}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => abrirEdicao(turma)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-atraso focus:text-atraso"
                          onClick={() => remover(turma)}
                        >
                          <Trash2 className="size-4" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DialogoTurma
        aberto={dialogoAberto}
        turma={turmaEmEdicao}
        macrotemas={config.macrotemas}
        modalidades={config.modalidades}
        aoFechar={() => setDialogoAberto(false)}
        aoSalvar={salvar}
      />
      {dialogo}
    </div>
  );
}

function Filtro({
  rotulo,
  valor,
  aoMudar,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
}) {
  return (
    <Select value={valor} onValueChange={aoMudar}>
      <SelectTrigger aria-label={rotulo}>
        <SelectValue placeholder={rotulo} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{rotulo}: todos</SelectItem>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DialogoTurma({
  aberto,
  turma,
  macrotemas,
  modalidades,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  /** presente = edição; ausente = criação */
  turma: Turma | undefined;
  macrotemas: Macrotema[];
  modalidades: Modalidade[];
  aoFechar: () => void;
  aoSalvar: (dados: DadosTurma) => void;
}) {
  const [macrotemaId, setMacrotemaId] = useState("");
  const [modalidadeId, setModalidadeId] = useState("");
  const [nome, setNome] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [professorNome, setProfessorNome] = useState("");
  const [vagas, setVagas] = useState(20);
  const [horario, setHorario] = useState("");
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [encontrosPrevistos, setEncontrosPrevistos] = useState(4);
  const [linkAcesso, setLinkAcesso] = useState("");

  // Recarrega os campos toda vez que o diálogo abre — criação ou edição.
  useEffect(() => {
    if (!aberto) return;
    setMacrotemaId(turma?.macrotemaId ?? macrotemas[0]?.id ?? "");
    setModalidadeId(turma?.modalidadeId ?? modalidades[0]?.id ?? "");
    setNome(turma?.nome ?? "");
    setPeriodo(turma?.periodo ?? "");
    setProfessorNome(turma?.professorNome ?? "");
    setVagas(turma?.vagas ?? 20);
    setHorario(turma?.horario ?? "");
    setDiasSemana(turma?.diasSemana ?? []);
    setEncontrosPrevistos(turma?.encontrosPrevistos ?? 4);
    setLinkAcesso(turma?.linkAcesso ?? "");
  }, [aberto, turma, macrotemas, modalidades]);

  const modalidade = modalidades.find((m) => m.id === modalidadeId);
  const sincrona = modalidade ? !modalidade.presencaAutomatica : false;
  const minimoVagas = turma?.vagasOcupadas ?? 0;

  function alternarDia(dia: number) {
    setDiasSemana((atual) =>
      atual.includes(dia)
        ? atual.filter((d) => d !== dia)
        : [...atual, dia].sort((a, b) => a - b),
    );
  }

  function salvar() {
    if (!nome.trim() || !macrotemaId || !modalidadeId) return;
    aoSalvar({
      nome: nome.trim(),
      macrotemaId,
      modalidadeId,
      periodo,
      professorNome,
      vagas: Math.max(minimoVagas, vagas),
      horario: sincrona ? horario : "",
      diasSemana: sincrona ? diasSemana : [],
      encontrosPrevistos: sincrona ? encontrosPrevistos : 0,
      linkAcesso: sincrona ? linkAcesso || undefined : undefined,
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {turma ? "Editar turma" : "Adicionar turma"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="turma-macrotema">Macrotema</Label>
              <Select
                value={macrotemaId}
                onValueChange={setMacrotemaId}
                disabled={turma !== undefined}
              >
                <SelectTrigger id="turma-macrotema">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {macrotemas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="turma-modalidade">Modalidade</Label>
              <Select
                value={modalidadeId}
                onValueChange={setModalidadeId}
                disabled={turma !== undefined}
              >
                <SelectTrigger id="turma-modalidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modalidades.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="turma-nome">Nome da turma</Label>
              <Input
                id="turma-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Turma A"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="turma-periodo">Período</Label>
              <Input
                id="turma-periodo"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="Manhã, Tarde ou Livre"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="turma-professor">Professor responsável</Label>
              <Input
                id="turma-professor"
                value={professorNome}
                onChange={(e) => setProfessorNome(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="turma-vagas">Vagas</Label>
              <Input
                id="turma-vagas"
                type="number"
                min={minimoVagas}
                value={vagas}
                onChange={(e) =>
                  setVagas(Math.max(0, Number(e.target.value) || 0))
                }
              />
              {minimoVagas > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Mínimo {minimoVagas} — já ocupadas.
                </p>
              ) : null}
            </div>
          </div>

          {sincrona ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="turma-link">Link de acesso ao encontro</Label>
                  <Input
                    id="turma-link"
                    value={linkAcesso}
                    onChange={(e) => setLinkAcesso(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="turma-horario">Horário</Label>
                  <Input
                    id="turma-horario"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    placeholder="ex.: Terças, 8h30 às 10h30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="turma-encontros">Encontros previstos</Label>
                <Input
                  id="turma-encontros"
                  type="number"
                  min={1}
                  value={encontrosPrevistos}
                  onChange={(e) =>
                    setEncontrosPrevistos(
                      Math.max(1, Number(e.target.value) || 1),
                    )
                  }
                  className="max-w-[8rem]"
                />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Dias da semana</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {ROTULO_DIA_SEMANA.map((rotulo, dia) => (
                    <label
                      key={dia}
                      className="flex items-center gap-1.5 text-sm"
                      htmlFor={`turma-dia-${dia}`}
                    >
                      <Checkbox
                        id={`turma-dia-${dia}`}
                        checked={diasSemana.includes(dia)}
                        onCheckedChange={() => alternarDia(dia)}
                      />
                      {rotulo}
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!nome.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
