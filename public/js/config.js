const BUSINESS_CONFIG = {
  name: "Buck's Burguer",

  whatsapp: "5519991938590",
  phone: "",
  email: "",
  instagram: "",

  address: {
    street: "R. Eliza Laurinda da Silva",
    number: "399",
    neighborhood: "Jardim Santana",
    city: "Hortolândia",
    state: "SP",
    zipCode: "13140-252",
    coords: null
  },

  siteUrl: "",

  socialImage: "",

  businessHours: {
    timeZone: "America/Sao_Paulo",
    monday:    { open: "18:30", close: "01:00" },
    tuesday:   { open: "18:30", close: "01:00" },
    wednesday: { open: "18:30", close: "01:00" },
    thursday:  { open: "18:30", close: "01:00" },
    friday:    { open: "18:30", close: "01:00" },
    saturday:  { open: "18:30", close: "01:00" },
    sunday:    { open: "18:30", close: "01:00" }
  },

  delivery: {
    freeRadiusKm: 1.5,
    minimumOrder: null,
    feeRules: []
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = { BUSINESS_CONFIG };
if (typeof window !== 'undefined') window.BUSINESS_CONFIG = BUSINESS_CONFIG;
