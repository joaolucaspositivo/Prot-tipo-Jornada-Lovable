import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DetalheCiclo } from "@/components/config/DetalheCiclo";
import { ListaCiclos } from "@/components/config/ListaCiclos";
import { useStore } from "@/data/store";

export const Route = createFileRoute("/configuracao")({
  head: () => ({
    meta: [
      {
        title: "Configuração de ciclos — Jornada Pedagógica de Desenvolvimento",
      },
      {
        name: "description",
        content:
          "Edição de temas, modalidades, turmas, etapas, conteúdo e alertas de cada ciclo.",
      },
      { property: "og:title", content: "Configuração de ciclos" },
      {
        property: "og:description",
        content:
          "Edição de temas, modalidades, turmas, etapas, conteúdo e alertas de cada ciclo.",
      },
    ],
  }),
  component: ConfiguracaoPage,
});

/**
 * Roteia entre a lista de ciclos e a configuração de um ciclo específico
 * (Pacote 2B) — sem rota nova: nada fora desta tela depende de URL para
 * abrir uma aba ou um ciclo (ver exploração do pacote), então o estado
 * local basta. `key={cicloSelecionadoId}` no detalhe é o que garante que
 * trocar de ciclo remonta a edição do zero, sem vazar aba nem modo guiado
 * de um ciclo para o outro.
 */
function ConfiguracaoPage() {
  const { estado } = useStore();
  const [cicloSelecionadoId, setCicloSelecionadoId] = useState<string | null>(
    null,
  );

  const mesociclo = cicloSelecionadoId
    ? estado.mesociclos.find((m) => m.id === cicloSelecionadoId)
    : undefined;

  if (cicloSelecionadoId && mesociclo) {
    return (
      <DetalheCiclo
        key={cicloSelecionadoId}
        mesocicloId={cicloSelecionadoId}
        nomeCiclo={mesociclo.nome}
        aoVoltar={() => setCicloSelecionadoId(null)}
      />
    );
  }

  return <ListaCiclos aoAbrirCiclo={setCicloSelecionadoId} />;
}
