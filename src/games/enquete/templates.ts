/**
 * Narrative templates for the investigation game. Each template provides a
 * themed cast, a set of locations and objects, and the prose that frames the
 * generated logic puzzle. Puzzles are generated from a seed + template so the
 * same case is reproducible (campaign) yet replayable with new configurations.
 */

export interface EnqueteTemplate {
  id: string;
  title: string;
  intro: string;
  victim: string;
  crimeVerb: string; // e.g. "a été retrouvé empoisonné"
  suspects: string[]; // pool, generator samples N of them
  lieux: string[];
  objets: string[];
  motives: string[];
}

export const TEMPLATES: EnqueteTemplate[] = [
  {
    id: 'manoir',
    title: 'Le Manoir de Valombre',
    intro:
      "Une nuit d'orage au manoir de Valombre. Le maître des lieux est retrouvé sans vie dans son bureau. Les convives, tous présents ce soir-là, deviennent suspects. À vous de reconstituer qui se trouvait où, et avec quoi.",
    victim: 'Lord Valombre',
    crimeVerb: 'a été retrouvé sans vie',
    suspects: [
      'Madame Leblanc',
      'Le Colonel Moutarde',
      'Mademoiselle Rose',
      'Le Professeur Violet',
      'Docteur Olive',
      'Madame Pervenche',
    ],
    lieux: ['la Bibliothèque', 'le Salon', 'la Cuisine', 'la Serre', 'le Bureau', 'la Cave'],
    objets: ['un Chandelier', 'une Clé en fer', 'un Flacon', 'une Lettre', 'une Corde', 'un Coupe-papier'],
    motives: [
      'un héritage contesté',
      'une dette de jeu impayée',
      'une vieille rancune',
      'un secret de famille',
      'une trahison amoureuse',
      'un chantage récent',
    ],
  },
  {
    id: 'musee',
    title: 'Vol au Musée des Lumières',
    intro:
      "Au petit matin, la vitrine du diamant Étoile-du-Sud est brisée. Cinq employés avaient les clés cette nuit-là. Les caméras ont rendu l'âme, mais les indices, eux, ne mentent pas. Démasquez le voleur.",
    victim: "le diamant Étoile-du-Sud",
    crimeVerb: 'a été dérobé',
    suspects: [
      'le Gardien Nocturne',
      'la Conservatrice',
      'le Restaurateur',
      "l'Électricien",
      'la Guide',
      'le Stagiaire',
    ],
    lieux: ['le Hall', "la Salle Égyptienne", 'les Réserves', 'le Bureau', "l'Atelier", 'la Verrière'],
    objets: ['un Badge', 'un Tournevis', 'une Lampe torche', 'des Gants', 'un Trousseau', 'un Carnet'],
    motives: [
      'des dettes secrètes',
      'une vengeance contre la direction',
      'la pression d’un commanditaire',
      'une passion incontrôlable',
      'un licenciement annoncé',
      'un pari insensé',
    ],
  },
  {
    id: 'navire',
    title: "Disparition sur l'Orient-Express",
    intro:
      "Le train file dans la nuit enneigée. À l'aube, un passager a disparu de sa cabine, la fenêtre grande ouverte. Les voyageurs de la voiture 7 sont les seuls à avoir pu agir. Reconstituez leurs déplacements.",
    victim: 'le passager de la cabine 7',
    crimeVerb: 'a disparu',
    suspects: [
      "l'Aristocrate",
      'la Cantatrice',
      'le Médecin',
      'le Diplomate',
      'la Gouvernante',
      'le Contrôleur',
    ],
    lieux: ['le Wagon-restaurant', 'le Couloir', 'la Cabine 3', 'la Plateforme', 'le Fumoir', 'la Soute'],
    objets: ['un Billet', 'un Mouchoir', 'une Montre', 'une Canne', 'un Télégramme', 'une Fiole'],
    motives: [
      'un passé que la victime menaçait de révéler',
      'une fortune en jeu',
      'une mission secrète',
      'une jalousie ancienne',
      'un témoin gênant',
      'une promesse rompue',
    ],
  },
];

export function getTemplate(id: string): EnqueteTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
