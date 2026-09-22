// Leituras do Portfólio de Inovação Docente.
// A etapa, os campos de reflexão e o prazo vêm da configuração do ciclo.

import type {
  EstadoApp,
  Etapa,
  PerguntaReflexao,
  Portfolio,
} from "@/data/types";
import { cicloDoDocente, etapasEmOrdem } from "@/lib/ciclo";

/** Etapa de portfólio do docente, resolvida em runtime (nunca fixa no código). */
export function etapaDePortfolio(
  estado: EstadoApp,
  pessoaId: string,
): Etapa | undefined {
  const etapas = etapasEmOrdem(cicloDoDocente(estado, pessoaId).config);
  return etapas.find((e) => e.tela === "portfolio");
}

export function reflexoesConfiguradas(
  estado: EstadoApp,
  pessoaId: string,
): PerguntaReflexao[] {
  return [...cicloDoDocente(estado, pessoaId).config.reflexoesPortfolio].sort(
    (a, b) => a.ordem - b.ordem,
  );
}

export function portfolioDoDocente(
  estado: EstadoApp,
  pessoaId: string,
): Portfolio | undefined {
  return estado.portfolios.find((p) => p.pessoaId === pessoaId);
}

export interface ItemDoCiclo {
  etapaNome: string;
  quando: string;
  texto: string;
  arquivoNome?: string | undefined;
  devolutiva?: string | undefined;
  autorDevolutiva?: string | undefined;
}

/** Entregas e devolutivas já reunidas para compor o portfólio. */
export function itensDoCiclo(
  estado: EstadoApp,
  pessoaId: string,
): ItemDoCiclo[] {
  const { config } = cicloDoDocente(estado, pessoaId);
  return estado.entregas
    .filter((e) => e.pessoaId === pessoaId)
    .map((entrega) => {
      const etapa = config.etapas.find((e) => e.id === entrega.etapaId);
      const dev = estado.devolutivas.find((d) => d.entregaId === entrega.id);
      const autor = dev
        ? estado.pessoas.find((p) => p.id === dev.autorId)?.nome
        : undefined;
      return {
        etapaNome: etapa?.nome ?? "Etapa do ciclo",
        quando: entrega.enviadaEmISO,
        texto: entrega.texto,
        arquivoNome: entrega.arquivoNome,
        devolutiva: dev?.texto,
        autorDevolutiva: autor ?? (dev ? "Equipe central" : undefined),
      };
    })
    .sort((a, b) => a.quando.localeCompare(b.quando));
}

/** Conquistas do ciclo já acesas, para aparecerem no portfólio. */
export function conquistasDoDocente(
  estado: EstadoApp,
  pessoaId: string,
): string[] {
  return cicloDoDocente(estado, pessoaId)
    .config.conquistas.filter((c) =>
      estado.progressoEtapas.some(
        (p) =>
          p.pessoaId === pessoaId &&
          p.etapaId === c.etapaId &&
          p.status === "concluida",
      ),
    )
    .map((c) => c.nome);
}
