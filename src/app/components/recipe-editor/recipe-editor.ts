import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe';

@Component({
  selector: 'app-recipe-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './recipe-editor.html',
  styleUrl: './recipe-editor.scss'
})
export class RecipeEditor {
  recipeForm: FormGroup;

  // Für das Bild
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  constructor() {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      // imageUrl brauchen wir hier nicht mehr als Text-Input
      durationMinutes: [30, [Validators.required, Validators.min(1)]],
      servings: [2, [Validators.required, Validators.min(1)]],
      category: ['Herzhaft'],
      ingredients: this.fb.array([]),
      steps: this.fb.array([])
    });

    // Initial ein leeres Feld für Zutaten und Schritte
    this.addIngredient();
    this.addStep();
  }

  get ingredients() { return this.recipeForm.get('ingredients') as FormArray; }
  get steps() { return this.recipeForm.get('steps') as FormArray; }

  // --- BILD LOGIK ---
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];

      // Vorschau erstellen
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // --- ZUTATEN ---
  addIngredient() {
    const ingredientGroup = this.fb.group({
      amount: [null], // Kann auch leer sein
      unit: [''],
      name: ['', Validators.required]
    });
    this.ingredients.push(ingredientGroup);
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  // --- SCHRITTE ---
  addStep() {
    this.steps.push(this.fb.control('', Validators.required));
  }

  removeStep(index: number) {
    this.steps.removeAt(index);
  }

  // --- SPEICHERN ---
  onSubmit() {
    if (this.recipeForm.valid) {
      const formValue = this.recipeForm.value;

      // 1. FormData Objekt erstellen (Wichtig für File Upload!)
      const formData = new FormData();

      // 2. Einfache Felder anhängen
      formData.append('title', formValue.title);
      formData.append('durationMinutes', formValue.durationMinutes);
      formData.append('servings', formValue.servings);
      formData.append('category', formValue.category);

      // 3. Bild anhängen (falls gewählt)
      // WICHTIG: Das Feld in PocketBase muss 'imageUrl' (oder wie du es genannt hast) heißen
      if (this.selectedFile) {
        formData.append('imageUrl', this.selectedFile);
      }

      // 4. Listen konvertieren (PocketBase erwartet JSON bei Arrays via FormData)

      // Zutaten "schön" formatieren: "{Menge} {Einheit} {Name}"
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

      // 5. Ab geht die Post
      this.recipeService.createRecipe(formData).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => console.error('Fehler beim Speichern:', err)
      });
    }
  }
}
