import { FileText, Inbox } from "lucide-react";

import { TextoFormatado } from "@/components/entrega/EditorTextoRico";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/data/store";
import { formatarDataHora } from "@/lib/conteudo";
import {
  ROTULO_STATUS_ENTREGA,
  entregasRecebidas,
  formatarTamanho,
} from "@/lib/entrega";

/**
 * Entregas recebidas por quem corrige. Chegam direto pelo sistema:
 * nenhum link é colado à mão em outro lugar.
 */
export function PainelEntregasRecebidas({
  escopo,
}: {
  escopo: "coordenador" | "operadora";
}) {
  const { estado, pessoaAtiva } = useStore();
  const daEquipe =
    escopo === "coordenador"
      ? entregasRecebidas(estado, { coordenadorId: pessoaAtiva.id })
      : entregasRecebidas(estado);
  const central = entregasRecebidas(estado, { apenasEquipeCentral: true });
  const lista = escopo === "coordenador" ? daEquipe : daEquipe;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Inbox className="size-5 text-primary" aria-hidden />
        <CardTitle className="text-base">Entregas recebidas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          {escopo === "coordenador"
            ? `Entregas dos regentes da sua equipe. As entregas dos corregentes (${central.length}) são conduzidas pela equipe central e não aparecem aqui.`
            : "Todas as entregas do ciclo, incluindo as dos corregentes, que são conduzidas pela equipe central."}
        </p>
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma entrega recebida até agora.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {lista.slice(0, 15).map(({ entrega, docente, etapa, devolutiva }) => (
              <AccordionItem key={entrega.id} value={entrega.id}>
                <AccordionTrigger className="text-left">
                  <span className="flex flex-1 flex-wrap items-center gap-2 pr-3">
                    <span className="font-medium">{docente?.nome}</span>
                    <span className="text-sm text-muted-foreground">
                      {etapa?.nome}
                    </span>
                    <Badge
                      variant={
                        entrega.status === "devolutiva_disponivel"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {ROTULO_STATUS_ENTREGA[entrega.status]}
                    </Badge>
                    {entrega.destino === "equipe_central" && (
                      <Badge variant="outline">Equipe central</Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Enviada em {formatarDataHora(entrega.enviadaEmISO)}
                    {entrega.dataAulaISO
                      ? ` · Aula a observar: ${formatarDataHora(entrega.dataAulaISO)}`
                      : ""}
                  </p>
                  <TextoFormatado texto={entrega.texto} />
                  {entrega.arquivoNome && (
                    <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
                      <FileText className="size-4 text-primary" aria-hidden />
                      {entrega.arquivoNome}
                      <span className="text-muted-foreground">
                        {formatarTamanho(entrega.arquivoTamanho)}
                      </span>
                    </p>
                  )}
                  {devolutiva && (
                    <div className="rounded-lg border border-border p-3 text-sm">
                      <p className="font-medium">Devolutiva já registrada</p>
                      <p className="text-muted-foreground">{devolutiva.texto}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
