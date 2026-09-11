import { BellRing } from "lucide-react";

import { useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Etapa } from "@/data/types";
import { ROTULO_TIPO_ETAPA } from "@/lib/ciclo";

export function AbaAlertas() {
  const { config, salvarConfig } = useCicloConfig();
  const etapas = [...config.etapas].sort((a, b) => a.ordem - b.ordem);

  const editarAlerta = (id: string, mudanca: Partial<Etapa["alerta"]>) =>
    salvarConfig((c) => ({
      ...c,
      etapas: c.etapas.map((e) =>
        e.id === id ? { ...e, alerta: { ...e.alerta, ...mudanca } } : e,
      ),
    }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Para cada etapa, defina os avisos antes do prazo, no vencimento e
        depois dele — e quem recebe cada um.
      </p>

      <ul className="space-y-3">
        {etapas.map((etapa, i) => {
          const alerta = etapa.alerta;
          const fraseAntes =
            alerta.diasAntes > 0
              ? `Avisa o docente ${alerta.diasAntes} dia(s) antes do prazo`
              : "Não avisa o docente antes do prazo";
          const fraseVencimento = alerta.noVencimento
            ? "avisa o docente no dia do vencimento"
            : "não avisa no dia do vencimento";
          const fraseAtraso =
            alerta.diasParaCoordenador === 0
              ? "avisa o coordenador no mesmo dia do atraso"
              : `avisa o coordenador após ${alerta.diasParaCoordenador} dia(s) de atraso`;

          return (
            <li
              key={etapa.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="font-medium">{etapa.nome}</span>
                <Badge variant="secondary">{ROTULO_TIPO_ETAPA[etapa.tipo]}</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`alerta-antes-${etapa.id}`}>
                    Avisar o docente quantos dias antes do prazo
                  </Label>
                  <Input
                    id={`alerta-antes-${etapa.id}`}
                    type="number"
                    min={0}
                    value={alerta.diasAntes}
                    onChange={(e) =>
                      editarAlerta(etapa.id, {
                        diasAntes: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="h-10 max-w-[10rem]"
                  />
                  <p className="text-xs text-muted-foreground">
                    0 = não avisa antes do prazo.
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:pt-6">
                  <Switch
                    id={`alerta-venc-${etapa.id}`}
                    checked={alerta.noVencimento}
                    onCheckedChange={(v) =>
                      editarAlerta(etapa.id, { noVencimento: v })
                    }
                  />
                  <Label htmlFor={`alerta-venc-${etapa.id}`}>
                    Avisar o docente no dia do vencimento
                  </Label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`alerta-dias-${etapa.id}`}>
                    Alertar o coordenador após (dias de atraso)
                  </Label>
                  <Input
                    id={`alerta-dias-${etapa.id}`}
                    type="number"
                    min={0}
                    value={alerta.diasParaCoordenador}
                    onChange={(e) =>
                      editarAlerta(etapa.id, {
                        diasParaCoordenador: Math.max(
                          0,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                    className="h-10 max-w-[10rem]"
                  />
                </div>
                <div className="flex items-center gap-2 sm:pt-6">
                  <Switch
                    id={`alerta-doc-${etapa.id}`}
                    checked={alerta.alertarDocente}
                    onCheckedChange={(v) =>
                      editarAlerta(etapa.id, { alertarDocente: v })
                    }
                  />
                  <Label htmlFor={`alerta-doc-${etapa.id}`}>
                    O docente também recebe o aviso de atraso
                  </Label>
                </div>
              </div>

              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <BellRing className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  {fraseAntes} · {fraseVencimento} · {fraseAtraso}
                  {alerta.alertarDocente
                    ? " (docente também avisado no atraso)"
                    : " (só o coordenador no atraso)"}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
