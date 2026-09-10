import { useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";

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
import { ROTULO_TIPO_ETAPA } from "@/lib/ciclo";
import { contadores, linhasDaEquipe } from "@/lib/equipe";
import {
  aplicarFiltro,
  baixarCSV,
  csvDosDocentes,
  funilDeEtapas,
  porMacrotema,
  porSegmento,
  porUnidade,
  type GrupoAgregado,
} from "@/lib/gestao";

const TODOS = "todos";

export function PainelGestaoCiclo() {
  const { estado } = useStore();
  const linhas = useMemo(() => linhasDaEquipe(estado), [estado]);

  const [unidade, setUnidade] = useState(TODOS);
  const [segmento, setSegmento] = useState(TODOS);
  const [macrotema, setMacrotema] = useState(TODOS);
  const [etapa, setEtapa] = useState(TODOS);

  const unidades = [...new Set(linhas.map((l) => l.pessoa.unidade))].sort();

  const filtradas = aplicarFiltro(linhas, {
    unidade: unidade === TODOS ? undefined : unidade,
    segmentoId: segmento === TODOS ? undefined : segmento,
    macrotemaNome: macrotema === TODOS ? undefined : macrotema,
    etapaId: etapa === TODOS ? undefined : etapa,
  });

  const c = contadores(filtradas);
  const funil = funilDeEtapas(estado, filtradas);
  const unidadesAgregadas = porUnidade(filtradas);

  function exportar() {
    baixarCSV(
      `jornada-${estado.cicloConfig.periodo.replace(/\D/g, "")}-docentes.csv`,
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
            rotulo="Segmento"
            valor={segmento}
            aoMudar={setSegmento}
            opcoes={estado.cicloConfig.segmentos.map((s) => ({
              valor: s.id,
              rotulo: s.nome,
            }))}
          />
          <Campo
            rotulo="Macrotema"
            valor={macrotema}
            aoMudar={setMacrotema}
            opcoes={estado.cicloConfig.macrotemas.map((m) => ({
              valor: m.nome,
              rotulo: m.nome,
            }))}
          />
          <Campo
            rotulo="Etapa atual"
            valor={etapa}
            aoMudar={setEtapa}
            opcoes={[...estado.cicloConfig.etapas]
              .sort((a, b) => a.ordem - b.ordem)
              .map((e) => ({ valor: e.id, rotulo: e.nome }))}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil das etapas do ciclo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {funil.map((p) => (
            <div key={p.etapa.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {p.etapa.nome}{" "}
                  <Badge variant="secondary" className="ml-1">
                    {ROTULO_TIPO_ETAPA[p.etapa.tipo]}
                  </Badge>
                </span>

                <p className="text-sm text-muted-foreground">
                  {p.concluidas} concluíram · {p.emAndamento} em andamento ·{" "}
                  {p.naoIniciadas} não começaram
                </p>
              </div>
              <div
                className="mt-1 h-3 w-full overflow-hidden rounded-full bg-secondary"
                role="img"
                aria-label={`${p.etapa.nome}: ${p.percentual}% concluído`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${p.percentual}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Agregado
          titulo="Progresso por segmento"
          grupos={porSegmento(estado, filtradas)}
        />
        <Agregado
          titulo="Progresso por macrotema"
          grupos={porMacrotema(filtradas)}
        />
      </div>

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
        <p className={destaque && valor > 0 ? "text-2xl text-atraso" : "text-2xl"}>
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
