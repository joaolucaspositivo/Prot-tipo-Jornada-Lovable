import { BellRing, Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";
import { ROTULO_TIPO_ETAPA } from "@/lib/ciclo";
import { formatarDataHora } from "@/lib/conteudo";
import { alertasDisparados } from "@/lib/gestao";

/** O que está configurado, o que já disparou e para quem. */
export function PainelAlertas() {
  const { estado } = useStore();
  const etapas = [...estado.cicloConfig.etapas].sort(
    (a, b) => a.ordem - b.ordem,
  );
  const historico = alertasDisparados(estado);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center gap-3 space-y-0">
          <Settings2 className="size-5 text-primary" aria-hidden />
          <CardTitle className="min-w-0 flex-1 text-base">
            Regras configuradas por etapa
          </CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to="/configuracao">Editar regras</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {etapas.map((e) => (
              <li key={e.id} className="py-3">
                <span className="block text-sm font-medium">
                  {e.nome}{" "}
                  <Badge variant="secondary" className="ml-1">
                    {ROTULO_TIPO_ETAPA[e.tipo]}
                  </Badge>
                </span>

                <p className="text-sm text-muted-foreground">
                  {e.alerta.diasParaCoordenador === 0
                    ? "Avisa no mesmo dia do vencimento"
                    : `Avisa ${e.alerta.diasParaCoordenador} dia(s) após o vencimento`}
                  {e.alerta.alertarDocente
                    ? " · coordenador e docente"
                    : " · somente coordenador"}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <BellRing className="size-5 text-atraso" aria-hidden />
          <CardTitle className="text-base">
            Alertas disparados ({historico.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum alerta disparado até agora neste ciclo.
            </p>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
              {historico.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">
                      {a.pessoaNome}{" "}
                      <span className="text-xs text-muted-foreground">
                        · {a.unidade}
                      </span>
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatarDataHora(a.quandoISO)}
                    </span>
                  </div>
                  <p className="text-sm">{a.titulo}</p>
                  <p className="text-sm text-muted-foreground">{a.descricao}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
