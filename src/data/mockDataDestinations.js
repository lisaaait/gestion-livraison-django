export const mockDestinations = [
  {
    id: 1,
    codeDes: "DES-ALG-01",
    ville: "Alger",
    pays: "Algérie",
    zoneGeo: "Nord",
  },
  {
    id: 2,
    codeDes: "DES-ALG-02",
    ville: "Oran",
    pays: "Algérie",
    zoneGeo: "Ouest",
  },
  {
    id: 3,
    codeDes: "DES-ALG-03",
    ville: "Constantine",
    pays: "Algérie",
    zoneGeo: "Est",
  },
  {
    id: 4,
    codeDes: "DES-ALG-04",
    ville: "Ouargla",
    pays: "Algérie",
    zoneGeo: "Sud",
  },
  {
    id: 5,
    codeDes: "DES-TUN-01",
    ville: "Tunis",
    pays: "Tunisie",
    zoneGeo: "International",
  },
];

export const destinationStats = {
  total: mockDestinations.length,

  nord: mockDestinations.filter(
    (d) => d.zoneGeo === "Nord"
  ).length,

  sud: mockDestinations.filter(
    (d) => d.zoneGeo === "Sud"
  ).length,

  est: mockDestinations.filter(
    (d) => d.zoneGeo === "Est"
  ).length,

  ouest: mockDestinations.filter(
    (d) => d.zoneGeo === "Ouest"
  ).length,

  international: mockDestinations.filter(
    (d) => d.zoneGeo === "International"
  ).length,
};
