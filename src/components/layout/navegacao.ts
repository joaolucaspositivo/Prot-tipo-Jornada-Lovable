import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  FileUp,
  FolderUp,
  Gauge,
  History,
  LayoutDashboard,
  Map,
  MessagesSquare,
  Notebook,
  PlayCircle,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { PerfilId } from "@/data/types";

export interface ItemNav {
  para: string;
  rotulo: string;
  Icone: typeof Users;
}

const painel: ItemNav = {
  para: "/",
  rotulo: "Painel",
  Icone: LayoutDashboard,
};

export const NAVEGACAO_POR_PERFIL: Record<PerfilId, ItemNav[]> = {
  "docente-regente": [
    painel,
    { para: "/acesso", rotulo: "Acesso ao ciclo", Icone: ShieldCheck },
    { para: "/jornada", rotulo: "Minha Jornada", Icone: Map },
    { para: "/autoavaliacao", rotulo: "Autoavaliação", Icone: ClipboardList },
    { para: "/percurso", rotulo: "Escolha do percurso", Icone: Compass },
    { para: "/aulas", rotulo: "Aulas e texto-base", Icone: PlayCircle },
    { para: "/entrega", rotulo: "Envio da tarefa", Icone: FileUp },
    { para: "/portfolio", rotulo: "Portfólio do ciclo", Icone: Notebook },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
    { para: "/historico", rotulo: "Ciclos anteriores", Icone: History },
  ],
  "docente-corregente": [
    painel,
    { para: "/acesso", rotulo: "Acesso ao ciclo", Icone: ShieldCheck },
    { para: "/jornada", rotulo: "Minha Jornada", Icone: Map },
    { para: "/autoavaliacao", rotulo: "Autoavaliação", Icone: ClipboardList },
    { para: "/percurso", rotulo: "Escolha do percurso", Icone: Compass },
    { para: "/aulas", rotulo: "Aulas e texto-base", Icone: PlayCircle },
    { para: "/entrega", rotulo: "Envio da tarefa", Icone: FileUp },
    { para: "/portfolio", rotulo: "Portfólio do ciclo", Icone: Notebook },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
    { para: "/historico", rotulo: "Ciclos anteriores", Icone: History },
  ],
  coordenador: [
    painel,
    { para: "/equipe", rotulo: "Minha equipe", Icone: Users },
    { para: "/agenda", rotulo: "Agenda de observações", Icone: CalendarDays },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
  ],
  operadora: [
    painel,
    {
      para: "/configuracao",
      rotulo: "Configuração do Ciclo",
      Icone: Settings2,
    },
    { para: "/gestao", rotulo: "Gestão do ciclo", Icone: Gauge },
    { para: "/conteudo", rotulo: "Conteúdo do ciclo", Icone: FolderUp },
    { para: "/enquete", rotulo: "Enquete 360°", Icone: MessagesSquare },
  ],
  diretor: [
    painel,
    { para: "/unidade", rotulo: "Minha unidade", Icone: BookOpen },
  ],
};
