export const TEXT_RECIPE_PROMPT = (input: {
  ageRange: '6-8'|'9-12'|'12-24'|'1-2'|'3-4'|'5+',
  available: string[],
  avoid: string[]
}) => {
  const getAgeDescription = (ageRange: string) => {
    switch(ageRange) {
      case '6-8': return '6-8 Monate';
      case '9-12': return '9-12 Monate';
      case '12-24': return '12-24 Monate';
      case '1-2': return '1-2 Jahre';
      case '3-4': return '3-4 Jahre';
      case '5+': return '5+ Jahre';
      default: return ageRange;
    }
  };

  return `
Du bist BabyChef, ein Kochassistent für Kleinkinder in Deutsch.
Erstelle EIN einfaches Rezept für Altersgruppe ${getAgeDescription(input.ageRange)}.
Kein zugesetzter Zucker, Salz nur minimal, Erstickungsgefahr vermeiden.

Wenn möglich, nutze: ${input.available.join(', ') || 'keine Angaben'}.
Vermeide strikt: ${input.avoid.join(', ') || 'keine'}.

Gib zurück als JSON:
{
 "title": string,
 "ingredients": [{"name": string, "qty": number|null, "unit": string|null}],
 "steps": [string],      // max 8
 "allergens": [string],
 "notes": string         // Konsistenz-Tipps (püriert/gestampft/fingerfood)
}
`;
};

export const VISION_PROMPT = (ageRange: string) => {
  const getAgeDescription = (ageRange: string) => {
    switch(ageRange) {
      case '6-8': return '6-8 Monate';
      case '9-12': return '9-12 Monate';
      case '12-24': return '12-24 Monate';
      case '1-2': return '1-2 Jahre';
      case '3-4': return '3-4 Jahre';
      case '5+': return '5+ Jahre';
      default: return ageRange;
    }
  };

  return `
Analysiere das Bild und liste erkennbare Lebensmittel mit grober Sicherheit.
Schlage DREI einfache, babyfreundliche Rezepte für ${getAgeDescription(ageRange)} vor.
Antwort NUR als JSON:
{
 "detected_items": [{"name": string, "confidence": number}],
 "recipes": [{
   "title": string,
   "ingredients": [{"name": string, "qty": number|null, "unit": string|null}],
   "steps": [string],
   "allergens": [string],
   "notes": string
 }]
}
`;
};
