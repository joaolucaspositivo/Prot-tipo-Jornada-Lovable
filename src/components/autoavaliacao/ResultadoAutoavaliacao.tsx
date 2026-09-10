import { Sparkles, Target } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DIMENSOES_AUTOAVALIACAO,
  dimensaoMaisFragil,
} from "@/data/autoavaliacao";

export function ResultadoAutoavaliacao({
  dimensoes,
  concluidaEmISO,
}: {
  dimensoes: Record<string, number>;
  concluidaEmISO?: string | undefined;
}) {
  const dados = DIMENSOES_AUTOAVALIACAO.map((d) => ({
    dimensao: d.nome.split(" e ")[0] ?? d.nome,
    valor: Number((dimensoes[d.id] ?? 0).toFixed(2)),
  }));
  const fragil = dimensaoMaisFragil(dimensoes);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">
            Seu retrato de prática neste ciclo
          </CardTitle>
          {concluidaEmISO && (
            <p className="text-sm text-muted-foreground">
              Respondida em{" "}
              {new Date(concluidaEmISO).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-[20rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dados} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="dimensao"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
                />
                <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="Sua prática"
                  dataKey="valor"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Quanto mais para fora, mais consolidada você indicou aquela
            dimensão.
          </p>
        </CardContent>
      </Card>

      {fragil && (
        <Card className="border-conquista/40 bg-conquista-suave">
          <CardHeader className="flex flex-row items-start gap-3">
            <Target className="mt-0.5 size-5 shrink-0 text-conquista" aria-hidden />
            <div>
              <CardTitle className="text-base">
                Aqui está sua maior oportunidade de desenvolvimento neste ciclo
              </CardTitle>
              <p className="mt-1 text-sm">
                <strong>{fragil.nome}</strong> — {fragil.resumo}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex items-start gap-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
            Ao escolher seu macrotema, considere um percurso que fortaleça essa
            dimensão. Este resultado fica guardado na sua trilha.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
