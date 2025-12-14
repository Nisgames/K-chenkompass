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
    if (this.recipeForm.valid) {
      // Das Formular hat jetzt genau die Struktur unseres Recipe-Models!
      // Wir müssen nichts mehr manuell umbauen.
      const newRecipe = this.recipeForm.value as Recipe;

      this.recipeService.createRecipe(newRecipe).subscribe(() => {
        // Erst wenn der Server fertig ist, navigieren wir weg
        this.router.navigate(['/']);
      });
    }
  }
}
