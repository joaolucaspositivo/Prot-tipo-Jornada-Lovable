import {
  CloudUpload,
  FileText,
  Film,
  Link2,
  ListChecks,
  ListTodo,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ItemArrastavel, useCicloConfig } from "./comum";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  CriterioAvanco,
  EstadoApp,
  ItemConteudo,
  Midia,
  Modalidade,
  OfertaConteudo,
  PerguntaOpcaoMultipla,
  TipoCriterioAvanco,
} from "@/data/types";
import { temasAtivos, moverItem, novoId, reindexar } from "@/lib/ciclo";

const CRITERIOS_ORDEM: TipoCriterioAvanco[] = [
  "aulas_assistidas",
  "leitura_concluida",
  "presenca",
  "tarefa_entregue",
  "tarefa_validada",
  "nota_minima",
];

const ROTULO_CRITERIO: Record<TipoCriterioAvanco, string> = {
  aulas_assistidas: "Assistir a todas as aulas",
  leitura_concluida: "Concluir a leitura do texto-base",
  presenca: "Presença no encontro",
  tarefa_entregue: "Entregar a tarefa",
  tarefa_validada: "Ter a tarefa validada pelo professor",
  nota_minima: "Atingir nota mínima na etapa",
};

function criterioFazSentido(
  tipo: TipoCriterioAvanco,
  itens: ItemConteudo[],
  modalidade: Modalidade | undefined,
): boolean {
  const temVideo = itens.some((i) => i.tipo === "video");
  const temTexto = itens.some((i) => i.tipo === "texto");
  const temWebconferencia = itens.some((i) => i.tipo === "webconferencia");
  const temTarefa = itens.some((i) => i.tipo === "tarefa");
  switch (tipo) {
    case "aulas_assistidas":
      return temVideo;
    case "leitura_concluida":
      return temTexto;
    case "presenca":
      return temWebconferencia || modalidade?.presencaAutomatica === false;
    case "tarefa_entregue":
    case "tarefa_validada":
    case "nota_minima":
      return temTarefa;
  }
}

function fraseCriterio(c: CriterioAvanco): string {
  switch (c.tipo) {
    case "aulas_assistidas":
      return "assistir a todas as aulas";
    case "leitura_concluida":
      return "concluir a leitura do texto-base";
    case "presenca":
      return `atingir ${c.percentualMinimo ?? 0}% de presença no encontro`;
    case "tarefa_entregue":
      return "entregar a tarefa";
    case "tarefa_validada":
      return `ter a tarefa validada com nota ${c.notaCorte ?? 0} ou mais`;
    case "nota_minima":
      return `atingir nota mínima ${c.notaCorte ?? 0} na etapa`;
  }
}

function referenciaDriveParaMidia(
  midiaId: string,
  nomeArquivo: string,
): string {
  const sanitizado = nomeArquivo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `drive-institucional/biblioteca-de-midia/${midiaId}/${sanitizado}`;
}

