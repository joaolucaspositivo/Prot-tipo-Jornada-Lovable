import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Eye,
  Flag,
  MessagesSquare,
  Notebook,
  Upload,
  Users,
} from "lucide-react";

import { useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import type { TipoEtapa } from "@/data/types";
import {
  ROTULO_TIPO_ETAPA,
  etapasEmOrdem,
  formatarData,
  prazoDaEtapa,
  temasAtivos,
} from "@/lib/ciclo";

const ICONE_TIPO: Record<TipoEtapa, typeof BookOpen> = {
  escolha: ClipboardCheck,
  autoavaliacao: ClipboardList,
  conteudo: BookOpen,
  encontro: Users,
  entrega: Upload,
  enquete: MessagesSquare,
  portfolio: Notebook,
  encerramento: Flag,
};

/** Pré-visualização da trilha exatamente como o docente a verá. */
export function PreviaTrilha() {
  const { config, mesociclo, temas: temasDoCiclo } = useCicloConfig();
  const etapas = etapasEmOrdem(config);
  const temas = temasAtivos(temasDoCiclo);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Eye className="size-4 text-primary" aria-hidden />
        <h2 className="text-base">Como o docente verá</h2>
      </div>

      <div className="mb-4 rounded-lg bg-secondary p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Escolha do percurso
        </p>
        <p className="text-sm">{temas.length} tema(s) disponível(is)</p>
        <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
          {temas.map((m) => (
            <li key={m.id}>· {m.nome}</li>
          ))}
          {temas.length === 0 ? (
            <li className="text-atraso">
              Nenhum tema ativo: o docente não terá o que escolher.
            </li>
          ) : null}
        </ul>
      </div>

      <ol className="relative space-y-3 border-l-2 border-dashed border-border pl-5">
        {etapas.map((etapa, i) => {
          const Icone = ICONE_TIPO[etapa.tipo];
          return (
            <li key={etapa.id} className="relative">
              <span className="absolute -left-[1.9rem] flex size-6 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <Icone className="size-4 text-primary" aria-hidden />
                  {etapa.nome}
                  {!etapa.obrigatoria ? (
                    <Badge variant="outline">Opcional</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ROTULO_TIPO_ETAPA[etapa.tipo]} · até{" "}
                  {formatarData(
                    prazoDaEtapa(mesociclo.dataInicio, config, etapa),
                  )}
                </p>
                {etapa.descricao ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {etapa.descricao}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
        {etapas.length === 0 ? (
          <li className="text-sm text-atraso">Nenhuma etapa configurada.</li>
        ) : null}
      </ol>
    </div>
  );
}
