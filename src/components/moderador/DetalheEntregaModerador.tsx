import { useEffect, useState } from "react";
import { CheckCircle2, FileText, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

import { TextoFormatado } from "@/components/entrega/EditorTextoRico";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/data/store";
import type { Etapa } from "@/data/types";
import { ROTULO_TIPO_ETAPA, formatarData, novoId } from "@/lib/ciclo";
import { formatarDataHora } from "@/lib/conteudo";
import {
  ROTULO_STATUS_ENTREGA,
  formatarTamanho,
  pareceresDaEtapa,
} from "@/lib/entrega";
import { historicoDaEtapa } from "@/lib/jornada";
import type { LinhaValidacao } from "@/lib/moderacao";

/**
 * Detalhe da entrega de UM docente numa UMA etapa (D49) — sem "Trilha do
 * docente" nem badges de etapa atual/percentual de trilha, ao contrário do
 * `DetalheDocente` que o coordenador usa. `Dialog` centralizado, não Sheet
 * lateral: entrega longa pede espaço de leitura, não uma faixa estreita.
 */
export function DetalheEntregaModerador({
  turma,
  etapa,
  linha,
  aberto,
  aoFechar,
}: {
  turma: { nome: string };
  etapa: Etapa | undefined;
  linha: LinhaValidacao | undefined;
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

  if (!linha || !etapa)
    return <Dialog open={false} onOpenChange={() => aoFechar()} />;

  // Alias local: `etapa` é prop, e o TS não propaga a checagem acima para
  // dentro de `salvarDevolutiva`, declarada abaixo.
  const etapaAtual = etapa;
  const { entrega, pessoa } = linha;
  const devolutiva = entrega
    ? estado.devolutivas.find((d) => d.entregaId === entrega.id)
    : undefined;
  const opcoes = pareceresDaEtapa(etapa);
  const historico = historicoDaEtapa(estado, pessoa, etapa);

  function salvarDevolutiva() {
    if (!entrega) return;
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
          pessoaId: pessoa.id,
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
        p.pessoaId === pessoa.id && p.etapaId === etapaAtual.id
          ? { ...p, status: "concluida" as const, atualizadoEmISO: agora }
          : p,
      ),
      notificacoes: [
        {
          id: novoId("not"),
          pessoaId: pessoa.id,
          titulo: "Devolutiva disponível",
          descricao: `${pessoaAtiva.nome} registrou a devolutiva da etapa "${etapaAtual.nome}".`,
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
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl leading-snug">
            {pessoa.nome}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
            <Badge variant="outline">
              {ROTULO_TIPO_ETAPA[etapa.tipo]} · {etapa.nome}
            </Badge>
            <span>{turma.nome}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-base">Entrega do docente</h3>
            {!entrega ? (
              <p className="text-sm text-muted-foreground">
                Este docente ainda não enviou esta entrega.
              </p>
            ) : (
              <div className="space-y-3 rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
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
              {devolutiva ? (
                <div className="space-y-2 rounded-xl border border-border p-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquareQuote className="size-4" aria-hidden />
                    {estado.pessoas.find((p) => p.id === devolutiva.autorId)
                      ?.nome ?? "Equipe central"}{" "}
                    · {formatarData(new Date(devolutiva.criadaEmISO))}
                  </p>
                  <p className="text-sm">{devolutiva.texto}</p>
                  {devolutiva.parecer && (
                    <Badge>Parecer: {devolutiva.parecer}</Badge>
                  )}
                  <p className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={
                        devolutiva.cienciaEmISO
                          ? "size-4 text-sucesso"
                          : "size-4 text-muted-foreground"
                      }
                      aria-hidden
                    />
                    {devolutiva.cienciaEmISO
                      ? `Ciência registrada em ${formatarDataHora(devolutiva.cienciaEmISO)}`
                      : "Docente ainda não deu ciência"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <div className="space-y-2">
                    <Label htmlFor="dev-mod-texto">Texto da devolutiva</Label>
                    <Textarea
                      id="dev-mod-texto"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
