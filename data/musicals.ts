export interface Musical {
  id: string;
  title: string;
  year: number;
  description: string;
}

export const musicals: Musical[] = [
  {
    id: "chicago",
    title: "Chicago",
    year: 1975,
    description:
      "Two murderesses in 1920s Chicago compete for fame, fortune, and the flashiest lawyer in town.",
  },
  {
    id: "dear-evan-hansen",
    title: "Dear Evan Hansen",
    year: 2016,
    description:
      "A socially anxious teen gets caught up in a lie that unexpectedly gives him the connection he always wanted.",
  },
  {
    id: "hadestown",
    title: "Hadestown",
    year: 2019,
    description:
      "A folk-inspired journey to the underworld, weaving together the myths of Orpheus and Eurydice with Hades and Persephone.",
  },
  {
    id: "hamilton",
    title: "Hamilton",
    year: 2015,
    description:
      "A hip-hop retelling of the life of Alexander Hamilton, blending rap, R&B, and traditional show tunes on the Broadway stage.",
  },
  {
    id: "les-mis",
    title: "Les Mis\u00e9rables",
    year: 1985,
    description:
      "An epic tale of justice, love, and redemption set against the backdrop of 19th-century revolutionary France.",
  },
  {
    id: "rent",
    title: "Rent",
    year: 1996,
    description:
      "A group of struggling artists in New York's Lower East Side navigate love, loss, and life under the shadow of HIV/AIDS.",
  },
  {
    id: "lion-king",
    title: "The Lion King",
    year: 1997,
    description:
      "A young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.",
  },
  {
    id: "phantom",
    title: "The Phantom of the Opera",
    year: 1986,
    description:
      "A masked musical genius haunts the Paris Opera House and becomes obsessed with a young soprano.",
  },
  {
    id: "wicked",
    title: "Wicked",
    year: 2003,
    description:
      "The untold story of the witches of Oz, exploring an unlikely friendship that changes both their lives forever.",
  },
];
