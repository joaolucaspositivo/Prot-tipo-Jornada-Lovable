import { CalendarCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";
import { formatarDataHora, presencasAutomaticas } from "@/lib/conteudo";

/**
 * Presenças registradas automaticamente pelo envio da tarefa.
 * Não existe lançamento manual em nenhuma tela: esta lista só é lida.
 */
export function PainelPresencas({
  apenasMinhaEquipe = false,
}: {
  apenasMinhaEquipe?: boolean;
}) {
  const { estado, pessoaAtiva } = useStore();
  const registros = presencasAutomaticas(
    estado,
    apenasMinhaEquipe ? { coordenadorId: pessoaAtiva.id } : undefined,
  ).slice(0, 12);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <CalendarCheck className="size-5 text-sucesso" aria-hidden />
        <CardTitle className="text-base">
          Presenças registradas automaticamente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Na modalidade assíncrona, o envio da tarefa registra a presença na
          hora. Ninguém lança presença à mão.
        </p>
        {registros.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma presença registrada até agora.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {registros.map((r, i) => (
              <li
                key={`${r.pessoa.id}-${r.etapa?.id ?? i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.pessoa.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.etapa?.nome ?? "Etapa do ciclo"}
                    {r.turma ? ` · ${r.turma.nome}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.modalidade && (
                    <Badge variant="outline">{r.modalidade.nome}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatarDataHora(r.quandoISO)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
