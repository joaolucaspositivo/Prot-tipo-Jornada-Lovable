import { createFileRoute, redirect } from "@tanstack/react-router";

// Migrado para a aba "Conteúdo" da Configuração do Ciclo (seções 2.1/3.3
// da especificação P1+P2). Mantém a rota (e não apaga o arquivo) para não
// precisar regenerar src/routeTree.gen.ts — só redireciona.
export const Route = createFileRoute("/conteudo")({
  beforeLoad: () => {
    throw redirect({ to: "/configuracao" });
  },
});
