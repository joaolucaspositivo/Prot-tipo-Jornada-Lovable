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
        Para cada etapa, defina com quantos dias de atraso o coordenador é
        avisado e se o docente recebe o mesmo aviso.
      </p>

      <ul className="space-y-3">
        {etapas.map((etapa, i) => (
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
                <Label htmlFor={`alerta-dias-${etapa.id}`}>
                  Alertar o coordenador após (dias de atraso)
                </Label>
                <Input
                  id={`alerta-dias-${etapa.id}`}
                  type="number"
                  min={0}
                  value={etapa.alerta.diasParaCoordenador}
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
                  checked={etapa.alerta.alertarDocente}
                  onCheckedChange={(v) =>
                    editarAlerta(etapa.id, { alertarDocente: v })
                  }
                />
                <Label htmlFor={`alerta-doc-${etapa.id}`}>
                  O docente também recebe o aviso
                </Label>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <BellRing className="size-3.5" aria-hidden />
              {etapa.alerta.diasParaCoordenador === 0
                ? "Aviso no mesmo dia do vencimento"
                : `Aviso ${etapa.alerta.diasParaCoordenador} dia(s) após o vencimento`}
              {etapa.alerta.alertarDocente
                ? " · coordenador e docente"
                : " · somente coordenador"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
