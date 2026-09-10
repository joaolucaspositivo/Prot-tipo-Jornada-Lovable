import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight, Info } from "lucide-react";

import { EstadoBadge } from "@/components/EstadoBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROTULO_TIPO_ETAPA, formatarData } from "@/lib/ciclo";
import { ICONE_TIPO_ETAPA, type ItemTrilha } from "@/lib/jornada";
import { cn } from "@/lib/utils";

interface Props {
  itens: ItemTrilha[];
  /** índice até onde o percurso aparece preenchido */
  preenchidoAte: number;
  aoAbrir: (etapaId: string) => void;
}

/** Percurso contínuo e vertical: funciona com 5 ou com 12 etapas, e no celular. */
export function Trilha({ itens, preenchidoAte, aoAbrir }: Props) {
  return (
    <ol className="relative space-y-3">
      {/* linha do percurso */}
      <span
        aria-hidden
        className="absolute left-[1.4rem] top-4 bottom-4 w-1 rounded-full bg-muted"
      />
      <span
        aria-hidden
        className="absolute left-[1.4rem] top-4 w-1 rounded-full bg-primary transition-all"
        style={{
          height:
            itens.length > 1
              ? `${(Math.max(preenchidoAte, 0) / (itens.length - 1)) * 100}%`
              : "0%",
          maxHeight: "calc(100% - 2rem)",
        }}
      />

      {itens.map((item, i) => (
        <EtapaDaTrilha
          key={item.etapa.id}
          item={item}
          numero={i + 1}
          alcancada={i <= preenchidoAte}
          aoAbrir={aoAbrir}
        />
      ))}
    </ol>
  );
}

function EtapaDaTrilha({
  item,
  numero,
  alcancada,
  aoAbrir,
}: {
  item: ItemTrilha;
  numero: number;
  alcancada: boolean;
  aoAbrir: (etapaId: string) => void;
}) {
  const { etapa, status, prazo, motivoBloqueio, acao } = item;
  const Icone = ICONE_TIPO_ETAPA[etapa.tipo];
  const bloqueada = status === "bloqueada";

  return (
    <li className="relative flex gap-3 sm:gap-4">
      <span
        className={cn(
          "z-10 mt-4 flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-card",
          alcancada ? "border-primary text-primary" : "border-border text-muted-foreground",
        )}
      >
        <Icone className="size-5" aria-hidden />
      </span>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-2xl border bg-card p-4 shadow-sm",
          status === "atrasada" && "border-atraso/40",
          bloqueada && "bg-muted/40",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Etapa {numero} · {ROTULO_TIPO_ETAPA[etapa.tipo]}
            </p>
            <h3 className="text-base leading-snug">{etapa.nome}</h3>
          </div>
          <EstadoBadge status={status} />
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{etapa.descricao}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-4" aria-hidden />
            Prazo: {formatarData(prazo)}
          </span>
          {!etapa.obrigatoria && <Badge variant="outline">Opcional</Badge>}
        </div>

        {motivoBloqueio && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-bloqueado-suave p-2.5 text-sm text-bloqueado">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {motivoBloqueio}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {!bloqueada && acao.para ? (
            <Button asChild size="sm">
              <Link to={acao.para}>{acao.rotulo}</Link>
            </Button>
          ) : (
            <Button
              size="sm"
              variant={bloqueada ? "outline" : "default"}
              onClick={() => aoAbrir(etapa.id)}
            >
              {acao.rotulo}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => aoAbrir(etapa.id)}
            className="gap-1"
          >
            Detalhes e histórico
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
