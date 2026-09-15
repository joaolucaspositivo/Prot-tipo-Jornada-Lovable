import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CHAVE_STORAGE, VERSAO_ESTADO, criarEstadoInicial } from "./seed";
import type { EstadoApp, PerfilId, Pessoa } from "./types";

interface StoreContexto {
  estado: EstadoApp;
  /** true depois que o estado salvo no navegador foi carregado */
  pronto: boolean;
  atualizar: (
    mudanca: Partial<EstadoApp> | ((e: EstadoApp) => EstadoApp),
  ) => void;
  trocarPerfil: (perfil: PerfilId) => void;
  resetarDemonstracao: () => void;
  pessoaAtiva: Pessoa;
}

const Ctx = createContext<StoreContexto | null>(null);

/** Cada perfil de demonstração aponta para uma pessoa mock do seed. */
export const PESSOA_PADRAO_POR_PERFIL: Record<PerfilId, string> = {
  "docente-regente": "doc-1",
  "docente-corregente": "doc-4",
  coordenador: "coord-1",
  operadora: "oper-1",
  diretor: "dir-1",
  moderador: "mod-1",
};

export const ROTULO_PERFIL: Record<PerfilId, string> = {
  "docente-regente": "Docente (regente)",
  "docente-corregente": "Docente (corregente)",
  coordenador: "Coordenador / líder",
  operadora: "Equipe operadora",
  diretor: "Diretor de unidade",
  // Rótulo provisório (D33) — trocar para "Mediador" fica fácil: só este mapa.
  moderador: "Moderador de turma",
};

function carregar(): EstadoApp | null {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as EstadoApp;
    if (dados?.versao !== VERSAO_ESTADO) return null;
    return dados;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoApp>(() => criarEstadoInicial());
  const [pronto, setPronto] = useState(false);

  // localStorage só existe no navegador: lemos depois da hidratação.
  useEffect(() => {
    const salvo = carregar();
    if (salvo) setEstado(salvo);
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
    } catch {
      /* espaço cheio ou modo restrito: o protótipo segue em memória */
    }
  }, [estado, pronto]);

  const atualizar = useCallback<StoreContexto["atualizar"]>((mudanca) => {
    setEstado((anterior) =>
      typeof mudanca === "function"
        ? mudanca(anterior)
        : { ...anterior, ...mudanca },
    );
  }, []);

  const trocarPerfil = useCallback((perfil: PerfilId) => {
    setEstado((anterior) => ({
      ...anterior,
      perfilAtivo: perfil,
      pessoaAtivaId: PESSOA_PADRAO_POR_PERFIL[perfil],
    }));
  }, []);

  const resetarDemonstracao = useCallback(() => {
    const novo = criarEstadoInicial();
    setEstado(novo);
  }, []);

  const pessoaAtiva = useMemo(() => {
    return (
      estado.pessoas.find((p) => p.id === estado.pessoaAtivaId) ??
      estado.pessoas[0]!
    );
  }, [estado.pessoas, estado.pessoaAtivaId]);

  const valor = useMemo(
    () => ({
      estado,
      pronto,
      atualizar,
      trocarPerfil,
      resetarDemonstracao,
      pessoaAtiva,
    }),
    [estado, pronto, atualizar, trocarPerfil, resetarDemonstracao, pessoaAtiva],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
