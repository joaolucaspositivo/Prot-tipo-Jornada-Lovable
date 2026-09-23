import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, BellRing } from "lucide-react";
import { toast } from "sonner";

import { DetalheDocente } from "@/components/coordenador/DetalheDocente";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { useStore } from "@/data/store";
import { cicloConfigAtivo, formatarData, novoId } from "@/lib/ciclo";
import {
  ROTULO_SITUACAO,
  contadores,
  linhasDaEquipe,
  ordenar,
  type ColunaEquipe,
  type LinhaEquipe,
  type SituacaoDocente,
} from "@/lib/equipe";

const TODOS = "todos";

export function PainelEquipe({
  escopo,
}: {
  escopo: "coordenador" | "operadora" | "diretor" | "moderador";
}) {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const config = cicloConfigAtivo(estado);

  const linhas = useMemo(
    () =>
      linhasDaEquipe(
        estado,
        escopo === "coordenador"
          ? { coordenadorId: pessoaAtiva.id }
          : escopo === "diretor"
            ? { unidade: pessoaAtiva.unidade }
            : escopo === "moderador"
              ? { turmaIds: pessoaAtiva.turmaIds ?? [] }
              : {},
      ),
    [estado, escopo, pessoaAtiva.id, pessoaAtiva.unidade, pessoaAtiva.turmaIds],
  );

  const [fEtapa, setFEtapa] = useState(TODOS);
  const [fSituacao, setFSituacao] = useState(TODOS);
  const [fUnidade, setFUnidade] = useState(TODOS);
  const [fTema, setFTema] = useState(TODOS);
  const [fParticipacao, setFParticipacao] = useState(TODOS);
  const [coluna, setColuna] = useState<ColunaEquipe>("nome");
  const [ascendente, setAscendente] = useState(true);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const unidades = [...new Set(linhas.map((l) => l.pessoa.unidade))].sort();

  const filtradas = linhas.filter(
    (l) =>
      (fEtapa === TODOS || l.etapaAtual?.id === fEtapa) &&
      (fSituacao === TODOS || l.situacao === fSituacao) &&
      (fUnidade === TODOS || l.pessoa.unidade === fUnidade) &&
      (fTema === TODOS || l.temaNome === fTema) &&
      (fParticipacao === TODOS || l.tipoParticipacao === fParticipacao),
  );

  const visiveis = ordenar(filtradas, coluna, ascendente);
  const c = contadores(filtradas);
  const emAlerta = linhas.filter((l) => l.alertaCoordenador);
  const linhaSelecionada = linhas.find((l) => l.pessoa.id === selecionado);

  function ordenarPor(nova: ColunaEquipe) {
    if (nova === coluna) setAscendente((v) => !v);
    else {
      setColuna(nova);
      setAscendente(true);
    }
  }

  function cobrar(alvos: LinhaEquipe[]) {
    if (alvos.length === 0) return;
    const agora = new Date().toISOString();
    atualizar((anterior) => ({
      ...anterior,
      notificacoes: [
        ...alvos.map((l) => ({
          id: novoId("not"),
          pessoaId: l.pessoa.id,
          titulo: "Lembrete do seu coordenador",
          descricao: `${pessoaAtiva.nome} pediu retomada da etapa "${l.etapaAtual?.nome ?? "pendente"}", que está marcada como atrasada.`,
          criadaEmISO: agora,
          lida: false,
          tipo: "pendencia" as const,
        })),
        ...anterior.notificacoes,
      ],
    }));
    toast.success(
      alvos.length === 1
        ? `Lembrete enviado a ${alvos[0]!.pessoa.nome}.`
        : `Lembrete enviado a ${alvos.length} docentes.`,
    );
  }

  return (
    <div className="space-y-5">
      {emAlerta.length > 0 && (
        <Card className="border-atraso/40 bg-atraso-suave">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <AlertTriangle className="size-5 text-atraso" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-atraso">
                {emAlerta.length} docente(s) com etapa atrasada além do limite
                configurado de alerta
              </p>
              <p className="text-sm text-muted-foreground">
                {emAlerta
                  .slice(0, 4)
                  .map(
                    (l) =>
                      `${l.pessoa.nome}${l.diasAtraso > 0 ? ` (${l.diasAtraso}d)` : ""}`,
                  )
                  .join(" · ")}
                {emAlerta.length > 4 ? " …" : ""}
              </p>
            </div>
            <Button size="sm" onClick={() => cobrar(emAlerta)}>
              <BellRing className="size-4" aria-hidden />
              Cobrar todos
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Contador rotulo="Em dia" valor={c.emDia} />
        <Contador rotulo="Pendentes" valor={c.pendentes} />
        <Contador rotulo="Atrasados" valor={c.atrasados} destaque />
        <Contador rotulo="Concluídos" valor={c.concluidos} />
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Filtro
          rotulo="Etapa"
          valor={fEtapa}
          aoMudar={setFEtapa}
          opcoes={[...config.etapas]
            .sort((a, b) => a.ordem - b.ordem)
            .map((e) => ({ valor: e.id, rotulo: e.nome }))}
        />
        <Filtro
          rotulo="Situação"
          valor={fSituacao}
          aoMudar={setFSituacao}
          opcoes={(
            ["em_dia", "pendente", "atrasado", "concluido"] as SituacaoDocente[]
          ).map((s) => ({ valor: s, rotulo: ROTULO_SITUACAO[s] }))}
        />
        <Filtro
          rotulo="Unidade"
          valor={fUnidade}
          aoMudar={setFUnidade}
          opcoes={unidades.map((u) => ({ valor: u, rotulo: u }))}
        />
        <Filtro
          rotulo="Tema"
          valor={fTema}
          aoMudar={setFTema}
          opcoes={estado.temas.map((m) => ({
            valor: m.nome,
            rotulo: m.nome,
          }))}
        />
        <Filtro
          rotulo="Participação"
          valor={fParticipacao}
          aoMudar={setFParticipacao}
          opcoes={[
            { valor: "regente", rotulo: "Regente" },
            { valor: "corregente", rotulo: "Corregente" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <Coluna
                id="nome"
                atual={coluna}
                asc={ascendente}
                aoClicar={ordenarPor}
              >
                Docente
              </Coluna>
              <Coluna
                id="etapa"
                atual={coluna}
                asc={ascendente}
                aoClicar={ordenarPor}
              >
                Etapa atual
              </Coluna>
              <Coluna
                id="progresso"
                atual={coluna}
                asc={ascendente}
                aoClicar={ordenarPor}
              >
                Progresso
              </Coluna>
              <Coluna
                id="pendencias"
                atual={coluna}
                asc={ascendente}
                aoClicar={ordenarPor}
              >
                Pendências
              </Coluna>
              <Coluna
                id="prazo"
                atual={coluna}
                asc={ascendente}
                aoClicar={ordenarPor}
              >
                Prazo mais próximo
              </Coluna>
              <Coluna
                id="situacao"
                atual={coluna}
                asc={ascendente}
                aoClicar={ordenarPor}
              >
                Situação
              </Coluna>
              <TableHead>Ciência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Nenhum docente com esses filtros.
                </TableCell>
              </TableRow>
            )}
            {visiveis.map((l) => (
              <TableRow
                key={l.pessoa.id}
                tabIndex={0}
                role="button"
                className="cursor-pointer"
                onClick={() => setSelecionado(l.pessoa.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelecionado(l.pessoa.id);
                  }
                }}
              >
                <TableCell>
                  <span className="font-medium">{l.pessoa.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {l.pessoa.unidade} ·{" "}
                    {l.tipoParticipacao === "corregente"
                      ? "corregente"
                      : "regente"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {l.temaNome ?? "Sem escolha"} · {l.turmaNome ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {l.etapaAtual?.nome ?? "Trilha concluída"}
                </TableCell>
                <TableCell className="min-w-32">
                  <Progress value={l.percentual} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    {l.concluidas}/{l.total} · {l.percentual}%
                  </span>
                </TableCell>
                <TableCell>{l.pendencias}</TableCell>
                <TableCell className="text-sm">
                  {l.prazoMaisProximo ? formatarData(l.prazoMaisProximo) : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      l.situacao === "atrasado" ? "destructive" : "outline"
                    }
                  >
                    {ROTULO_SITUACAO[l.situacao]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(() => {
                    const devolutivas = l.entregasDoDocente
                      .map((e) => e.devolutiva)
                      .filter((d): d is NonNullable<typeof d> => Boolean(d));
                    if (devolutivas.length === 0) return "—";
                    return devolutivas.some((d) => !d.cienciaEmISO)
                      ? "Aguardando"
                      : "Deu ciência";
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DetalheDocente
        linha={linhaSelecionada}
        aberto={Boolean(linhaSelecionada)}
        aoFechar={() => setSelecionado(null)}
      />
    </div>
  );
}

function Contador({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </p>
        <p
          className={
            destaque && valor > 0 ? "text-2xl text-atraso" : "text-2xl"
          }
        >
          {valor}
        </p>
      </CardContent>
    </Card>
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

function Coluna({
  id,
  atual,
  asc,
  aoClicar,
  children,
}: {
  id: ColunaEquipe;
  atual: ColunaEquipe;
  asc: boolean;
  aoClicar: (c: ColunaEquipe) => void;
  children: React.ReactNode;
}) {
  return (
    <TableHead>
      <button
        type="button"
        className="flex items-center gap-1 text-left"
        onClick={() => aoClicar(id)}
        aria-label={`Ordenar por ${String(children)}`}
      >
        {children}
        <ArrowUpDown
          className={
            atual === id
              ? "size-3.5 text-primary"
              : "size-3.5 text-muted-foreground/60"
          }
          aria-hidden
        />
        {atual === id && (
          <span className="sr-only">{asc ? "crescente" : "decrescente"}</span>
        )}
      </button>
    </TableHead>
  );
}
