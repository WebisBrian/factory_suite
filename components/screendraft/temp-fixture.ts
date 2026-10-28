import type { Maquette } from "@/components/screendraft/screendraft-schema";

// Maquette de démo, en attendant que le Hub publie maquetteFixture dans @/lib/fixtures.
export const maquetteFixture: Maquette = {
  schemaVersion: 1,
  id: "doc_landing_example",
  name: "Landing page — exemple",
  frame: {
    device: "desktop",
    width: 1440,
    height: 1200,
    backgroundColor: "#ffffff"
  },
  nodes: [
    {
      id: "section_hero",
      type: "section",
      x: 0,
      y: 0,
      width: 1440,
      height: 640,
      style: {
        backgroundColor: "#0f172a"
      },
      children: [
        {
          id: "image_hero",
          type: "image",
          x: 840,
          y: 120,
          width: 480,
          height: 400,
          style: {
            borderRadius: 24
          },
          props: {
            src: "https://placehold.co/960x800",
            alt: "Aperçu de l'éditeur",
            fit: "cover"
          }
        },
        {
          id: "title_hero",
          type: "title",
          x: 120,
          y: 176,
          width: 640,
          height: 136,
          style: {
            color: "#ffffff",
            fontSize: 56,
            fontWeight: 700
          },
          props: {
            text: "Donnez vie à vos idées de site web",
            level: 1
          }
        },
        {
          id: "text_hero",
          type: "text",
          x: 120,
          y: 336,
          width: 560,
          height: 64,
          style: {
            color: "#cbd5e1",
            fontSize: 20
          },
          props: {
            text: "Créez des maquettes modernes et épurées, puis exportez-les en JSON."
          }
        },
        {
          id: "button_hero",
          type: "button",
          x: 120,
          y: 432,
          width: 200,
          height: 56,
          style: {
            backgroundColor: "#6366f1",
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 600,
            textAlign: "center",
            borderRadius: 12
          },
          props: {
            label: "Commencer",
            href: "#features"
          }
        }
      ]
    },
    {
      id: "section_features",
      type: "section",
      x: 0,
      y: 640,
      width: 1440,
      height: 560,
      style: {
        backgroundColor: "#f8fafc"
      },
      children: [
        {
          id: "title_features",
          type: "title",
          x: 120,
          y: 80,
          width: 600,
          height: 48,
          style: {
            color: "#0f172a",
            fontSize: 36,
            fontWeight: 700
          },
          props: {
            text: "Pensé pour les équipes web",
            level: 2
          }
        },
        {
          id: "card_components",
          type: "section",
          x: 120,
          y: 176,
          width: 384,
          height: 288,
          style: {
            backgroundColor: "#ffffff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#e2e8f0"
          },
          children: [
            {
              id: "card_components_title",
              type: "title",
              x: 32,
              y: 32,
              width: 320,
              height: 32,
              style: {
                color: "#0f172a",
                fontSize: 24,
                fontWeight: 600
              },
              props: {
                text: "Composants de base",
                level: 3
              }
            },
            {
              id: "card_components_text",
              type: "text",
              x: 32,
              y: 80,
              width: 320,
              height: 96,
              style: {
                color: "#475569",
                fontSize: 16
              },
              props: {
                text: "Texte, image, bouton, section et titre, à placer librement."
              }
            }
          ]
        },
        {
          id: "card_positioning",
          type: "section",
          x: 528,
          y: 176,
          width: 384,
          height: 288,
          style: {
            backgroundColor: "#ffffff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#e2e8f0"
          },
          children: [
            {
              id: "card_positioning_title",
              type: "title",
              x: 32,
              y: 32,
              width: 320,
              height: 32,
              style: {
                color: "#0f172a",
                fontSize: 24,
                fontWeight: 600
              },
              props: {
                text: "Positionnement libre",
                level: 3
              }
            },
            {
              id: "card_positioning_text",
              type: "text",
              x: 32,
              y: 80,
              width: 320,
              height: 96,
              style: {
                color: "#475569",
                fontSize: 16
              },
              props: {
                text: "Placez chaque élément au pixel près, sur un format fixe."
              }
            }
          ]
        },
        {
          id: "card_export",
          type: "section",
          x: 936,
          y: 176,
          width: 384,
          height: 288,
          style: {
            backgroundColor: "#ffffff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#e2e8f0"
          },
          children: [
            {
              id: "card_export_title",
              type: "title",
              x: 32,
              y: 32,
              width: 320,
              height: 32,
              style: {
                color: "#0f172a",
                fontSize: 24,
                fontWeight: 600
              },
              props: {
                text: "Export JSON",
                level: 3
              }
            },
            {
              id: "card_export_text",
              type: "text",
              x: 32,
              y: 80,
              width: 320,
              height: 96,
              style: {
                color: "#475569",
                fontSize: 16
              },
              props: {
                text: "Un format standard, repris par l'équipe HTML pour générer le site."
              }
            }
          ]
        }
      ]
    },
    {
      id: "button_contact",
      type: "button",
      x: 1240,
      y: 32,
      width: 120,
      height: 44,
      style: {
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontSize: 16,
        fontWeight: 600,
        textAlign: "center",
        borderRadius: 22
      },
      props: {
        label: "Contact"
      }
    }
  ]
};
