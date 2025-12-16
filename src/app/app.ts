import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router'; // Router importieren
import { AuthService } from './services/auth'; // <--- Import
import { CommonModule } from '@angular/common'; // Für Pipes/Directives

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss' // Falls du app.css hast, anpassen
})
export class App {
  // Public machen, damit HTML drauf zugreifen kann
  public authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
