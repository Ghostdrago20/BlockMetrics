import { Routes } from '@angular/router';
import { CryptoDashboardComponent } from './components/crypto-dashboard/crypto-dashboard.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: CryptoDashboardComponent },
  { path: '**', redirectTo: 'home' } // Wildcard route
];
