import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";
import { participacaoPorPublico, resumoDaEnquete } from "@/lib/enquete";

interface Props {
  /** Quando ausente, mostra o agregado de toda a rede (visão da operadora). */
  docenteId?: string | undefined;
}

/** Resumo agregado da Enquete 360°, sempre derivado da configuração. */
export function ResumoEnquete({ docenteId }: Props) {
  const { estado } = useStore();
  const resumo = resumoDaEnquete(estado, docenteId);
  const participacao = participacaoPorPublico(estado);
  const totalRespostas = docenteId
    ? estado.respostasEnquete.filter((r) => r.docenteId === docenteId).length
    : estado.respostasEnquete.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4 text-primary" aria-hidden />
          Resumo agregado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {totalRespostas} resposta(s) considerada(s)
          {docenteId ? " sobre este docente" : " em toda a rede"}.
        </p>

        {!docenteId && (
          <div className="flex flex-wrap gap-2">
            {participacao.map((p) => (
              <Badge key={p.publico.id} variant="secondary">
                {p.publico.nome}: {p.respostas}
              </Badge>
            ))}
          </div>
        )}

        {totalRespostas === 0 && (
          <p className="text-sm text-muted-foreground">
            Ainda não há respostas coletadas.
          </p>
        )}

        <ul className="space-y-4">
          {resumo
            .filter((r) => r.respostas > 0)
            .map((r) => (
              <li key={r.pergunta.id} className="space-y-2">
                <p className="text-sm font-medium">{r.pergunta.texto}</p>
                {r.pergunta.tipo === "escala" ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                        role="img"
                        aria-label={`Média ${r.mediaGeral} de 5`}
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(r.mediaGeral / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {r.mediaGeral.toFixed(1)}
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {r.porPublico.map((p) => (
                        <li key={p.publico.id}>
                          {p.publico.nome}: {p.media.toFixed(1)} ({p.respostas})
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {r.comentarios.slice(0, 4).map((c, i) => (
                      <li key={i} className="rounded-md bg-secondary p-2">
                        “{c}”
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
