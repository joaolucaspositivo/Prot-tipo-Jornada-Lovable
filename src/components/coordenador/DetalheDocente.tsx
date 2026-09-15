import { useEffect, useState } from "react";
import { CheckCircle2, FileText, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

import { TextoFormatado } from "@/components/entrega/EditorTextoRico";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { Etapa } from "@/data/types";
import { ROTULO_TIPO_ETAPA, formatarData, novoId } from "@/lib/ciclo";
import { formatarDataHora } from "@/lib/conteudo";
import { ROTULO_STATUS_ENTREGA, formatarTamanho } from "@/lib/entrega";
import type { LinhaEquipe } from "@/lib/equipe";
import { historicoDaEtapa } from "@/lib/jornada";

/** Opções de parecer conforme o tipo da etapa configurada. */
function pareceresDaEtapa(etapa: Etapa | undefined): string[] {
  if (!etapa) return [];
  switch (etapa.tipo) {
    case "entrega":
      return ["Atende", "Atende parcialmente", "Não atende"];
    case "encontro":
      return ["Destaque", "Adequado", "A desenvolver"];
    default:
      return [];
  }
}

export function DetalheDocente({
  linha,
  aberto,
  aoFechar,
}: {
  linha: LinhaEquipe | undefined;
  aberto: boolean;
  aoFechar: () => void;
}) {
  const { estado, pessoaAtiva, atualizar } = useStore();
  const [texto, setTexto] = useState("");
  const [parecer, setParecer] = useState("");

  useEffect(() => {
    setTexto("");
    setParecer("");
  }, [linha?.pessoa.id]);

  if (!linha) return <Sheet open={false} onOpenChange={() => aoFechar()} />;

  const entrega = linha.entrega;
  const etapaEntrega = entrega
    ? estado.cicloConfig.etapas.find((e) => e.id === entrega.etapaId)
    : undefined;
  const opcoes = pareceresDaEtapa(etapaEntrega);
  const historico = etapaEntrega
    ? historicoDaEtapa(estado, linha.pessoa, etapaEntrega)
    : [];

  function salvarDevolutiva() {
    if (!entrega || !etapaEntrega) return;
    if (texto.trim().length < 10) {
      toast.error("Escreva a devolutiva antes de salvar.");
      return;
    }
    if (opcoes.length > 0 && !parecer) {
      toast.error("Escolha o parecer desta etapa.");
      return;
    }
    const agora = new Date().toISOString();
    atualizar((anterior) => ({
      ...anterior,
      devolutivas: [
        ...anterior.devolutivas,
        {
          id: novoId("dev"),
          entregaId: entrega.id,
          pessoaId: linha!.pessoa.id,
          autorId: pessoaAtiva.id,
          texto: texto.trim(),
          parecer: parecer || undefined,
          criadaEmISO: agora,
        },
      ],
      entregas: anterior.entregas.map((e) =>
        e.id === entrega.id
          ? { ...e, status: "devolutiva_disponivel" as const }
          : e,
      ),
      progressoEtapas: anterior.progressoEtapas.map((p) =>
        p.pessoaId === linha!.pessoa.id && p.etapaId === etapaEntrega!.id
          ? { ...p, status: "concluida" as const, atualizadoEmISO: agora }
          : p,
      ),
      notificacoes: [
        {
          id: novoId("not"),
          pessoaId: linha!.pessoa.id,
          titulo: "Devolutiva disponível",
          descricao: `${pessoaAtiva.nome} registrou a devolutiva da etapa "${etapaEntrega!.nome}".`,
          criadaEmISO: agora,
          lida: false,
          tipo: "devolutiva" as const,
        },
        ...anterior.notificacoes,
      ],
    }));
    setTexto("");
    setParecer("");
    toast.success("Devolutiva registrada e docente notificado.");
  }

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-xl leading-snug">
            {linha.pessoa.nome}
          </SheetTitle>
          <SheetDescription>
            {linha.tipoParticipacao === "corregente" ? "Corregente" : "Regente"}{" "}
            · {linha.pessoa.unidade}
            {linha.macrotemaNome ? ` · ${linha.macrotemaNome}` : ""}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline">{linha.percentual}% da trilha</Badge>
            {linha.etapaAtual && (
              <Badge variant="outline">Etapa: {linha.etapaAtual.nome}</Badge>
            )}
            {linha.turmaNome && (
              <Badge variant="outline">{linha.turmaNome}</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          <section>
            <h3 className="mb-2 text-base">Entrega do docente</h3>
            {!entrega ? (
              <p className="text-sm text-muted-foreground">
                Este docente ainda não enviou nenhuma entrega.
              </p>
            ) : (
              <div className="space-y-3 rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {etapaEntrega
                      ? `${ROTULO_TIPO_ETAPA[etapaEntrega.tipo]} · ${etapaEntrega.nome}`
                      : "Entrega"}
                  </Badge>
                  <Badge variant="secondary">
                    {ROTULO_STATUS_ENTREGA[entrega.status]}
                  </Badge>
                  {entrega.destino === "equipe_central" && (
                    <Badge variant="outline">Equipe central</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enviada em {formatarDataHora(entrega.enviadaEmISO)}
                  {entrega.dataAulaISO
                    ? ` · Aula a observar: ${formatarDataHora(entrega.dataAulaISO)}`
                    : ""}
                </p>
                <TextoFormatado texto={entrega.texto} />
                {entrega.arquivoNome && (
                  <p className="flex items-center gap-2 rounded-lg bg-muted/40 p-2 text-sm">
                    <FileText className="size-4 text-primary" aria-hidden />
                    {entrega.arquivoNome}
                    <span className="text-muted-foreground">
                      {formatarTamanho(entrega.arquivoTamanho)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </section>

          {entrega && (
            <section>
              <h3 className="mb-2 text-base">Devolutiva</h3>
              {linha.devolutiva ? (
                <div className="space-y-2 rounded-xl border border-border p-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquareQuote className="size-4" aria-hidden />
                    {estado.pessoas.find(
                      (p) => p.id === linha.devolutiva!.autorId,
                    )?.nome ?? "Equipe central"}{" "}
                    · {formatarData(new Date(linha.devolutiva.criadaEmISO))}
                  </p>
                  <p className="text-sm">{linha.devolutiva.texto}</p>
                  {linha.devolutiva.parecer && (
                    <Badge>Parecer: {linha.devolutiva.parecer}</Badge>
                  )}
                  <p className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={
                        linha.devolutiva.cienciaEmISO
                          ? "size-4 text-sucesso"
                          : "size-4 text-muted-foreground"
                      }
                      aria-hidden
                    />
                    {linha.devolutiva.cienciaEmISO
                      ? `Ciência registrada em ${formatarDataHora(linha.devolutiva.cienciaEmISO)}`
                      : "Docente ainda não deu ciência"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <div className="space-y-2">
                    <Label htmlFor="dev-texto">Texto da devolutiva</Label>
                    <Textarea
                      id="dev-texto"
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      placeholder="O que foi bem conduzido e o que pode avançar no próximo passo."
                      className="min-h-32"
                    />
                  </div>
                  {opcoes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Parecer desta etapa</Label>
                      <Select value={parecer} onValueChange={setParecer}>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Escolha o parecer" />
                        </SelectTrigger>
                        <SelectContent>
                          {opcoes.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={salvarDevolutiva}>
                    Salvar devolutiva e concluir etapa
                  </Button>
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="mb-2 text-base">Histórico da etapa</h3>
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem registros nesta etapa até agora.
              </p>
            ) : (
              <ol className="space-y-3 border-l border-border pl-4">
                {historico.map((ev, i) => (
                  <li key={`${ev.quando}-${i}`} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[1.32rem] top-1.5 size-2.5 rounded-full bg-primary"
                    />
                    <p className="text-sm font-medium">{ev.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(new Date(ev.quando))}
                    </p>
                    {ev.detalhe && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ev.detalhe}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-base">Trilha do docente</h3>
            <ul className="space-y-2">
              {linha.trilha.map((item) => (
                <li
                  key={item.etapa.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2"
                >
                  <span className="text-sm">{item.etapa.nome}</span>
                  <span className="flex items-center gap-2">
                    <EstadoBadge status={item.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatarData(item.prazo)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
