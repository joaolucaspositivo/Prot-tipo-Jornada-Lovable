// Elegibilidade e emissão de certificado (Pacote 2) — gatilho manual, dentro
// da etapa de encerramento. Emissão real de certificado está fora do MVP de
// dezembro (D05/D17); isto cobre só o botão manual combinado no Pacote 0.

import type {
  Certificado,
  Conclusao,
  EstadoApp,
  Mesociclo,
  Pessoa,
  ProgressoEtapa,
} from "@/data/types";
import { cargaHorariaDoTema, novoId, temaVersaoVigente } from "@/lib/ciclo";
import { trilhaDoDocente } from "@/lib/jornada";

/**
 * Percentual da trilha, para fins de elegibilidade, SEM contar a própria
 * etapa de encerramento — concluí-la é justamente o efeito da emissão do
 * certificado (Pacote 2). Contá-la no denominador tornaria a emissão
 * impossível: 100% exigiria a etapa que só o botão de emissão completa.
 */
function percentualSemEncerramento(
  trilha: ReturnType<typeof trilhaDoDocente>,
): number {
  const semEncerramento = trilha.filter((i) => i.etapa.tipo !== "encerramento");
  if (semEncerramento.length === 0) return 100;
  const concluidas = semEncerramento.filter(
    (i) => i.status === "concluida",
  ).length;
  return Math.round((concluidas / semEncerramento.length) * 100);
}

export interface ElegibilidadeCertificado {
  pessoa: Pessoa;
  temaNome: string | undefined;
  percentualTrilha: number;
  cargaHoraria: number | undefined;
  /** já existe Conclusao + Certificado para este docente, neste tema */
  jaEmitido: boolean;
  elegivel: boolean;
  /** motivo de não poder marcar, em linguagem direta — ausente quando elegível */
  motivoInelegivel?: string | undefined;
}

/**
 * Elegibilidade de cada docente inscrito no mesociclo para o certificado
 * deste ciclo — trilha 100% concluída (fora a própria etapa de
 * encerramento) e carga horária declarada para o tema (D56). Não esconde
 * quem falha um critério: aparece com o motivo, para a operadora não
 * precisar adivinhar por que alguém não está na lista.
 */
export function elegibilidadeCertificadoDoCiclo(
  estado: EstadoApp,
  mesociclo: Mesociclo,
): ElegibilidadeCertificado[] {
  const idsTurmasDoCiclo = new Set(
    estado.turmas
      .filter((t) => t.mesocicloId === mesociclo.id)
      .map((t) => t.id),
  );
  const inscricoesDoCiclo = estado.inscricoes.filter((i) =>
    idsTurmasDoCiclo.has(i.turmaId),
  );

  return inscricoesDoCiclo.map((inscricao) => {
    const pessoa = estado.pessoas.find((p) => p.id === inscricao.pessoaId)!;
    const tema = estado.temas.find((t) => t.id === inscricao.temaId);
    const trilha = trilhaDoDocente(estado, pessoa);
    const percentual = percentualSemEncerramento(trilha);
    const cargaHoraria = tema
      ? cargaHorariaDoTema(estado, mesociclo.id, tema.id)
      : undefined;
    const versao = tema ? temaVersaoVigente(estado, tema.id) : undefined;
    const conclusao = versao
      ? estado.conclusoes.find(
          (c) => c.docenteId === pessoa.id && c.temaVersaoId === versao.id,
        )
      : undefined;
    const jaEmitido = conclusao
      ? estado.certificados.some((cert) => cert.conclusaoId === conclusao.id)
      : false;

    let motivoInelegivel: string | undefined;
    if (jaEmitido) motivoInelegivel = "Certificado já emitido";
    else if (percentual < 100)
      motivoInelegivel = `Trilha incompleta (${percentual}%)`;
    else if (cargaHoraria === undefined)
      motivoInelegivel = "Carga horária não declarada para este tema";
    else if (!versao) motivoInelegivel = "Tema sem versão registrada";

    return {
      pessoa,
      temaNome: tema?.nome,
      percentualTrilha: percentual,
      cargaHoraria,
      jaEmitido,
      elegivel: motivoInelegivel === undefined,
      motivoInelegivel,
    };
  });
}

