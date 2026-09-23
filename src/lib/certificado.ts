// Elegibilidade e emissão de certificado (Pacote 2) — gatilho manual, dentro
// da etapa de encerramento. Emissão real de certificado está fora do MVP de
// dezembro (D05/D17); isto cobre só o botão manual combinado no Pacote 0.

import type {
  Certificado,
  Conclusao,
  EstadoApp,
  Mesociclo,
  Pessoa,
} from "@/data/types";
import { cargaHorariaDoTema, novoId, temaVersaoVigente } from "@/lib/ciclo";
import { progressoDaTrilha, trilhaDoDocente } from "@/lib/jornada";

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
 * deste ciclo — trilha 100% concluída e carga horária declarada para o
 * tema (D56). Não esconde quem falha um critério: aparece com o motivo,
 * para a operadora não precisar adivinhar por que alguém não está na lista.
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
    const { percentual } = progressoDaTrilha(trilha);
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
 * Emite Conclusao + Certificado para os docentes elegíveis selecionados.
 * A carga horária vai CONGELADA no registro de conclusão (D56) — lida de
 * `TemaNoMesociclo` no momento da emissão, nunca mais recalculada depois.
 * Ignora silenciosamente quem não constar como elegível na lista recebida
 * — o chamador já filtrou antes de montar a seleção.
 */
export function emitirCertificados(
  elegiveis: ElegibilidadeCertificado[],
  pessoaIds: string[],
  estado: EstadoApp,
  autorId: string,
): { conclusoes: Conclusao[]; certificados: Certificado[] } {
  const agora = new Date().toISOString();
  const conclusoes: Conclusao[] = [];
  const certificados: Certificado[] = [];
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
    });

  return { conclusoes, certificados };
}
