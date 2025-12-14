// Definition einer einzelnen Zutat
export interface Ingredient {
  name: string;
  amount: number;   // Die Menge (z.B. 500)
  unit: string;     // Die Einheit (z.B. 'g', 'ml', 'Stk')
}

// Definition des gesamten Rezepts
export interface Recipe {
  id: string;             // Eindeutige ID (wichtig für Routing später)
  title: string;
  imageUrl?: string;      // Das '?' bedeutet: Optional (nicht jedes Rezept hat ein Bild)
  description?: string;   // Kurzer Einleitungstext

  durationMinutes: number; // Dauer in Minuten

  // Deine Tags wie "Warm", "Süß", "Hauptgericht"
  temperature: 'Warm' | 'Kalt'; // Beispiel für feste Kategorien (oder string)
  category: 'Herzhaft' | 'Süß';
  tags: string[];

  // Wichtig für den Portionsrechner: Für wie viele Personen sind die Standard-Mengen?
  servings: number;

  ingredients: Ingredient[];
  steps: string[];        // Einfache Liste von Zubereitungsschritten

  rating: number; // Wie viele Sterne
}
