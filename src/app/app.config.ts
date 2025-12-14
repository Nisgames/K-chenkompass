import { ApplicationConfig, importProvidersFrom, Injectable } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// WICHTIG: Diese Imports hinzufügen
import { HammerModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { MyHammerConfig } from './hammer.config'; // Deine neue Datei
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // 1. HammerModule global verfügbar machen
    importProvidersFrom(HammerModule),

    // 2. Unsere aggressive Config nutzen
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    },

    provideHttpClient()
  ]
};
