// Declarative renderer contract. Kept in sync by componentRegistry.test.js.
export interface UiPropertyRule { type: string; required?: boolean; defaultValue?: unknown; min?: number; max?: number; options?: Array<{ value: unknown; label: string }>; label?: string }
export interface UiComponentRule { propertiesSchema: Record<string, UiPropertyRule>; allowedChildren: '*' | string[]; bindingCapabilities: string[]; supportedActions: string[] }
export const UI_COMPONENT_REGISTRY: Record<string, UiComponentRule> = {
  "Container": {
    "propertiesSchema": {
      "padding": {
        "type": "select",
        "label": "Espacement interne",
        "options": [
          {
            "value": "none",
            "label": "Aucun"
          },
          {
            "value": "sm",
            "label": "Petit"
          },
          {
            "value": "md",
            "label": "Moyen"
          },
          {
            "value": "lg",
            "label": "Large"
          }
        ],
        "defaultValue": "md"
      },
      "gap": {
        "type": "select",
        "label": "Écart entre éléments",
        "options": [
          {
            "value": "none",
            "label": "Aucun"
          },
          {
            "value": "sm",
            "label": "Petit"
          },
          {
            "value": "md",
            "label": "Moyen"
          },
          {
            "value": "lg",
            "label": "Large"
          }
        ],
        "defaultValue": "md"
      },
      "align": {
        "type": "select",
        "label": "Alignement",
        "options": [
          {
            "value": "start",
            "label": "Début"
          },
          {
            "value": "center",
            "label": "Centré"
          },
          {
            "value": "end",
            "label": "Fin"
          }
        ],
        "defaultValue": "start"
      }
    },
    "allowedChildren": "*",
    "bindingCapabilities": [],
    "supportedActions": []
  },
  "Section": {
    "propertiesSchema": {
      "title": {
        "type": "text",
        "label": "Titre de section"
      },
      "padding": {
        "type": "select",
        "label": "Espacement interne",
        "options": [
          {
            "value": "none",
            "label": "Aucun"
          },
          {
            "value": "sm",
            "label": "Petit"
          },
          {
            "value": "md",
            "label": "Moyen"
          },
          {
            "value": "lg",
            "label": "Large"
          }
        ],
        "defaultValue": "md"
      }
    },
    "allowedChildren": "*",
    "bindingCapabilities": [
      "title"
    ],
    "supportedActions": []
  },
  "Card": {
    "propertiesSchema": {
      "title": {
        "type": "text",
        "label": "Titre"
      },
      "description": {
        "type": "text",
        "label": "Sous-titre"
      },
      "padding": {
        "type": "select",
        "label": "Espacement interne",
        "options": [
          {
            "value": "none",
            "label": "Aucun"
          },
          {
            "value": "sm",
            "label": "Petit"
          },
          {
            "value": "md",
            "label": "Moyen"
          },
          {
            "value": "lg",
            "label": "Large"
          }
        ],
        "defaultValue": "md"
      }
    },
    "allowedChildren": "*",
    "bindingCapabilities": [
      "title",
      "description"
    ],
    "supportedActions": [
      "NAVIGATE",
      "OPEN_MODAL"
    ]
  },
  "Grid": {
    "propertiesSchema": {
      "columns": {
        "type": "number",
        "label": "Colonnes",
        "min": 1,
        "max": 6,
        "defaultValue": 2
      },
      "gap": {
        "type": "select",
        "label": "Écart",
        "options": [
          {
            "value": "none",
            "label": "Aucun"
          },
          {
            "value": "sm",
            "label": "Petit"
          },
          {
            "value": "md",
            "label": "Moyen"
          },
          {
            "value": "lg",
            "label": "Large"
          }
        ],
        "defaultValue": "md"
      }
    },
    "allowedChildren": "*",
    "bindingCapabilities": [],
    "supportedActions": []
  },
  "Stack": {
    "propertiesSchema": {
      "gap": {
        "type": "select",
        "label": "Écart",
        "options": [
          {
            "value": "none",
            "label": "Aucun"
          },
          {
            "value": "sm",
            "label": "Petit"
          },
          {
            "value": "md",
            "label": "Moyen"
          },
          {
            "value": "lg",
            "label": "Large"
          }
        ],
        "defaultValue": "md"
      },
      "align": {
        "type": "select",
        "label": "Alignement",
        "options": [
          {
            "value": "start",
            "label": "Début"
          },
          {
            "value": "center",
            "label": "Centré"
          },
          {
            "value": "end",
            "label": "Fin"
          }
        ],
        "defaultValue": "start"
      }
    },
    "allowedChildren": "*",
    "bindingCapabilities": [],
    "supportedActions": []
  },
  "Heading": {
    "propertiesSchema": {
      "text": {
        "type": "text",
        "label": "Texte",
        "required": true
      },
      "level": {
        "type": "select",
        "label": "Niveau",
        "options": [
          {
            "value": 1,
            "label": "H1"
          },
          {
            "value": 2,
            "label": "H2"
          },
          {
            "value": 3,
            "label": "H3"
          },
          {
            "value": 4,
            "label": "H4"
          }
        ],
        "defaultValue": 2
      },
      "align": {
        "type": "select",
        "label": "Alignement",
        "options": [
          {
            "value": "start",
            "label": "Début"
          },
          {
            "value": "center",
            "label": "Centré"
          },
          {
            "value": "end",
            "label": "Fin"
          }
        ],
        "defaultValue": "start"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "text"
    ],
    "supportedActions": []
  },
  "Text": {
    "propertiesSchema": {
      "text": {
        "type": "text",
        "label": "Texte",
        "required": true
      },
      "tone": {
        "type": "select",
        "label": "Intensité",
        "options": [
          {
            "value": "default",
            "label": "Normal"
          },
          {
            "value": "muted",
            "label": "Atténué"
          },
          {
            "value": "strong",
            "label": "Accentué"
          }
        ],
        "defaultValue": "default"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "text"
    ],
    "supportedActions": []
  },
  "Input": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé"
      },
      "placeholder": {
        "type": "text",
        "label": "Placeholder"
      },
      "inputType": {
        "type": "select",
        "label": "Type",
        "options": [
          {
            "value": "text",
            "label": "Texte"
          },
          {
            "value": "email",
            "label": "E-mail"
          },
          {
            "value": "number",
            "label": "Nombre"
          },
          {
            "value": "tel",
            "label": "Téléphone"
          },
          {
            "value": "url",
            "label": "URL"
          }
        ],
        "defaultValue": "text"
      },
      "required": {
        "type": "boolean",
        "label": "Requis",
        "defaultValue": false
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "value"
    ],
    "supportedActions": []
  },
  "Textarea": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé"
      },
      "placeholder": {
        "type": "text",
        "label": "Placeholder"
      },
      "rows": {
        "type": "number",
        "label": "Lignes",
        "min": 2,
        "max": 12,
        "defaultValue": 3
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "value"
    ],
    "supportedActions": []
  },
  "Select": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé"
      },
      "placeholder": {
        "type": "text",
        "label": "Option vide"
      },
      "options": {
        "type": "textList",
        "label": "Options (une par ligne)"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "value"
    ],
    "supportedActions": []
  },
  "Checkbox": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé",
        "required": true
      },
      "checked": {
        "type": "boolean",
        "label": "Cochée par défaut",
        "defaultValue": false
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "value"
    ],
    "supportedActions": []
  },
  "DatePicker": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "value"
    ],
    "supportedActions": []
  },
  "FormField": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé"
      },
      "placeholder": {
        "type": "text",
        "label": "Placeholder"
      },
      "required": {
        "type": "boolean",
        "label": "Requis",
        "defaultValue": false
      },
      "readonly": {
        "type": "boolean",
        "label": "Lecture seule",
        "defaultValue": false
      },
      "inputType": {
        "type": "select",
        "label": "Type de saisie",
        "options": [
          {
            "value": "text",
            "label": "Texte"
          },
          {
            "value": "email",
            "label": "E-mail"
          },
          {
            "value": "number",
            "label": "Nombre"
          },
          {
            "value": "date",
            "label": "Date"
          }
        ],
        "defaultValue": "text"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "value"
    ],
    "supportedActions": []
  },
  "Form": {
    "propertiesSchema": {
      "title": {
        "type": "text",
        "label": "Titre du formulaire"
      },
      "submitLabel": {
        "type": "text",
        "label": "Libellé du bouton",
        "defaultValue": "Enregistrer"
      },
      "cancelLabel": {
        "type": "text",
        "label": "Libellé d’annulation",
        "defaultValue": "Annuler"
      }
    },
    "allowedChildren": [
      "FormField",
      "Input",
      "Textarea",
      "Select",
      "Checkbox",
      "DatePicker",
      "Button",
      "Text"
    ],
    "bindingCapabilities": [],
    "supportedActions": [
      "CREATE_RECORD",
      "UPDATE_RECORD",
      "DELETE_RECORD",
      "TRIGGER_AUTOMATION",
      "CLOSE_MODAL",
      "SHOW_NOTIFICATION",
      "NAVIGATE"
    ]
  },
  "DataTable": {
    "propertiesSchema": {
      "title": {
        "type": "text",
        "label": "Titre"
      },
      "pageSize": {
        "type": "number",
        "label": "Lignes par page",
        "min": 5,
        "max": 100,
        "defaultValue": 20
      },
      "emptyMessage": {
        "type": "text",
        "label": "Message liste vide",
        "defaultValue": "Aucun enregistrement"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "rows"
    ],
    "supportedActions": [
      "NAVIGATE",
      "REFRESH_DATA"
    ]
  },
  "Badge": {
    "propertiesSchema": {
      "text": {
        "type": "text",
        "label": "Texte",
        "required": true
      },
      "tone": {
        "type": "select",
        "label": "Tonalité",
        "options": [
          {
            "value": "neutral",
            "label": "Neutre"
          },
          {
            "value": "blue",
            "label": "Bleu"
          },
          {
            "value": "green",
            "label": "Vert"
          },
          {
            "value": "amber",
            "label": "Ambre"
          },
          {
            "value": "rose",
            "label": "Rose"
          }
        ],
        "defaultValue": "neutral"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "text"
    ],
    "supportedActions": []
  },
  "Alert": {
    "propertiesSchema": {
      "title": {
        "type": "text",
        "label": "Titre"
      },
      "message": {
        "type": "text",
        "label": "Message",
        "required": true
      },
      "tone": {
        "type": "select",
        "label": "Tonalité",
        "options": [
          {
            "value": "info",
            "label": "Info"
          },
          {
            "value": "success",
            "label": "Succès"
          },
          {
            "value": "warning",
            "label": "Attention"
          },
          {
            "value": "danger",
            "label": "Critique"
          }
        ],
        "defaultValue": "info"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "message"
    ],
    "supportedActions": []
  },
  "Image": {
    "propertiesSchema": {
      "src": {
        "type": "text",
        "label": "URL de l’image"
      },
      "alt": {
        "type": "text",
        "label": "Texte alternatif",
        "required": true
      },
      "height": {
        "type": "number",
        "label": "Hauteur (px)",
        "min": 40,
        "max": 600,
        "defaultValue": 160
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [],
    "supportedActions": []
  },
  "Link": {
    "propertiesSchema": {
      "text": {
        "type": "text",
        "label": "Texte",
        "required": true
      },
      "href": {
        "type": "text",
        "label": "Cible",
        "required": true
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [
      "text"
    ],
    "supportedActions": []
  },
  "Tabs": {
    "propertiesSchema": {
      "tabs": {
        "type": "textList",
        "label": "Onglets (un par ligne)"
      }
    },
    "allowedChildren": [
      "Section",
      "Card"
    ],
    "bindingCapabilities": [],
    "supportedActions": []
  },
  "Spinner": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [],
    "supportedActions": []
  },
  "Button": {
    "propertiesSchema": {
      "label": {
        "type": "text",
        "label": "Libellé",
        "required": true
      },
      "variant": {
        "type": "select",
        "label": "Style",
        "options": [
          {
            "value": "primary",
            "label": "Principal"
          },
          {
            "value": "secondary",
            "label": "Secondaire"
          },
          {
            "value": "ghost",
            "label": "Discret"
          },
          {
            "value": "danger",
            "label": "Danger"
          }
        ],
        "defaultValue": "primary"
      },
      "size": {
        "type": "select",
        "label": "Taille",
        "options": [
          {
            "value": "sm",
            "label": "Petit"
          },
          {
            "value": "md",
            "label": "Moyen"
          },
          {
            "value": "lg",
            "label": "Large"
          }
        ],
        "defaultValue": "md"
      }
    },
    "allowedChildren": [],
    "bindingCapabilities": [],
    "supportedActions": [
      "NAVIGATE",
      "REFRESH_DATA",
      "SET_VARIABLE",
      "SHOW_NOTIFICATION",
      "OPEN_MODAL",
      "OPEN_DRAWER",
      "CLOSE_MODAL",
      "TRIGGER_AUTOMATION",
      "CREATE_RECORD",
      "UPDATE_RECORD",
      "DELETE_RECORD"
    ]
  }
};
