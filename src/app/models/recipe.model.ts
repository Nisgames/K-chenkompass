export interface Ingredient {
  name: string;
  amount: number | null; // Kann auch null sein, wenn nur "Salz" da steht
  unit: string;
}

// Definition des gesamten Rezepts
export interface Recipe {
  id: string;
  title: string;
  author: string; // Die ID (zum Vergleichen für isOwner)
  authorName?: string;
  imageUrl?: string;
  description?: string;

  durationMinutes: number;

  // Diese Felder hattest du definiert, passe sie ggf. an deine DB an
  category: 'Herzhaft' | 'Süß';
  isPrivate: boolean;
  // WICHTIG: Hier stand vorher Ingredient[].
  // Da PocketBase simple Strings speichert ["500g Mehl"], muss das hier string[] sein!
  ingredients: string[];

  steps: string[];

  // Optional, falls du das noch nicht nutzt
  servings: number;
}