/**
 * Certificado do próprio docente, para a tela de encerramento da trilha —
 * lê exclusivamente de `Conclusao`/`TemaVersao` (D53/D54): o nome e a carga
 * mostrados são os CONGELADOS na conclusão, nunca os do tema vigente.
 */
export function certificadoDoDocente(estado: EstadoApp, docenteId: string) {
  const conclusao = estado.conclusoes.find((c) => c.docenteId === docenteId);
  if (!conclusao) return undefined;
  const versao = estado.temaVersoes.find(
    (v) => v.id === conclusao.temaVersaoId,
  );
  const certificado = estado.certificados.find(
    (c) => c.conclusaoId === conclusao.id,
  );
  return { conclusao, versao, certificado };
}

/**
 * Emite Conclusao + Certificado para os docentes elegíveis selecionados.
 * A carga horária vai CONGELADA no registro de conclusão (D56) — lida de
 * `TemaNoMesociclo` no momento da emissão, nunca mais recalculada depois.
 * Ignora silenciosamente quem não constar como elegível na lista recebida
 * — o chamador já filtrou antes de montar a seleção.
 *
 * Também conclui a(s) etapa(s) `tipo: "encerramento"` do docente — é a
 * própria emissão que fecha essa etapa na trilha dele, não uma ação
 * separada do docente (ver `percentualSemEncerramento` acima).
 */
export function emitirCertificados(
  elegiveis: ElegibilidadeCertificado[],
  pessoaIds: string[],
  estado: EstadoApp,
  autorId: string,
): {
  conclusoes: Conclusao[];
  certificados: Certificado[];
  /** array final de progressoEtapas — substitui `estado.progressoEtapas`, não concatena */
  progressoEtapas: ProgressoEtapa[];
} {
  const agora = new Date().toISOString();
  const conclusoes: Conclusao[] = [];
  const certificados: Certificado[] = [];
  let progressoEtapas = estado.progressoEtapas;
  const idsSelecionados = new Set(pessoaIds);

  elegiveis
    .filter((e) => e.elegivel && idsSelecionados.has(e.pessoa.id))
    .forEach((e) => {
      const inscricao = estado.inscricoes.find(
        (i) => i.pessoaId === e.pessoa.id,
      );
      const tema = inscricao
        ? estado.temas.find((t) => t.id === inscricao.temaId)
        : undefined;
      const versao = tema ? temaVersaoVigente(estado, tema.id) : undefined;
      if (!versao || e.cargaHoraria === undefined) return;

      const conclusao: Conclusao = {
        id: novoId("concl"),
        docenteId: e.pessoa.id,
        temaVersaoId: versao.id,
        cargaHorariaCongelada: e.cargaHoraria,
        concluidoEmISO: agora,
      };
      conclusoes.push(conclusao);
      certificados.push({
        id: novoId("cert"),
        conclusaoId: conclusao.id,
        emitidoEmISO: agora,
        emitidoPorId: autorId,
      });

      const trilha = trilhaDoDocente(estado, e.pessoa);
      trilha
        .filter((i) => i.etapa.tipo === "encerramento")
        .forEach((i) => {
          const existente = progressoEtapas.find(
            (p) => p.pessoaId === e.pessoa.id && p.etapaId === i.etapa.id,
          );
          progressoEtapas = existente
            ? progressoEtapas.map((p) =>
                p.id === existente.id
                  ? {
                      ...p,
                      status: "concluida" as const,
                      atualizadoEmISO: agora,
                    }
                  : p,
              )
            : [
                ...progressoEtapas,
                {
                  id: novoId("prog"),
                  pessoaId: e.pessoa.id,
                  etapaId: i.etapa.id,
                  status: "concluida" as const,
                  atualizadoEmISO: agora,
                },
              ];
        });
    });

  return { conclusoes, certificados, progressoEtapas };
}