export function AbaConteudo() {
  const { estado, pessoaAtiva, atualizar, config } = useCicloConfig();

  const etapasConteudo = [...config.etapas]
    .filter((e) => e.tipo === "conteudo")
    .sort((a, b) => a.ordem - b.ordem);
  const temas = temasAtivos(config);
  const modalidadesAtivas = config.modalidades.filter((m) => m.ativa);

  const [etapaIdBruto, setEtapaIdBruto] = useState("");
  const [temaIdBruto, setTemaIdBruto] = useState("");
  const [modalidadeIdBruto, setModalidadeIdBruto] = useState("");
  const [dialogo, setDialogo] = useState<
    "video" | "texto" | "webconferencia" | "tarefa" | "questionario" | null
  >(null);

  const etapaId = etapasConteudo.some((e) => e.id === etapaIdBruto)
    ? etapaIdBruto
    : (etapasConteudo[0]?.id ?? "");
  const temaId = temas.some((m) => m.id === temaIdBruto)
    ? temaIdBruto
    : (temas[0]?.id ?? "");
  const modalidadeId = modalidadesAtivas.some((m) => m.id === modalidadeIdBruto)
    ? modalidadeIdBruto
    : (modalidadesAtivas[0]?.id ?? "");

  const etapa = etapasConteudo.find((e) => e.id === etapaId);
  const tema = temas.find((m) => m.id === temaId);
  const modalidade = modalidadesAtivas.find((m) => m.id === modalidadeId);

  const oferta = estado.ofertas.find(
    (o) =>
      o.etapaId === etapaId &&
      o.temaId === temaId &&
      o.modalidadeId === modalidadeId,
  );
  const itens = oferta
    ? estado.itensConteudo
        .filter((i) => i.ofertaId === oferta.id)
        .sort((a, b) => a.ordem - b.ordem)
    : [];

  if (
    etapasConteudo.length === 0 ||
    temas.length === 0 ||
    modalidadesAtivas.length === 0
  ) {
    return (
      <div className="space-y-2 rounded-xl border border-dashed border-border p-6 text-center">
        <p className="font-medium">Ainda faltam pré-requisitos</p>
        <p className="text-sm text-muted-foreground">
          Para cadastrar conteúdo, é preciso ter ao menos um tema ativo, uma
          modalidade ativa e uma etapa do tipo Conteúdo.
        </p>
      </div>
    );
  }

  /** Garante a oferta da combinação atual dentro do MESMO updater que grava o item. */
  function comOfertaGarantida(anterior: EstadoApp): {
    estado: EstadoApp;
    ofertaId: string;
  } {
    const existente = anterior.ofertas.find(
      (o) =>
        o.etapaId === etapaId &&
        o.temaId === temaId &&
        o.modalidadeId === modalidadeId,
    );
    if (existente) return { estado: anterior, ofertaId: existente.id };
    const nova: OfertaConteudo = {
      id: novoId("oferta"),
      etapaId,
      temaId,
      modalidadeId,
      criterios: CRITERIOS_ORDEM.map((tipo) => ({ tipo, ativo: false })),
    };
    return {
      estado: { ...anterior, ofertas: [...anterior.ofertas, nova] },
      ofertaId: nova.id,
    };
  }

  function adicionarItem(
    midia: Midia | null,
    item: Omit<ItemConteudo, "id" | "ofertaId" | "ordem">,
  ) {
    atualizar((anterior) => {
      const { estado: comOferta, ofertaId } = comOfertaGarantida(anterior);
      const ordem = comOferta.itensConteudo.filter(
        (i) => i.ofertaId === ofertaId,
      ).length;
      const novoItem: ItemConteudo = {
        ...item,
        id: novoId("item"),
        ofertaId,
        ordem,
      };
      return {
        ...comOferta,
        midias: midia ? [midia, ...comOferta.midias] : comOferta.midias,
        itensConteudo: [...comOferta.itensConteudo, novoItem],
      };
    });
  }

  function editarItem(id: string, mudanca: Partial<ItemConteudo>) {
    atualizar((anterior) => ({
      ...anterior,
      itensConteudo: anterior.itensConteudo.map((i) =>
        i.id === id ? { ...i, ...mudanca } : i,
      ),
    }));
  }

  function removerItem(item: ItemConteudo) {
    atualizar((anterior) => ({
      ...anterior,
      itensConteudo: anterior.itensConteudo.filter((i) => i.id !== item.id),
    }));
  }

  function moverItemDaOferta(de: number, para: number) {
    if (!oferta) return;
    const ofertaId = oferta.id;
    const movidos = reindexar(moverItem(itens, de, para));
    atualizar((anterior) => ({
      ...anterior,
      itensConteudo: [
        ...anterior.itensConteudo.filter((i) => i.ofertaId !== ofertaId),
        ...movidos,
      ],
    }));
  }

  function editarCriterio(
    tipo: TipoCriterioAvanco,
    mudanca: Partial<CriterioAvanco>,
  ) {
    if (!oferta) return;
    const ofertaId = oferta.id;
    atualizar((anterior) => ({
      ...anterior,
      ofertas: anterior.ofertas.map((o) =>
        o.id === ofertaId
          ? {
              ...o,
              criterios: o.criterios.map((c) =>
                c.tipo === tipo ? { ...c, ...mudanca } : c,
              ),
            }
          : o,
      ),
    }));
  }

  const criteriosVisiveis = oferta
    ? oferta.criterios.filter((c) =>
        criterioFazSentido(c.tipo, itens, modalidade),
      )
    : [];
  const criteriosAtivos = criteriosVisiveis.filter((c) => c.ativo);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="conteudo-etapa">Etapa</Label>
          <Select value={etapaId} onValueChange={setEtapaIdBruto}>
            <SelectTrigger id="conteudo-etapa" className="h-10">
              <SelectValue>{etapa?.nome}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {etapasConteudo.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="conteudo-tema">Macrotema</Label>
          <Select value={temaId} onValueChange={setTemaIdBruto}>
            <SelectTrigger id="conteudo-tema" className="h-10">
              <SelectValue>{tema?.nome}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {temas.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="conteudo-modalidade">Modalidade</Label>
          <Select value={modalidadeId} onValueChange={setModalidadeIdBruto}>
            <SelectTrigger id="conteudo-modalidade" className="h-10">
              <SelectValue>{modalidade?.nome}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {modalidadesAtivas.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {itens.length} item(ns) cadastrado(s) para esta oferta.
          </p>
        </div>

        {itens.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nenhum item ainda. Use os botões abaixo para começar.
          </p>
        ) : (
          <ul className="space-y-3">
            {itens.map((item, i) => (
              <ItemArrastavel
                key={item.id}
                indice={i}
                total={itens.length}
                aoMover={moverItemDaOferta}
                rotulo={item.titulo}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <IconeItem tipo={item.tipo} />
                    <Input
                      value={item.titulo}
                      aria-label="Título do item"
                      onChange={(e) =>
                        editarItem(item.id, { titulo: e.target.value })
                      }
                      className="h-9 max-w-sm flex-1 font-medium"
                    />
                    <Badge variant="outline">
                      {ROTULO_TIPO_ITEM[item.tipo]}
                    </Badge>
                  </div>
                  <Textarea
                    value={item.descricao}
                    aria-label="Descrição do item"
                    placeholder="Descrição curta (opcional)"
                    onChange={(e) =>
                      editarItem(item.id, { descricao: e.target.value })
                    }
                    rows={1}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-atraso hover:bg-atraso-suave"
                    onClick={() => removerItem(item)}
                  >
                    <Trash2 className="size-4" /> Remover
                  </Button>
                </div>
              </ItemArrastavel>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setDialogo("video")}>
            <Film className="size-4" /> Aula em vídeo
          </Button>
          <Button variant="outline" onClick={() => setDialogo("texto")}>
            <FileText className="size-4" /> Texto-base
          </Button>
          <Button
            variant="outline"
            onClick={() => setDialogo("webconferencia")}
          >
            <Link2 className="size-4" /> Link de webconferência
          </Button>
          <Button variant="outline" onClick={() => setDialogo("tarefa")}>
            <ListChecks className="size-4" /> Tarefa
          </Button>
          <Button variant="outline" onClick={() => setDialogo("questionario")}>
            <ListTodo className="size-4" /> Questionário
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-3 font-medium">Critérios de avanço de fase</p>
        {criteriosVisiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cadastre itens acima para liberar os critérios que fazem sentido
            para eles.
          </p>
        ) : (
          <ul className="space-y-3">
            {criteriosVisiveis.map((c) => (
              <li key={c.tipo} className="flex flex-wrap items-center gap-3">
                <Switch
                  id={`crit-${c.tipo}`}
                  checked={c.ativo}
                  onCheckedChange={(v) => editarCriterio(c.tipo, { ativo: v })}
                />
                <Label htmlFor={`crit-${c.tipo}`} className="flex-1">
                  {ROTULO_CRITERIO[c.tipo]}
                </Label>
                {c.tipo === "presenca" && c.ativo ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={c.percentualMinimo ?? 0}
                      onChange={(e) =>
                        editarCriterio(c.tipo, {
                          percentualMinimo: Math.min(
                            100,
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        })
                      }
                      className="h-9 w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      % mínimo
                    </span>
                  </div>
                ) : null}
                {(c.tipo === "tarefa_validada" || c.tipo === "nota_minima") &&
                c.ativo ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={c.notaCorte ?? 0}
                      onChange={(e) =>
                        editarCriterio(c.tipo, {
                          notaCorte: Math.min(
                            10,
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        })
                      }
                      className="h-9 w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      nota de corte
                    </span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-sm text-muted-foreground">
          {criteriosAtivos.length === 0
            ? "O docente avança pela ordem da trilha — nenhum critério de conteúdo está ligado."
            : `O docente avança quando ${criteriosAtivos.map(fraseCriterio).join(", ")}.`}
        </p>
      </div>

      <DialogoVideo
        aberto={dialogo === "video"}
        aoFechar={() => setDialogo(null)}
        midiasExistentes={estado.midias.filter((m) => m.tipo === "video")}
        pessoaId={pessoaAtiva.id}
        aoAdicionar={adicionarItem}
      />
      <DialogoTexto
        aberto={dialogo === "texto"}
        aoFechar={() => setDialogo(null)}
        midiasExistentes={estado.midias.filter((m) => m.tipo === "texto")}
        pessoaId={pessoaAtiva.id}
        aoAdicionar={adicionarItem}
      />
      <DialogoWebconferencia
        aberto={dialogo === "webconferencia"}
        aoFechar={() => setDialogo(null)}
        pessoaId={pessoaAtiva.id}
        aoAdicionar={adicionarItem}
      />
      <DialogoTarefa
        aberto={dialogo === "tarefa"}
        aoFechar={() => setDialogo(null)}
        aoAdicionar={adicionarItem}
      />
      <DialogoQuestionario
        aberto={dialogo === "questionario"}
        aoFechar={() => setDialogo(null)}
        aoAdicionar={adicionarItem}
      />
    </div>
  );
}

const ROTULO_TIPO_ITEM: Record<ItemConteudo["tipo"], string> = {
  video: "Vídeo",
  texto: "Texto-base",
  webconferencia: "Webconferência",
  tarefa: "Tarefa",
  questionario: "Questionário",
};

function IconeItem({ tipo }: { tipo: ItemConteudo["tipo"] }) {
  const Icone =
    tipo === "video"
      ? Film
      : tipo === "texto"
        ? FileText
        : tipo === "webconferencia"
          ? Link2
          : tipo === "questionario"
            ? ListTodo
            : ListChecks;
  return (
    <Icone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
  );
}

/** Botão de upload simulado: barra de progresso com ref + cleanup, sem efeito colateral no updater de estado. */
function UploadSimulado({
  rotulo,
  aoConcluir,
}: {
  rotulo: string;
  aoConcluir: (arquivo: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);

  useEffect(
    () => () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    },
    [],
  );

  useEffect(() => {
    if (progresso === null || progresso < 100 || !arquivo) return undefined;
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    const alvo = arquivo;
    const timeout = setTimeout(() => {
      aoConcluir(alvo);
      setProgresso(null);
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progresso, arquivo]);

  function selecionar(file: File | undefined) {
    if (!file) return;
    setArquivo(file);
    setProgresso(0);
    intervaloRef.current = setInterval(() => {
      setProgresso((p) => Math.min(100, (p ?? 0) + 12 + Math.random() * 10));
    }, 180);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => selecionar(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        disabled={progresso !== null}
        onClick={() => inputRef.current?.click()}
      >
        <CloudUpload className="size-4" /> {rotulo}
      </Button>
      {progresso !== null ? (
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <p className="text-sm font-medium">{arquivo?.name}</p>
          <Progress value={progresso} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {progresso >= 100
              ? "Enviado ao Drive institucional. Registrando referência…"
              : `Enviando ao Drive institucional… ${Math.round(progresso)}%`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DialogoVideo({
  aberto,
  aoFechar,
  midiasExistentes,
  pessoaId,
  aoAdicionar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  midiasExistentes: Midia[];
  pessoaId: string;
  aoAdicionar: (
    midia: Midia | null,
    item: Omit<ItemConteudo, "id" | "ofertaId" | "ordem">,
  ) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [duracao, setDuracao] = useState("");
  const [usarExistente, setUsarExistente] = useState(false);

  function reiniciar() {
    setTitulo("");
    setDuracao("");
    setUsarExistente(false);
  }

  function concluirUpload(file: File) {
    const midiaId = novoId("midia");
    const midia: Midia = {
      id: midiaId,
      nome: file.name,
      tipo: "video",
      arquivoTipo: file.type || "video/mp4",
      tamanhoBytes: file.size,
      referenciaDrive: referenciaDriveParaMidia(midiaId, file.name),
      duracaoMin:
        duracao === "" ? undefined : Math.max(0, Number(duracao) || 0),
      enviadaEmISO: new Date().toISOString(),
      enviadaPorId: pessoaId,
    };
    aoAdicionar(midia, {
      tipo: "video",
      titulo: titulo || file.name,
      descricao: "",
      midiaId,
    });
    reiniciar();
    aoFechar();
  }

  function usarMidia(midia: Midia) {
    aoAdicionar(null, {
      tipo: "video",
      titulo: titulo || midia.nome,
      descricao: "",
      midiaId: midia.id,
    });
    reiniciar();
    aoFechar();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          reiniciar();
          aoFechar();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aula em vídeo</DialogTitle>
          <DialogDescription>
            O envio ao Drive institucional é simulado — ninguém copia link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="video-titulo">Título</Label>
            <Input
              id="video-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Aula 1 — Introdução"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-duracao">Duração em minutos (opcional)</Label>
            <Input
              id="video-duracao"
              type="number"
              min={0}
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
            />
          </div>

          {!usarExistente ? (
            <UploadSimulado
              rotulo="Escolher arquivo de vídeo"
              aoConcluir={concluirUpload}
            />
          ) : null}

          {midiasExistentes.length > 0 ? (
            <button
              type="button"
              className="text-xs text-accent-foreground underline underline-offset-2"
              onClick={() => setUsarExistente((v) => !v)}
            >
              {usarExistente
                ? "Enviar um novo arquivo"
                : "usar arquivo já enviado"}
            </button>
          ) : null}

          {usarExistente ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {midiasExistentes.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => usarMidia(m)}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-secondary"
                  >
                    {m.nome}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => (reiniciar(), aoFechar())}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoTexto({
  aberto,
  aoFechar,
  midiasExistentes,
  pessoaId,
  aoAdicionar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  midiasExistentes: Midia[];
  pessoaId: string;
  aoAdicionar: (
    midia: Midia | null,
    item: Omit<ItemConteudo, "id" | "ofertaId" | "ordem">,
  ) => void;
}) {
  const [origem, setOrigem] = useState<"escrever" | "anexar">("escrever");
  const [usarExistente, setUsarExistente] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  // Campo aditivo (D31), fora do texto literal da especificação — sujeito a
  // revisão com o cliente: confirmar se texto-base também deve ter link.
  const [linkApoio, setLinkApoio] = useState("");

  function reiniciar() {
    setOrigem("escrever");
    setUsarExistente(false);
    setTitulo("");
    setCorpo("");
    setLinkApoio("");
  }

  function salvarEscrito() {
    if (corpo.trim().length < 10) return;
    const midiaId = novoId("midia");
    const midia: Midia = {
      id: midiaId,
      nome: titulo || "Texto-base",
      tipo: "texto",
      corpo,
      enviadaEmISO: new Date().toISOString(),
      enviadaPorId: pessoaId,
    };
    aoAdicionar(midia, {
      tipo: "texto",
      titulo: titulo || "Texto-base",
      descricao: "",
      midiaId,
      linkApoio: linkApoio.trim() || undefined,
    });
    reiniciar();
    aoFechar();
  }

  function concluirUpload(file: File) {
    const midiaId = novoId("midia");
    const midia: Midia = {
      id: midiaId,
      nome: file.name,
      tipo: "texto",
      arquivoTipo: file.type || "application/pdf",
      tamanhoBytes: file.size,
      referenciaDrive: referenciaDriveParaMidia(midiaId, file.name),
      enviadaEmISO: new Date().toISOString(),
      enviadaPorId: pessoaId,
    };
    aoAdicionar(midia, {
      tipo: "texto",
      titulo: titulo || file.name,
      descricao: "",
      midiaId,
      linkApoio: linkApoio.trim() || undefined,
    });
    reiniciar();
    aoFechar();
  }

  function usarMidia(midia: Midia) {
    aoAdicionar(null, {
      tipo: "texto",
      titulo: titulo || midia.nome,
      descricao: "",
      midiaId: midia.id,
      linkApoio: linkApoio.trim() || undefined,
    });
    reiniciar();
    aoFechar();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          reiniciar();
          aoFechar();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Texto-base</DialogTitle>
          <DialogDescription>
            Escreva o texto direto no sistema ou anexe um arquivo já pronto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="texto-titulo">Título</Label>
            <Input
              id="texto-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Texto-base do tema"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="texto-link">
              Link externo ou material de apoio (opcional)
            </Label>
            <Input
              id="texto-link"
              value={linkApoio}
              onChange={(e) => setLinkApoio(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {!usarExistente ? (
            <>
              <RadioGroup
                value={origem}
                onValueChange={(v) => setOrigem(v as "escrever" | "anexar")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="escrever" id="origem-escrever" />
                  <Label htmlFor="origem-escrever">Escrever no sistema</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="anexar" id="origem-anexar" />
                  <Label htmlFor="origem-anexar">Anexar arquivo</Label>
                </div>
              </RadioGroup>

              {origem === "escrever" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="texto-corpo">Texto</Label>
                  <Textarea
                    id="texto-corpo"
                    value={corpo}
                    onChange={(e) => setCorpo(e.target.value)}
                    rows={6}
                    placeholder="Escreva o texto-base que o docente vai ler"
                  />
                </div>
              ) : (
                <UploadSimulado
                  rotulo="Escolher arquivo"
                  aoConcluir={concluirUpload}
                />
              )}
            </>
          ) : null}

          {midiasExistentes.length > 0 ? (
            <button
              type="button"
              className="text-xs text-accent-foreground underline underline-offset-2"
              onClick={() => setUsarExistente((v) => !v)}
            >
              {usarExistente
                ? "Criar um novo texto"
                : "usar arquivo já enviado"}
            </button>
          ) : null}

          {usarExistente ? (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {midiasExistentes.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => usarMidia(m)}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-secondary"
                  >
                    {m.nome}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => (reiniciar(), aoFechar())}>
            Cancelar
          </Button>
          {!usarExistente && origem === "escrever" ? (
            <Button onClick={salvarEscrito} disabled={corpo.trim().length < 10}>
              Salvar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoWebconferencia({
  aberto,
  aoFechar,
  pessoaId,
  aoAdicionar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  pessoaId: string;
  aoAdicionar: (
    midia: Midia | null,
    item: Omit<ItemConteudo, "id" | "ofertaId" | "ordem">,
  ) => void;
}) {
  const [rotulo, setRotulo] = useState("");
  const [url, setUrl] = useState("");

  function reiniciar() {
    setRotulo("");
    setUrl("");
  }

  function salvar() {
    if (!url.trim() || !rotulo.trim()) return;
    const midiaId = novoId("midia");
    const midia: Midia = {
      id: midiaId,
      nome: rotulo,
      tipo: "link",
      url: url.trim(),
      enviadaEmISO: new Date().toISOString(),
      enviadaPorId: pessoaId,
    };
    aoAdicionar(midia, {
      tipo: "webconferencia",
      titulo: rotulo,
      descricao: "",
      midiaId,
    });
    reiniciar();
    aoFechar();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          reiniciar();
          aoFechar();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link de webconferência</DialogTitle>
          <DialogDescription>
            O docente entra no encontro por este link, direto da tela dele.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="webconf-rotulo">Rótulo do encontro</Label>
            <Input
              id="webconf-rotulo"
              value={rotulo}
              onChange={(e) => setRotulo(e.target.value)}
              placeholder="Ex.: Encontro síncrono — Turma A"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="webconf-url">URL</Label>
            <Input
              id="webconf-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => (reiniciar(), aoFechar())}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!url.trim() || !rotulo.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoTarefa({
  aberto,
  aoFechar,
  aoAdicionar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoAdicionar: (
    midia: Midia | null,
    item: Omit<ItemConteudo, "id" | "ofertaId" | "ordem">,
  ) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [linkApoio, setLinkApoio] = useState("");

  function reiniciar() {
    setTitulo("");
    setEnunciado("");
    setLinkApoio("");
  }

  function salvar() {
    if (!titulo.trim() || enunciado.trim().length < 10) return;
    aoAdicionar(null, {
      tipo: "tarefa",
      titulo,
      descricao: "",
      enunciado,
      linkApoio: linkApoio.trim() || undefined,
    });
    reiniciar();
    aoFechar();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          reiniciar();
          aoFechar();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tarefa-titulo">Título</Label>
            <Input
              id="tarefa-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Registro da prática experimentada"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tarefa-enunciado">Enunciado</Label>
            <Textarea
              id="tarefa-enunciado"
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              rows={4}
              placeholder="O que o docente precisa fazer e entregar"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tarefa-link">
              Link externo ou material de apoio (opcional)
            </Label>
            <Input
              id="tarefa-link"
              value={linkApoio}
              onChange={(e) => setLinkApoio(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => (reiniciar(), aoFechar())}>
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={!titulo.trim() || enunciado.trim().length < 10}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Questionário: perguntas de múltipla escolha, sem campo de resposta aberta
 * (D31) — distinto de tarefa, que continua sendo enunciado + entrega livre.
 */
function DialogoQuestionario({
  aberto,
  aoFechar,
  aoAdicionar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoAdicionar: (
    midia: Midia | null,
    item: Omit<ItemConteudo, "id" | "ofertaId" | "ordem">,
  ) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [perguntas, setPerguntas] = useState<PerguntaOpcaoMultipla[]>([]);

  function reiniciar() {
    setTitulo("");
    setPerguntas([]);
  }

  function adicionarPergunta() {
    setPerguntas((atual) => [
      ...atual,
      {
        id: novoId("pgq"),
        enunciado: "",
        opcoes: ["", ""],
        ordem: atual.length,
      },
    ]);
  }

  function editarPergunta(id: string, mudanca: Partial<PerguntaOpcaoMultipla>) {
    setPerguntas((atual) =>
      atual.map((p) => (p.id === id ? { ...p, ...mudanca } : p)),
    );
  }

  function removerPergunta(id: string) {
    setPerguntas((atual) => atual.filter((p) => p.id !== id));
  }

  function editarOpcao(perguntaId: string, indice: number, valor: string) {
    setPerguntas((atual) =>
      atual.map((p) =>
        p.id === perguntaId
          ? { ...p, opcoes: p.opcoes.map((o, i) => (i === indice ? valor : o)) }
          : p,
      ),
    );
  }

  function adicionarOpcao(perguntaId: string) {
    setPerguntas((atual) =>
      atual.map((p) =>
        p.id === perguntaId ? { ...p, opcoes: [...p.opcoes, ""] } : p,
      ),
    );
  }

  function removerOpcao(perguntaId: string, indice: number) {
    setPerguntas((atual) =>
      atual.map((p) =>
        p.id === perguntaId
          ? { ...p, opcoes: p.opcoes.filter((_, i) => i !== indice) }
          : p,
      ),
    );
  }

  const valido =
    titulo.trim().length > 0 &&
    perguntas.length > 0 &&
    perguntas.every(
      (p) =>
        p.enunciado.trim().length > 0 &&
        p.opcoes.filter((o) => o.trim()).length >= 2,
    );

  function salvar() {
    if (!valido) return;
    aoAdicionar(null, {
      tipo: "questionario",
      titulo,
      descricao: "",
      perguntas: perguntas.map((p, i) => ({
        ...p,
        ordem: i,
        opcoes: p.opcoes.filter((o) => o.trim()),
      })),
    });
    reiniciar();
    aoFechar();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          reiniciar();
          aoFechar();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Questionário</DialogTitle>
          <DialogDescription>
            Perguntas de múltipla escolha — sem campo de resposta aberta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="questionario-titulo">Título</Label>
            <Input
              id="questionario-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Verificação de leitura"
            />
          </div>

          <div className="space-y-3">
            {perguntas.map((pergunta, i) => (
              <div
                key={pergunta.id}
                className="space-y-2 rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={pergunta.enunciado}
                    aria-label={`Enunciado da pergunta ${i + 1}`}
                    placeholder={`Pergunta ${i + 1}`}
                    onChange={(e) =>
                      editarPergunta(pergunta.id, { enunciado: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-atraso hover:bg-atraso-suave"
                    onClick={() => removerPergunta(pergunta.id)}
                    aria-label="Remover pergunta"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="space-y-1.5 pl-2">
                  {pergunta.opcoes.map((opcao, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <Input
                        value={opcao}
                        aria-label={`Opção ${oi + 1} da pergunta ${i + 1}`}
                        placeholder={`Opção ${oi + 1}`}
                        onChange={(e) =>
                          editarOpcao(pergunta.id, oi, e.target.value)
                        }
                        className="h-9 flex-1"
                      />
                      {pergunta.opcoes.length > 2 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => removerOpcao(pergunta.id, oi)}
                          aria-label="Remover opção"
                        >
                          <X className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adicionarOpcao(pergunta.id)}
                  >
                    <Plus className="size-3.5" /> Opção
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={adicionarPergunta}>
            <Plus className="size-4" /> Adicionar pergunta
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => (reiniciar(), aoFechar())}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!valido}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
