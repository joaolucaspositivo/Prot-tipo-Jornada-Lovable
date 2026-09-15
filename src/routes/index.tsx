import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useStore } from "@/data/store";
import type { PerfilId } from "@/data/types";

function rotaInicial(
  perfil: PerfilId,
): "/jornada" | "/equipe" | "/gestao" | "/unidade" {
  switch (perfil) {
    // Área própria do moderador chega no Bloco 6 (D33); por ora, mesma
    // porta de entrada do docente.
    case "docente-regente":
    case "docente-corregente":
    case "moderador":
      return "/jornada";
    case "coordenador":
      return "/equipe";
    case "operadora":
      return "/gestao";
    case "diretor":
      return "/unidade";
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Jornada Pedagógica de Desenvolvimento" }],
  }),
  component: RedirecionamentoInicial,
});

/**
 * "/" deixou de ser uma tela própria (D28) — "Painel" não é mais um
 * conceito compartilhado entre perfis. Cada perfil já tem sua tela de
 * referência (Minha Jornada, Minha equipe, Gestão do ciclo, Minha
 * unidade); esta rota só existe para quem abrir a raiz do site direto.
 */
function RedirecionamentoInicial() {
  const { pronto, estado } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!pronto) return;
    navigate({ to: rotaInicial(estado.perfilAtivo), replace: true });
  }, [pronto, estado.perfilAtivo, navigate]);

  return null;
}
