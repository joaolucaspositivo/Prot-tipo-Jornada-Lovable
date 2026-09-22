import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cargaHorariaDoTema, novoId } from "@/lib/ciclo";

import { useCicloConfig } from "./comum";

/** Nome, descrição e data de início da jornada — antes de tudo (D27, D38). */
export function AbaGeral() {
  const {
    estado,
    atualizar,
    config,
    salvarConfig,
    mesociclo,
    salvarMesociclo,
    temas,
  } = useCicloConfig();

  function salvarCargaHoraria(temaId: string, cargaHoraria: number) {
    atualizar((anterior) => {
      const existente = anterior.temasNoMesociclo.find(
        (t) => t.mesocicloId === mesociclo.id && t.temaId === temaId,
      );
      return {
        ...anterior,
        temasNoMesociclo: existente
          ? anterior.temasNoMesociclo.map((t) =>
              t.id === existente.id ? { ...t, cargaHoraria } : t,
            )
          : [
              ...anterior.temasNoMesociclo,
              {
                id: novoId("tnm"),
                mesocicloId: mesociclo.id,
                temaId,
                cargaHoraria,
              },
            ],
      };
    });
  }

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
          value={mesociclo.dataInicio.slice(0, 10)}
          onChange={(e) => {
            if (!e.target.value) return;
            salvarMesociclo((m) => ({
              ...m,
              dataInicio: new Date(
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

      <div className="space-y-2">
        <Label>Carga horária por tema, neste ciclo</Label>
        <p className="text-sm text-muted-foreground">
          O mesmo tema pode valer horas diferentes em cada ciclo (D56) — este
          valor vale só para {mesociclo.nome}.
        </p>
        {temas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum tema configurado ainda (aba Temas).
          </p>
        ) : (
          <ul className="space-y-2">
            {temas.map((tema) => (
              <li
                key={tema.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5"
              >
                <span className="text-sm">{tema.nome}</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={
                      cargaHorariaDoTema(estado, mesociclo.id, tema.id) ?? 0
                    }
                    onChange={(e) =>
                      salvarCargaHoraria(
                        tema.id,
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                    aria-label={`Carga horária de ${tema.nome} em ${mesociclo.nome}`}
                    className="h-9 w-20"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
