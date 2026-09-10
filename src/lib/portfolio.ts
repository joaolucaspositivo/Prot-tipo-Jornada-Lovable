// Leituras do Portfólio de Inovação Docente.
// A etapa, os campos de reflexão e o prazo vêm da configuração do ciclo.

import type {
  EstadoApp,
  Etapa,
  Pessoa,
  PerguntaReflexao,
  Portfolio,
} from "@/data/types";
import { etapasDoSegmento } from "@/lib/ciclo";

/** Etapa de portfólio, resolvida em runtime (nunca fixa no código). */
export function etapaDePortfolio(
  estado: EstadoApp,
  pessoa: Pessoa,
): Etapa | undefined {
  const etapas = etapasDoSegmento(
    estado.cicloConfig,
    estado.cicloConfig.cenarioSegmentacao === "trilha_unica"
      ? null
      : pessoa.segmentoId,
  );
  const porNome = etapas.find((e) =>
    e.nome.toLowerCase().includes("portf"),
  );
  if (porNome) return porNome;
  const deEntrega = etapas.filter((e) => e.tipo === "entrega");
  return deEntrega[deEntrega.length - 1];
}

export function reflexoesConfiguradas(estado: EstadoApp): PerguntaReflexao[] {
  return [...estado.cicloConfig.reflexoesPortfolio].sort(
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
  return estado.entregas
    .filter((e) => e.pessoaId === pessoaId)
    .map((entrega) => {
      const etapa = estado.cicloConfig.etapas.find(
        (e) => e.id === entrega.etapaId,
      );
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
  return estado.cicloConfig.conquistas
    .filter((c) =>
      estado.progressoEtapas.some(
        (p) =>
          p.pessoaId === pessoaId &&
          p.etapaId === c.etapaId &&
          p.status === "concluida",
      ),
    )
    .map((c) => c.nome);
}
