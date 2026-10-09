export const CREDIT_RATE = 1;

export const PACKAGES = [
  {
    id: "start",
    name: "Start",
    credits: 25,
    price: 25,
    hint: "Cabe uma lavagem e uma secagem.",
  },
  {
    id: "pop",
    name: "Pop",
    credits: 50,
    price: 47,
    hint: "O mais escolhido. 3 créditos de bônus.",
    featured: true,
  },
  {
    id: "familia",
    name: "Família",
    credits: 100,
    price: 90,
    hint: "Para a semana inteira da casa.",
  },
  {
    id: "livre",
    name: "Livre",
    credits: 0,
    price: 0,
    hint: "Escolha o valor da recarga.",
    custom: true,
  },
];

export const WASHER_PROGRAMS = {
  eco: {
    id: "eco",
    label: "Eco 8 kg",
    load: "8 kg",
    minutes: 32,
    credits: 12,
    phases: [
      { at: 0, name: "Molho" },
      { at: 0.2, name: "Lavagem" },
      { at: 0.62, name: "Enxágue" },
      { at: 0.82, name: "Centrifugação" },
    ],
  },
  plus: {
    id: "plus",
    label: "Plus 12 kg",
    load: "12 kg",
    minutes: 38,
    credits: 16,
    phases: [
      { at: 0, name: "Molho" },
      { at: 0.18, name: "Lavagem" },
      { at: 0.6, name: "Enxágue" },
      { at: 0.8, name: "Centrifugação" },
    ],
  },
  max: {
    id: "max",
    label: "Max 18 kg",
    load: "18 kg",
    minutes: 45,
    credits: 22,
    phases: [
      { at: 0, name: "Molho" },
      { at: 0.16, name: "Lavagem" },
      { at: 0.58, name: "Enxágue" },
      { at: 0.78, name: "Centrifugação" },
    ],
  },
};

export const DRYER_PROGRAMS = {
  eco: {
    id: "eco",
    label: "Eco 20 min",
    minutes: 20,
    credits: 9,
    phases: [
      { at: 0, name: "Aquecimento" },
      { at: 0.15, name: "Secagem" },
      { at: 0.85, name: "Resfriamento" },
    ],
  },
  plus: {
    id: "plus",
    label: "Plus 35 min",
    minutes: 35,
    credits: 14,
    phases: [
      { at: 0, name: "Aquecimento" },
      { at: 0.12, name: "Secagem" },
      { at: 0.86, name: "Resfriamento" },
    ],
  },
  max: {
    id: "max",
    label: "Max 50 min",
    minutes: 50,
    credits: 19,
    phases: [
      { at: 0, name: "Aquecimento" },
      { at: 0.1, name: "Secagem" },
      { at: 0.88, name: "Resfriamento" },
    ],
  },
};

export const EXTRA_DRY_MINUTES = 10;
export const EXTRA_DRY_CREDITS = 4;
