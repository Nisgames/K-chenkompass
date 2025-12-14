import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms'; // WICHTIG
import { Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule], // ReactiveFormsModule ist hier Pflicht
  templateUrl: './recipe-editor.html',
  styleUrl: './recipe-editor.scss'
})

export class RecipeEditor {
  recipeForm: FormGroup;

  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  constructor() {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      imageUrl: [''],
      durationMinutes: [30, [Validators.required, Validators.min(1)]],
      servings: [2, [Validators.required, Validators.min(1)]],
      category: ['Herzhaft'],

      // NEU: Die leeren Listen für Zutaten und Schritte
      ingredients: this.fb.array([]),
      steps: this.fb.array([])
    });
  }

  // --- HELFER-METHODEN (GETTER) ---
  // Damit wir im HTML leicht auf die Listen zugreifen können
  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get steps() {
    return this.recipeForm.get('steps') as FormArray;
  }

  // --- ZUTATEN LOGIK ---
  addIngredient() {
    const ingredientGroup = this.fb.group({
      name: ['', Validators.required],
      amount: [100, Validators.required],
      unit: ['g', Validators.required]
    });
    this.ingredients.push(ingredientGroup);
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  // --- SCHRITTE LOGIK ---
  addStep() {
    // Ein Schritt ist nur ein einfacher Text, kein ganzes Objekt -> daher FormControl
    this.steps.push(this.fb.control('', Validators.required));
  }

  removeStep(index: number) {
    this.steps.removeAt(index);
  }

  // --- SPEICHERN ---
  onSubmit() {
    // ... in der submit Methode ...
    if (this.recipeForm.valid) {

      // 1. Kopie der Form-Werte nehmen
      const formValue = { ...this.recipeForm.value };

      // 2. Zutaten von Objekten {amount, name} in Strings "Menge Name" umwandeln
      // Prüfen, ob ingredients überhaupt existieren und ein Array sind
      if (formValue.ingredients && Array.isArray(formValue.ingredients)) {
        formValue.ingredients = formValue.ingredients.map((ing: any) => {
          // Falls es noch das alte Objekt ist -> Zusammenkleben
          if (typeof ing === 'object' && ing.name) {
            return `${ing.amount} ${ing.name}`.trim();
          }
          // Falls es schon ein String ist -> so lassen
          return ing;
        });
      }

      // 3. Das gleiche evtl. für Steps (falls die auch Objekte waren, sonst weglassen)
      // ...

      // 4. Absenden (jetzt mit 'formValue' statt 'this.recipeForm.value')
      this.recipeService.createRecipe(formValue).subscribe(() => {
        // Erst wenn der Server fertig ist, navigieren wir weg
        this.router.navigate(['/']);
      });
    }
  }
}
