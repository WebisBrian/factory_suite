import type { Metadata } from "next";
import "./theme.css";

export const metadata: Metadata = {
  title: "Screen Draft",
  description: "Créez des maquettes de sites web à partir de composants.",
};

export default function ScreenDraftLayout({
  children,
}: LayoutProps<"/screen-draft">) {
  return <div className="screen-draft">{children}</div>;
}
