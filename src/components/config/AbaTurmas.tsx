import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAvisoImpacto, useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import type {
  Encontro,
  Modalidade,
  Pessoa,
  Professor,
  Tema,
  Turma,
} from "@/data/types";
import {
  encontrosDaTurma,
  nomeDoProfessor,
  novoId,
  usoDaTurma,
} from "@/lib/ciclo";

const TODOS = "todos";

type DadosTurma = Omit<Turma, "id" | "vagasOcupadas" | "mesocicloId">;

/** Encontro ainda não salvo — `id` só existe quando já era um Encontro real. */
interface RascunhoEncontro {
  id?: string;
  data: string;
  horario: string;
  link: string;
}

export function AbaTurmas() {
  const { estado, atualizar, config, mesociclo, temas } = useCicloConfig();
  const { confirmar, dialogo } = useAvisoImpacto();
  const turmas = estado.turmas.filter((t) => t.mesocicloId === mesociclo.id);

  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [turmaEmEdicaoId, setTurmaEmEdicaoId] = useState<string | null>(null);
  const [moderadorEmEdicaoId, setModeradorEmEdicaoId] = useState<string | null>(
    null,
  );

  const [fTema, setFTema] = useState(TODOS);
  const [fModalidade, setFModalidade] = useState(TODOS);
  const [fProfessor, setFProfessor] = useState(TODOS);

  const remover = (turma: Turma) => {
    const uso = usoDaTurma(estado, turma.id);
    confirmar({
      titulo: `Remover “${turma.nome}”?`,
      descricao: "A turma deixa de ser oferecida na escolha do percurso.",
      precisaAviso: uso.inscricoes > 0,
      impacto: `${uso.inscricoes} docente(s) inscrito(s) perdem o vínculo com esta turma.`,
      rotuloAcao: "Remover",
      aoConfirmar: () =>
        atualizar((anterior) => ({
          ...anterior,
          turmas: anterior.turmas.filter((t) => t.id !== turma.id),
          encontros: anterior.encontros.filter((e) => e.turmaId !== turma.id),
        })),
    });
  };

  const professoresUsados = [...new Set(turmas.map((t) => t.professorId))].sort(
    (a, b) =>
      nomeDoProfessor(estado, a).localeCompare(
        nomeDoProfessor(estado, b),
        "pt-BR",
      ),
  );

  const filtradas = turmas.filter(
    (t) =>
      (fTema === TODOS || t.temaId === fTema) &&
      (fModalidade === TODOS || t.modalidadeId === fModalidade) &&
      (fProfessor === TODOS || t.professorId === fProfessor),
  );

  function abrirNovo() {
    setTurmaEmEdicaoId(null);
    setDialogoAberto(true);
  }

  function abrirEdicao(turma: Turma) {
    setTurmaEmEdicaoId(turma.id);
    setDialogoAberto(true);
  }

  const turmaEmEdicao = turmas.find((t) => t.id === turmaEmEdicaoId);
  const moderadores = estado.pessoas.filter((p) => p.perfil === "moderador");
  const moderadorEmEdicao = moderadores.find(
    (m) => m.id === moderadorEmEdicaoId,
  );

  // D33/D37: turmas de um moderador ficam na própria Pessoa, mas quem edita é
  // a operadora aqui — a base de pessoas continua só leitura quanto ao
  // cadastro (D36), isto é só a atribuição de turmas a quem já é moderador.
  function salvarTurmasDoModerador(moderadorId: string, turmaIds: string[]) {
    atualizar((anterior) => ({
      ...anterior,
      pessoas: anterior.pessoas.map((p) =>
        p.id === moderadorId ? { ...p, turmaIds } : p,
      ),
    }));
    setModeradorEmEdicaoId(null);
  }

  function salvar(dados: DadosTurma, rascunhos: RascunhoEncontro[]) {
    if (turmaEmEdicao) {
      const minimo = turmaEmEdicao.vagasOcupadas;
      if (dados.vagas < minimo) {
        toast.error(
          `Não é possível reduzir abaixo de ${minimo} vaga(s): já há docente(s) inscrito(s).`,
        );
        return;
      }
    }

    const turmaId = turmaEmEdicao?.id ?? novoId("turma");
    const turmaFinal: Turma = {
      id: turmaId,
      mesocicloId: mesociclo.id,
      vagasOcupadas: turmaEmEdicao?.vagasOcupadas ?? 0,
      ...dados,
    };
    const encontrosFinais: Encontro[] = rascunhos.map((r) => ({
      id: r.id ?? novoId("enc"),
      turmaId,
      data: r.data,
      horario: r.horario,
      link: r.link.trim() || undefined,
    }));

    atualizar((anterior) => ({
      ...anterior,
      turmas: turmaEmEdicao
        ? anterior.turmas.map((t) => (t.id === turmaId ? turmaFinal : t))
        : [turmaFinal, ...anterior.turmas],
      encontros: [
        ...anterior.encontros.filter((e) => e.turmaId !== turmaId),
        ...encontrosFinais,
      ],
    }));
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

      <div className="grid gap-2 sm:grid-cols-3">
        <Filtro
          rotulo="Tema"
          valor={fTema}
          aoMudar={setFTema}
          opcoes={temas.map((m) => ({
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
          rotulo="Professor"
          valor={fProfessor}
          aoMudar={setFProfessor}
          opcoes={professoresUsados.map((id) => ({
            valor: id,
            rotulo: nomeDoProfessor(estado, id),
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turma</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Vagas</TableHead>
              <TableHead>Encontros</TableHead>
              <TableHead className="w-10" aria-label="Ações" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Nenhuma turma com esses filtros.
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((turma) => {
              const tema = temas.find((m) => m.id === turma.temaId);
              const modalidade = config.modalidades.find(
                (m) => m.id === turma.modalidadeId,
              );
              const totalEncontros = encontrosDaTurma(estado, turma.id).length;
              return (
                <TableRow key={turma.id}>
                  <TableCell className="font-medium">{turma.nome}</TableCell>
                  <TableCell className="text-sm">
                    {tema?.nome ?? "Tema removido"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {modalidade?.nome ?? "Modalidade removida"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {nomeDoProfessor(estado, turma.professorId)}
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
                    {modalidade?.preveEncontroAoVivo
                      ? `${totalEncontros} encontro(s)`
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moderadores por turma</CardTitle>
          <p className="text-sm text-muted-foreground">
            Escolha, para cada moderador, quais turmas ele acompanha —
            lançamento de presença e validação de entrega (D33).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {moderadores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma pessoa com perfil moderador na base.
            </p>
          ) : (
            moderadores.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.nome}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(m.turmaIds ?? []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Nenhuma turma atribuída
                      </span>
                    ) : (
                      (m.turmaIds ?? []).map((tid) => (
                        <Badge key={tid} variant="secondary">
                          {turmas.find((t) => t.id === tid)?.nome ??
                            "Turma removida"}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModeradorEmEdicaoId(m.id)}
                >
                  Editar turmas
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <DialogoTurma
        aberto={dialogoAberto}
        turma={turmaEmEdicao}
        temas={temas}
        modalidades={config.modalidades}
        professores={estado.professores}
        encontrosAtuais={
          turmaEmEdicao ? encontrosDaTurma(estado, turmaEmEdicao.id) : []
        }
        temaOuModalidadeTravados={
          turmaEmEdicao
            ? usoDaTurma(estado, turmaEmEdicao.id).inscricoes > 0
            : false
        }
        aoFechar={() => setDialogoAberto(false)}
        aoSalvar={salvar}
      />
      <DialogoModeradorTurmas
        aberto={Boolean(moderadorEmEdicao)}
        moderador={moderadorEmEdicao}
        turmas={turmas}
        aoFechar={() => setModeradorEmEdicaoId(null)}
        aoSalvar={salvarTurmasDoModerador}
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
  temas,
  modalidades,
  professores,
  encontrosAtuais,
  temaOuModalidadeTravados,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  /** presente = edição; ausente = criação */
  turma: Turma | undefined;
  temas: Tema[];
  modalidades: Modalidade[];
  professores: Professor[];
  encontrosAtuais: Encontro[];
  /** tema/modalidade já têm participante vinculado — trocar quebraria o histórico (D57 §5) */
  temaOuModalidadeTravados: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: DadosTurma, encontros: RascunhoEncontro[]) => void;
}) {
  const [temaId, setTemaId] = useState("");
  const [modalidadeId, setModalidadeId] = useState("");
  const [nome, setNome] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [vagas, setVagas] = useState(20);
  const [encontros, setEncontros] = useState<RascunhoEncontro[]>([]);
  const [quantidade, setQuantidade] = useState(4);

  // Recarrega os campos toda vez que o diálogo abre — criação ou edição.
  useEffect(() => {
    if (!aberto) return;
    setTemaId(turma?.temaId ?? temas[0]?.id ?? "");
    setModalidadeId(turma?.modalidadeId ?? modalidades[0]?.id ?? "");
    setNome(turma?.nome ?? "");
    setProfessorId(turma?.professorId ?? professores[0]?.id ?? "");
    setVagas(turma?.vagas ?? 20);
    setEncontros(
      encontrosAtuais.map((e) => ({
        id: e.id,
        data: e.data.slice(0, 10),
        horario: e.horario,
        link: e.link ?? "",
      })),
    );
    setQuantidade(4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, turma]);

  const modalidade = modalidades.find((m) => m.id === modalidadeId);
  const sincrona = modalidade?.preveEncontroAoVivo ?? false;
  const minimoVagas = turma?.vagasOcupadas ?? 0;

  function gerarLinhas() {
    setEncontros((atual) => [
      ...atual,
      ...Array.from({ length: Math.max(0, quantidade) }, () => ({
        data: "",
        horario: "",
        link: "",
      })),
    ]);
  }

  function adicionarLinha() {
    setEncontros((atual) => [...atual, { data: "", horario: "", link: "" }]);
  }

  function editarLinha(indice: number, mudanca: Partial<RascunhoEncontro>) {
    setEncontros((atual) =>
      atual.map((e, i) => (i === indice ? { ...e, ...mudanca } : e)),
    );
  }

  function removerLinha(indice: number) {
    setEncontros((atual) => atual.filter((_, i) => i !== indice));
  }

  function salvar() {
    if (!nome.trim() || !temaId || !modalidadeId || !professorId) return;
    aoSalvar(
      {
        nome: nome.trim(),
        temaId,
        modalidadeId,
        professorId,
        vagas: Math.max(minimoVagas, vagas),
      },
      sincrona ? encontros : [],
    );
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
              <Label htmlFor="turma-tema">Tema</Label>
              <Select
                value={temaId}
                onValueChange={setTemaId}
                disabled={temaOuModalidadeTravados}
              >
                <SelectTrigger id="turma-tema">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {temas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {temaOuModalidadeTravados && (
                <p className="text-xs text-muted-foreground">
                  Já há docente inscrito — tema e modalidade não podem mudar.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="turma-modalidade">Modalidade</Label>
              <Select
                value={modalidadeId}
                onValueChange={setModalidadeId}
                disabled={temaOuModalidadeTravados}
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
              <Label htmlFor="turma-professor">Professor responsável</Label>
              <Select value={professorId} onValueChange={setProfessorId}>
                <SelectTrigger id="turma-professor">
                  <SelectValue placeholder="Escolha o professor" />
                </SelectTrigger>
                <SelectContent>
                  {professores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              className="max-w-[8rem]"
            />
            {minimoVagas > 0 ? (
              <p className="text-xs text-muted-foreground">
                Mínimo {minimoVagas} — já ocupadas.
              </p>
            ) : null}
          </div>

          {sincrona ? (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Encontros</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) =>
                      setQuantidade(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="h-9 w-16"
                    aria-label="Quantidade de encontros a gerar"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={gerarLinhas}
                  >
                    Gerar linhas
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={adicionarLinha}
                  >
                    <Plus className="size-4" /> Adicionar um
                  </Button>
                </div>
              </div>

              {encontros.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum encontro ainda. Informe a quantidade e gere as linhas,
                  ou adicione um a um.
                </p>
              ) : (
                <ul className="space-y-2">
                  {encontros.map((enc, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[1fr_1fr_1.5fr_auto] items-end gap-2"
                    >
                      <div className="space-y-1">
                        {i === 0 && (
                          <Label
                            htmlFor={`encontro-data-${i}`}
                            className="text-xs"
                          >
                            Data
                          </Label>
                        )}
                        <Input
                          id={`encontro-data-${i}`}
                          type="date"
                          value={enc.data}
                          onChange={(e) =>
                            editarLinha(i, { data: e.target.value })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        {i === 0 && (
                          <Label
                            htmlFor={`encontro-horario-${i}`}
                            className="text-xs"
                          >
                            Horário
                          </Label>
                        )}
                        <Input
                          id={`encontro-horario-${i}`}
                          value={enc.horario}
                          onChange={(e) =>
                            editarLinha(i, { horario: e.target.value })
                          }
                          placeholder="8h30 às 10h30"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        {i === 0 && (
                          <Label
                            htmlFor={`encontro-link-${i}`}
                            className="text-xs"
                          >
                            Link
                          </Label>
                        )}
                        <Input
                          id={`encontro-link-${i}`}
                          value={enc.link}
                          onChange={(e) =>
                            editarLinha(i, { link: e.target.value })
                          }
                          placeholder="https://..."
                          className="h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Remover encontro ${i + 1}`}
                        onClick={() => removerLinha(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

function DialogoModeradorTurmas({
  aberto,
  moderador,
  turmas,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  moderador: Pessoa | undefined;
  turmas: Turma[];
  aoFechar: () => void;
  aoSalvar: (moderadorId: string, turmaIds: string[]) => void;
}) {
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    if (!aberto) return;
    setSelecionadas(moderador?.turmaIds ?? []);
  }, [aberto, moderador]);

  function alternar(turmaId: string) {
    setSelecionadas((atual) =>
      atual.includes(turmaId)
        ? atual.filter((t) => t !== turmaId)
        : [...atual, turmaId],
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Turmas de {moderador?.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {turmas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma turma cadastrada ainda.
            </p>
          ) : (
            turmas.map((t) => (
              <label
                key={t.id}
                htmlFor={`mod-turma-${t.id}`}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  id={`mod-turma-${t.id}`}
                  checked={selecionadas.includes(t.id)}
                  onCheckedChange={() => alternar(t.id)}
                />
                {t.nome}
              </label>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            onClick={() => moderador && aoSalvar(moderador.id, selecionadas)}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
