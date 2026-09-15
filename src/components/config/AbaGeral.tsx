import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useCicloConfig } from "./comum";

/** Nome, descrição e data de início da jornada — antes de tudo (D27, D38). */
export function AbaGeral() {
  const { config, salvarConfig } = useCicloConfig();

  return (
    <div className="max-w-xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="geral-nome">Nome da jornada</Label>
        <Input
          id="geral-nome"
          value={config.nome}
          onChange={(e) =>
            salvarConfig((c) => ({ ...c, nome: e.target.value }))
          }
          placeholder="Ciclo 2"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="geral-descricao">Descrição</Label>
        <Textarea
          id="geral-descricao"
          value={config.descricao}
          onChange={(e) =>
            salvarConfig((c) => ({ ...c, descricao: e.target.value }))
          }
          rows={3}
          placeholder="Jornada 2027 a 2030"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="geral-inicio">Data de início do ciclo</Label>
        <Input
          id="geral-inicio"
          type="date"
          value={config.dataInicioCiclo.slice(0, 10)}
          onChange={(e) => {
            if (!e.target.value) return;
            salvarConfig((c) => ({
              ...c,
              dataInicioCiclo: new Date(
                `${e.target.value}T00:00:00.000Z`,
              ).toISOString(),
            }));
          }}
          className="max-w-[12rem]"
        />
        <p className="text-sm text-muted-foreground">
          Os prazos das etapas (aba Etapas da trilha) contam a partir desta data
          — cada etapa encadeada ao vencimento da anterior.
        </p>
      </div>
    </div>
  );
}
