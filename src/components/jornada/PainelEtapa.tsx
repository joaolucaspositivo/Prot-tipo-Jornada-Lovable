import { Link } from "@tanstack/react-router";
import { CheckCircle2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

import { EstadoBadge } from "@/components/EstadoBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStore } from "@/data/store";
import type { Observacao } from "@/data/types";
import { ROTULO_TIPO_ETAPA, formatarData, novoId } from "@/lib/ciclo";
import {
  ICONE_TIPO_ETAPA,
  devolutivaDaEtapa,
  historicoDaEtapa,
  type ItemTrilha,
} from "@/lib/jornada";

interface Props {
  item: ItemTrilha | undefined;
  aberto: boolean;
  aoFechar: () => void;
}

/** Detalhe da etapa, histórico próprio e devolutiva recebida. */
export function PainelEtapa({ item, aberto, aoFechar }: Props) {
  const { estado, pessoaAtiva, atualizar } = useStore();

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {item && (
          <Conteudo
            item={item}
            historico={historicoDaEtapa(estado, pessoaAtiva, item.etapa)}
            devolutiva={devolutivaDaEtapa(estado, pessoaAtiva, item.etapa)}
            observacao={estado.observacoes.find(
              (o) =>
                o.pessoaId === pessoaAtiva.id &&
                o.etapaId === item.etapa.id &&
                o.realizadaEmISO,
            )}
            aoDarCienciaObservacao={(id) => {
              const agora = new Date().toISOString();
              atualizar((anterior) => ({
                ...anterior,
                observacoes: anterior.observacoes.map((o) =>
                  o.id === id ? { ...o, cienciaEmISO: agora } : o,
                ),
                notificacoes: [
                  {
                    id: novoId("not"),
                    pessoaId: pessoaAtiva.coordenadorId ?? "coord-1",
                    titulo: `${pessoaAtiva.nome} deu ciência do parecer da observação`,
                    descricao: `Etapa "${item.etapa.nome}".`,
                    criadaEmISO: agora,
                    lida: false,
                    tipo: "devolutiva" as const,
                  },
                  ...anterior.notificacoes,
                ],
              }));
              toast.success("Ciência do parecer registrada.");
            }}
            aoDarCiencia={(id) => {
              const agora = new Date().toISOString();
              atualizar((anterior) => ({
                ...anterior,
                devolutivas: anterior.devolutivas.map((d) =>
                  d.id === id ? { ...d, cienciaEmISO: agora } : d,
                ),
                notificacoes: [
                  {
                    id: novoId("not"),
                    pessoaId: pessoaAtiva.coordenadorId ?? "coord-1",
                    titulo: `${pessoaAtiva.nome} deu ciência da devolutiva`,
                    descricao: `Etapa "${item.etapa.nome}".`,
                    criadaEmISO: agora,
                    lida: false,
                    tipo: "devolutiva" as const,
                  },
                  ...anterior.notificacoes,
                ],
              }));
              toast.success("Ciência registrada. Seu coordenador foi avisado.");
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function Conteudo({
  item,
  historico,
  devolutiva,
  observacao,
  aoDarCiencia,
  aoDarCienciaObservacao,
}: {
  item: ItemTrilha;
  historico: ReturnType<typeof historicoDaEtapa>;
  devolutiva: ReturnType<typeof devolutivaDaEtapa>;
  observacao: Observacao | undefined;
  aoDarCiencia: (devolutivaId: string) => void;
  aoDarCienciaObservacao: (observacaoId: string) => void;
}) {
  const { etapa, status, prazo, motivoBloqueio, acao } = item;
  const Icone = ICONE_TIPO_ETAPA[etapa.tipo];

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icone className="size-4" aria-hidden />
          {ROTULO_TIPO_ETAPA[etapa.tipo]}
        </div>
        <SheetTitle className="text-xl leading-snug">{etapa.nome}</SheetTitle>
        <SheetDescription>{etapa.descricao}</SheetDescription>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <EstadoBadge status={status} />
          <Badge variant="outline">Prazo: {formatarData(prazo)}</Badge>
          {!etapa.obrigatoria && <Badge variant="outline">Opcional</Badge>}
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6">
        {motivoBloqueio && (
          <p className="rounded-lg bg-bloqueado-suave p-3 text-sm text-bloqueado">
            {motivoBloqueio}
          </p>
        )}

        {status !== "bloqueada" && acao.para && (
          <Button asChild className="w-full">
            <Link to={acao.para}>{acao.rotulo}</Link>
          </Button>
        )}

        {status !== "bloqueada" && !acao.para && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            O passo a passo desta etapa entra na próxima parte do protótipo.
            Aqui você já acompanha prazo, situação e histórico.
          </p>
        )}

        <section>
          <h3 className="mb-2 text-base">Histórico desta etapa</h3>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há registros nesta etapa.
            </p>
          ) : (
            <ol className="space-y-3 border-l border-border pl-4">
              {historico.map((evento, i) => (
                <li key={`${evento.quando}-${i}`} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[1.32rem] top-1.5 size-2.5 rounded-full bg-primary"
                  />
                  <p className="text-sm font-medium">{evento.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(new Date(evento.quando))}
                  </p>
                  {evento.detalhe && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {evento.detalhe}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-base">Devolutiva recebida</h3>
          {devolutiva ? (
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquareQuote className="size-4" aria-hidden />
                {devolutiva.autorNome} ·{" "}
                {formatarData(new Date(devolutiva.devolutiva.criadaEmISO))}
              </div>
              <p className="text-sm">{devolutiva.devolutiva.texto}</p>
              {devolutiva.devolutiva.parecer && (
                <Badge className="mt-3">
                  Parecer: {devolutiva.devolutiva.parecer}
                </Badge>
              )}
              <div className="mt-3">
                {devolutiva.devolutiva.cienciaEmISO ? (
                  <p className="flex items-center gap-2 text-sm text-sucesso">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Ciência registrada em{" "}
                    {formatarData(new Date(devolutiva.devolutiva.cienciaEmISO))}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => aoDarCiencia(devolutiva.devolutiva.id)}
                  >
                    Registrar ciência da devolutiva
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma devolutiva nesta etapa até agora.
            </p>
          )}
        </section>

        {observacao && (
          <section>
            <h3 className="mb-2 text-base">Parecer da observação de aula</h3>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">
                Aula observada em{" "}
                {formatarData(new Date(observacao.realizadaEmISO!))}
              </p>
              {observacao.comentario && (
                <p className="mt-2 text-sm">{observacao.comentario}</p>
              )}
              <div className="mt-3">
                {observacao.cienciaEmISO ? (
                  <p className="flex items-center gap-2 text-sm text-sucesso">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Ciência registrada em{" "}
                    {formatarData(new Date(observacao.cienciaEmISO))}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => aoDarCienciaObservacao(observacao.id)}
                  >
                    Registrar ciência do parecer
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
