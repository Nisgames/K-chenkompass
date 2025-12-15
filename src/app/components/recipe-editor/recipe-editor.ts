import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../services/recipe';

@Component({
  selector: 'app-recipe-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './recipe-editor.html',
  styleUrl: './recipe-editor.scss'
})
export class RecipeEditor implements OnInit {
  recipeForm: FormGroup;

  // Status-Variablen
  isEditMode = false;
  recipeId: string | null = null;
  isLoading = false;

  // Bild-Handling
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      durationMinutes: [30, [Validators.required, Validators.min(1)]],
      servings: [2, [Validators.required, Validators.min(1)]],
      category: ['Herzhaft'],
      ingredients: this.fb.array([]),
      steps: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Prüfen, ob eine ID in der URL steht
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.recipeId = id;
      this.loadRecipeData(id);
    } else {
      // Create Mode: Initiale leere Felder
      this.addIngredient();
      this.addStep();
    }
  }

  get ingredients() { return this.recipeForm.get('ingredients') as FormArray; }
  get steps() { return this.recipeForm.get('steps') as FormArray; }

  // --- DATEN LADEN & PARSEN ---
  loadRecipeData(id: string) {
    this.isLoading = true;
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        // 1. Einfache Werte setzen
        this.recipeForm.patchValue({
          title: recipe.title,
          durationMinutes: recipe.durationMinutes,
          servings: recipe.servings,
          category: recipe.category
        });

        // 2. Bild Vorschau (falls vorhanden)
        if (recipe.imageUrl) {
          this.imagePreview = recipe.imageUrl;
        }

        // 3. Zutaten Array befüllen
        this.ingredients.clear();
        recipe.ingredients.forEach(ingString => {
          // Hilfsfunktion nutzen, um den String zu zerlegen
          const parsed = this.parseIngredientString(ingString);
          this.ingredients.push(this.fb.group({
            amount: [parsed.amount],
            unit: [parsed.unit],
            name: [parsed.name, Validators.required]
          }));
        });

        // 4. Schritte Array befüllen
        this.steps.clear();
        recipe.steps.forEach(step => {
          this.steps.push(this.fb.control(step, Validators.required));
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden:', err);
        this.router.navigate(['/']); // Bei Fehler zurück
      }
    });
  }

  // Versucht, aus "500 g Mehl" wieder Objekte zu machen
  // Strategie: [Zahl] [Wort] [Rest]
  private parseIngredientString(str: string) {
    // Regex Erklärung:
    // ^([\d.,]+)   -> Startet mit Ziffern/Komma/Punkt (Gruppe 1: Menge)
    // \s* -> Leerzeichen (optional)
    // ([^\s\d]+)?  -> Ein Wort, das keine Ziffer ist (Gruppe 2: Einheit - optional)
    // \s+          -> Leerzeichen (zwingend)
    // (.*)$        -> Der Rest (Gruppe 3: Name)
    const regex = /^([\d.,]+)\s*([^\s\d]+)?\s+(.*)$/;
    const match = str.match(regex);

    if (match) {
      return {
        amount: parseFloat(match[1].replace(',', '.')), // Komma zu Punkt für JS
        unit: match[2] || '',
        name: match[3]
      };
    }

    // Fallback: Wenn kein Muster passt (z.B. "Salz"), ist alles der Name
    return { amount: null, unit: '', name: str };
  }

  // --- EVENT HANDLERS (File, Add/Remove) ---

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => { this.imagePreview = reader.result as string; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  addIngredient() {
    this.ingredients.push(this.fb.group({ amount: [null], unit: [''], name: ['', Validators.required] }));
  }
  removeIngredient(index: number) { this.ingredients.removeAt(index); }

  addStep() { this.steps.push(this.fb.control('', Validators.required)); }
  removeStep(index: number) { this.steps.removeAt(index); }

  // --- SPEICHERN ---
  onSubmit() {
    if (this.recipeForm.invalid) return;

    const formValue = this.recipeForm.value;
    const formData = new FormData();

    // Standard Felder
    formData.append('title', formValue.title);
    formData.append('durationMinutes', formValue.durationMinutes);
    formData.append('servings', formValue.servings);
    formData.append('category', formValue.category);

    // Bild nur anhängen, wenn ein NEUES gewählt wurde
    if (this.selectedFile) {
      formData.append('imageUrl', this.selectedFile);
    }

    // Listen konvertieren
    const formattedIngredients = formValue.ingredients
      .map((ing: any) => {
        const parts = [];
        if (ing.amount) parts.push(ing.amount);
        if (ing.unit) parts.push(ing.unit);
        if (ing.name) parts.push(ing.name);
        return parts.join(' ');
      })
      .filter((str: string) => str.trim().length > 0);

    formData.append('ingredients', JSON.stringify(formattedIngredients));
    formData.append('steps', JSON.stringify(formValue.steps));

    // ENTSCHEIDUNG: Update oder Create?
    if (this.isEditMode && this.recipeId) {
      this.recipeService.updateRecipe(this.recipeId, formData).subscribe({
        next: () => this.router.navigate(['/recipe', this.recipeId]), // Zurück zum Detail
        error: (err) => console.error('Fehler beim Update:', err)
      });
    } else {
      this.recipeService.createRecipe(formData).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => console.error('Fehler beim Erstellen:', err)
      });
    }
  }
}
