import type { Maquette } from "@/components/screendraft/screendraft-schema";

// Maquette de démo, en attendant que le Hub publie maquetteFixture dans @/lib/fixtures.
export const maquetteFixture: Maquette = {
  schemaVersion: 2,
  id: "doc_landing_example",
  name: "Landing page — exemple",
  theme: {
    colors: {
      primary: "#4f46e5",
      onPrimary: "#ffffff",
      text: "#0f172a",
      background: "#ffffff",
      surface: "#ffffff",
      border: "#e2e8f0"
    },
    textSizes: {
      heading1: 56,
      heading2: 36,
      heading3: 24,
      body: 16
    },
    radius: 12
  },
  screens: [
    {
      id: "screen_home",
      name: "Accueil",
      path: "index.html",
      frame: {
        device: "desktop",
        width: 1440,
        height: 1200,
        backgroundColor: "#ffffff",
        themeLinks: {
          backgroundColor: "background"
        }
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
              themeLinks: {
                fontSize: "heading1"
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
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 600,
                textAlign: "center",
                borderRadius: 12
              },
              themeLinks: {
                backgroundColor: "primary",
                color: "onPrimary",
                borderRadius: "radius"
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
              themeLinks: {
                color: "text",
                fontSize: "heading2"
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
              themeLinks: {
                backgroundColor: "surface",
                borderColor: "border"
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
                  themeLinks: {
                    color: "text",
                    fontSize: "heading3"
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
                  themeLinks: {
                    fontSize: "body"
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
              themeLinks: {
                backgroundColor: "surface",
                borderColor: "border"
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
                  themeLinks: {
                    color: "text",
                    fontSize: "heading3"
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
                  themeLinks: {
                    fontSize: "body"
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
              themeLinks: {
                backgroundColor: "surface",
                borderColor: "border"
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
                  themeLinks: {
                    color: "text",
                    fontSize: "heading3"
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
                  themeLinks: {
                    fontSize: "body"
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
            label: "Contact",
            href: "contact.html",
            targetScreenId: "screen_contact"
          }
        }
      ]
    },
    {
      id: "screen_contact",
      name: "Contact",
      path: "contact.html",
      frame: {
        device: "mobile",
        width: 393,
        height: 852,
        backgroundColor: "#ffffff",
        themeLinks: {
          backgroundColor: "background"
        }
      },
      nodes: [
        {
          id: "button_contact_back",
          type: "button",
          x: 24,
          y: 16,
          width: 120,
          height: 36,
          style: {
            backgroundColor: "#ffffff",
            color: "#4f46e5",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "center",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#4f46e5"
          },
          themeLinks: {
            color: "primary",
            borderColor: "primary"
          },
          props: {
            label: "← Accueil",
            href: "index.html",
            targetScreenId: "screen_home"
          }
        },
        {
          id: "title_contact",
          type: "title",
          x: 24,
          y: 64,
          width: 345,
          height: 48,
          style: {
            color: "#0f172a",
            fontSize: 32,
            fontWeight: 700,
            textAlign: "left"
          },
          themeLinks: {
            color: "text"
          },
          props: {
            text: "Contact",
            level: 1
          }
        },
        {
          id: "text_contact",
          type: "text",
          x: 24,
          y: 128,
          width: 345,
          height: 72,
          style: {
            color: "#334155",
            fontSize: 16,
            fontWeight: 400,
            textAlign: "left"
          },
          themeLinks: {
            fontSize: "body"
          },
          props: {
            text: "Une question sur la maquette ? Écrivez-nous, réponse sous 24 h."
          }
        },
        {
          id: "button_contact_send",
          type: "button",
          x: 24,
          y: 224,
          width: 345,
          height: 52,
          style: {
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 600,
            textAlign: "center",
            borderRadius: 10
          },
          themeLinks: {
            backgroundColor: "primary",
            color: "onPrimary"
          },
          props: {
            label: "Nous écrire"
          }
        }
      ]
    }
  ]
};
