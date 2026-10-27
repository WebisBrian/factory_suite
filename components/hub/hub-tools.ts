export type HubIconName = "home" | "screendraft" | "generator" | "animations";

export type HubNavItem = {
  href: string;
  label: string;
  icon: HubIconName;
};

export type HubTool = HubNavItem & {
  step: number;
  description: string;
  squad: string;
};

export const HUB_TOOLS: readonly HubTool[] = [
  {
    step: 1,
    href: "/screendraft",
    label: "Screendraft",
    icon: "screendraft",
    squad: "Screendraft",
    description:
      "Dessinez la maquette de l'interface et exportez-la en JSON structuré.",
  },
  {
    step: 2,
    href: "/generator",
    label: "Générateur",
    icon: "generator",
    squad: "Générateur",
    description:
      "Transformez la maquette JSON en HTML/CSS prêt à l'emploi.",
  },
  {
    step: 3,
    href: "/animations",
    label: "Animations",
    icon: "animations",
    squad: "Animations",
    description:
      "Ajoutez événements et animations au HTML/CSS généré.",
  },
];

export const HUB_NAV_ITEMS: readonly HubNavItem[] = [
  { href: "/", label: "Accueil", icon: "home" },
  ...HUB_TOOLS,
];
