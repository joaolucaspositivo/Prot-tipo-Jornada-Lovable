import { Construction } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Placeholder({
  titulo,
  descricao,
  etapa,
}: {
  titulo: string;
  descricao: string;
  etapa: string;
}) {
  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{titulo}</h1>
        <p className="text-muted-foreground">{descricao}</p>
      </header>
      <Card className="border-dashed">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Construction className="size-5 text-accent-foreground" aria-hidden />
          <CardTitle className="text-base">Tela ainda não construída</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área será construída na etapa: <strong>{etapa}</strong>. A
          fundação (dados, perfis e sistema visual) já está no lugar.
        </CardContent>
      </Card>
    </section>
  );
}
