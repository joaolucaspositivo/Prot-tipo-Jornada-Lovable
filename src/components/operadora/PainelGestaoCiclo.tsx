import { useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";

import { FunilEtapas } from "@/components/acompanhamento/FunilEtapas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cicloConfigAtivo } from "@/lib/ciclo";
import { contadores, linhasDaEquipe } from "@/lib/equipe";
import {
  aplicarFiltro,
  baixarCSV,
  csvDosDocentes,
  pendenciasDeAlocacao,
  porTema,
  porUnidade,
  type GrupoAgregado,
} from "@/lib/gestao";

const TODOS = "todos";

export function PainelGestaoCiclo() {
  const { estado } = useStore();
  const config = cicloConfigAtivo(estado);
  const linhas = useMemo(() => linhasDaEquipe(estado), [estado]);

  const [unidade, setUnidade] = useState(TODOS);
  const [tema, setTema] = useState(TODOS);
  const [etapa, setEtapa] = useState(TODOS);
  const [comLider, setComLider] = useState(TODOS);

  const unidades = [...new Set(linhas.map((l) => l.pessoa.unidade))].sort();

  const filtradas = aplicarFiltro(estado, linhas, {
    unidade: unidade === TODOS ? undefined : unidade,
    temaNome: tema === TODOS ? undefined : tema,
    etapaId: etapa === TODOS ? undefined : etapa,
    comLider: comLider === TODOS ? undefined : comLider === "sim",
  });

  const c = contadores(filtradas);
  const unidadesAgregadas = porUnidade(filtradas);
  // Pendência de alocação (D35/D37): sinal de qualidade da base, não do
  // recorte atual — sempre sobre todo mundo, mesmo com filtros aplicados.
  const pendenciasAlocacao = pendenciasDeAlocacao(estado);

  function exportar() {
    baixarCSV(
      `jornada-${config.periodo.replace(/\D/g, "")}-docentes.csv`,
      csvDosDocentes(filtradas),
    );
    toast.success(
      `Exportação simulada gerada com ${filtradas.length} docente(s).`,
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Filter className="mb-2 size-4 text-muted-foreground" aria-hidden />
          <Campo
            rotulo="Unidade"
            valor={unidade}
            aoMudar={setUnidade}
            opcoes={unidades.map((u) => ({ valor: u, rotulo: u }))}
          />
          <Campo
            rotulo="Tema"
            valor={tema}
            aoMudar={setTema}
            opcoes={estado.temas.map((m) => ({
              valor: m.nome,
              rotulo: m.nome,
            }))}
          />
          <Campo
            rotulo="Etapa atual"
            valor={etapa}
            aoMudar={setEtapa}
            opcoes={[...config.etapas]
              .sort((a, b) => a.ordem - b.ordem)
              .map((e) => ({ valor: e.id, rotulo: e.nome }))}
          />
          <Campo
            rotulo="Liderado"
            valor={comLider}
            aoMudar={setComLider}
            opcoes={[
              { valor: "sim", rotulo: "Com líder" },
              { valor: "nao", rotulo: "Sem líder" },
            ]}
          />
          <Button variant="outline" onClick={exportar} className="ml-auto">
            <Download className="size-4" aria-hidden />
            Exportar (simulado)
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Indicador rotulo="Docentes" valor={filtradas.length} />
        <Indicador rotulo="Em dia" valor={c.emDia} />
        <Indicador rotulo="Pendentes" valor={c.pendentes} />
        <Indicador rotulo="Atrasados" valor={c.atrasados} destaque />
        <Indicador rotulo="Concluídos" valor={c.concluidos} />
      </div>

      <FunilEtapas estado={estado} linhas={filtradas} />

      <Agregado titulo="Progresso por tema" grupos={porTema(filtradas)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pendências por unidade</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade</TableHead>
                <TableHead>Docentes</TableHead>
                <TableHead>Progresso médio</TableHead>
                <TableHead>Atrasados</TableHead>
                <TableHead>Concluídos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidadesAgregadas.map((g) => (
                <TableRow key={g.chave}>
                  <TableCell className="font-medium">{g.rotulo}</TableCell>
                  <TableCell>{g.docentes}</TableCell>
                  <TableCell className="min-w-32">
                    <Progress value={g.percentualMedio} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {g.percentualMedio}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {g.atrasados > 0 ? (
                      <Badge variant="destructive">{g.atrasados}</Badge>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>{g.concluidos}</TableCell>
                </TableRow>
              ))}
              {unidadesAgregadas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Nenhum docente com esses filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Coordenadores sem liderados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendenciasAlocacao.coordenadoresSemLiderados.length === 0 ? (
              <p className="text-sm text-sucesso">
                Todos os coordenadores já alocaram pelo menos um docente.
              </p>
            ) : (
              <ul className="space-y-2">
                {pendenciasAlocacao.coordenadoresSemLiderados.map((coord) => (
                  <li key={coord.id} className="text-sm">
                    <span className="font-medium">{coord.nome}</span>{" "}
                    <span className="text-muted-foreground">
                      · {coord.unidade}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Docentes sem líder</CardTitle>
          </CardHeader>
          <CardContent>
            {pendenciasAlocacao.docentesSemLider.length === 0 ? (
              <p className="text-sm text-sucesso">
                Todos os docentes já têm ao menos um líder.
              </p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {pendenciasAlocacao.docentesSemLider.map((d) => (
                  <li key={d.id} className="text-sm">
                    <span className="font-medium">{d.nome}</span>{" "}
                    <span className="text-muted-foreground">· {d.unidade}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Agregado({
  titulo,
  grupos,
}: {
  titulo: string;
  grupos: GrupoAgregado[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {grupos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada a mostrar aqui.</p>
        ) : (
          <ul className="space-y-3">
            {grupos.map((g) => (
              <li key={g.chave}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{g.rotulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.docentes} docente(s) · {g.atrasados} atrasado(s)
                  </p>
                </div>
                <Progress value={g.percentualMedio} className="mt-1 h-2" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Indicador({
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

function Campo({
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
    <div className="w-full sm:w-48">
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
    </div>
  );
}
