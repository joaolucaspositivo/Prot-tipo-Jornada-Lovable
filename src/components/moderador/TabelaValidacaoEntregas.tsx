import { useState } from "react";
import { CalendarClock } from "lucide-react";

import { DetalheEntregaModerador } from "@/components/moderador/DetalheEntregaModerador";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import type { Turma } from "@/data/types";
import { cicloDaTurma, formatarData, prazoDaEtapa } from "@/lib/ciclo";
import {
  colunasDaEtapa,
  etapasParaValidacao,
  linhasDeValidacao,
  type LinhaValidacao,
  type StatusEntregaDocente,
  type StatusEntregaModerador,
} from "@/lib/moderacao";

const ROTULO_STATUS_DOCENTE: Record<StatusEntregaDocente, string> = {
  pendente: "Pendente",
  entregue: "Entregue",
};

const ROTULO_STATUS_MODERADOR: Record<StatusEntregaModerador, string> = {
  validacao_pendente: "Validação pendente",
  devolutiva_realizada: "Devolutiva realizada",
};

/**
 * Tabela central de "Validar entregas" (D49/D50): escopada a UMA turma e
 * UMA etapa por vez, nunca à trilha inteira. Colunas dinâmicas conforme o
 * conteúdo cadastrado na oferta da etapa — vídeo/texto-base/presença/tarefa
 * só aparecem se houver algo cadastrado (`colunasDaEtapa`).
 */
export function TabelaValidacaoEntregas({ turma }: { turma: Turma }) {
  const { estado } = useStore();
  const etapas = etapasParaValidacao(estado, turma);
  const [etapaIdBruto, setEtapaIdBruto] = useState("");
  const etapaId = etapas.some((e) => e.id === etapaIdBruto)
    ? etapaIdBruto
    : (etapas[0]?.id ?? "");
  const etapa = etapas.find((e) => e.id === etapaId);
  const [pessoaAbertaId, setPessoaAbertaId] = useState<string | null>(null);

  if (etapas.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Nenhuma etapa com conteúdo ou entrega cadastrada para esta turma ainda.
      </div>
    );
  }

  const colunas = etapa ? colunasDaEtapa(estado, turma, etapa) : undefined;
  const linhas = etapa ? linhasDeValidacao(estado, turma, etapa) : [];
  const linhaAberta = linhas.find((l) => l.pessoa.id === pessoaAbertaId);

  // Prazo é da ETAPA selecionada, não da trilha do docente (D49) — mostrado
  // uma vez no cabeçalho, não repetido por linha.
  const { mesociclo, config } = cicloDaTurma(estado, turma);
  const prazo = etapa
    ? prazoDaEtapa(mesociclo.dataInicio, config, etapa)
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="validacao-etapa">Etapa</Label>
          <Select value={etapaId} onValueChange={setEtapaIdBruto}>
            <SelectTrigger id="validacao-etapa" className="h-10 w-64">
              <SelectValue>{etapa?.nome}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {etapas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {prazo && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden />
            Prazo da etapa: {formatarData(prazo)}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Docente</TableHead>
              {colunas?.video && <TableHead>Vídeo visto</TableHead>}
              {colunas?.texto && <TableHead>Texto-base lido</TableHead>}
              {colunas?.presenca && <TableHead>Presença</TableHead>}
              {colunas?.entrega && (
                <>
                  <TableHead>Docente</TableHead>
                  <TableHead>Moderador</TableHead>
                  <TableHead>Nota</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    1 +
                    Number(Boolean(colunas?.video)) +
                    Number(Boolean(colunas?.texto)) +
                    Number(Boolean(colunas?.presenca)) +
                    Number(Boolean(colunas?.entrega)) * 3
                  }
                  className="text-muted-foreground"
                >
                  Nenhum docente inscrito nesta turma ainda.
                </TableCell>
              </TableRow>
            )}
            {linhas.map((linha) => (
              <TableRow
                key={linha.pessoa.id}
                tabIndex={colunas?.entrega ? 0 : undefined}
                className={colunas?.entrega ? "cursor-pointer" : undefined}
                onClick={() =>
                  colunas?.entrega && setPessoaAbertaId(linha.pessoa.id)
                }
                onKeyDown={(e) => {
                  if (!colunas?.entrega) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPessoaAbertaId(linha.pessoa.id);
                  }
                }}
              >
                <TableCell className="font-medium">
                  {linha.pessoa.nome}
                </TableCell>
                {colunas?.video && (
                  <TableCell className="text-sm">
                    {linha.videoDetalhe}
                  </TableCell>
                )}
                {colunas?.texto && (
                  <TableCell className="min-w-28">
                    <Progress value={linha.textoPercentual} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {linha.textoPercentual}%
                    </span>
                  </TableCell>
                )}
                {colunas?.presenca && (
                  <TableCell className="text-sm">
                    {linha.presencaDetalhe}
                  </TableCell>
                )}
                {colunas?.entrega && <ColunasEntrega linha={linha} />}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DetalheEntregaModerador
        turma={turma}
        etapa={etapa}
        linha={linhaAberta}
        aberto={Boolean(linhaAberta)}
        aoFechar={() => setPessoaAbertaId(null)}
      />
    </div>
  );
}

/** Os dois status da entrega, lado a lado na mesma linha (D49): o do
 * docente (pendente/entregue) nunca se confunde com o do moderador
 * (validação pendente/devolutiva realizada). */
function ColunasEntrega({ linha }: { linha: LinhaValidacao }) {
  return (
    <>
      <TableCell>
        {linha.statusDocente && (
          <Badge
            variant={
              linha.statusDocente === "entregue" ? "secondary" : "outline"
            }
          >
            {ROTULO_STATUS_DOCENTE[linha.statusDocente]}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {linha.statusModerador && (
          <Badge
            variant={
              linha.statusModerador === "devolutiva_realizada"
                ? "secondary"
                : "outline"
            }
          >
            {ROTULO_STATUS_MODERADOR[linha.statusModerador]}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-sm">{linha.nota ?? "—"}</TableCell>
    </>
  );
}
