import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-acesso-negado',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="wrapper">
      <mat-icon class="icon">lock</mat-icon>
      <h1>Acesso negado</h1>
      <p>Você não possui permissão para acessar esta página.</p>
      <a mat-flat-button color="primary" routerLink="/dashboard">
        <mat-icon>arrow_back</mat-icon>
        Voltar ao início
      </a>
    </div>
  `,
  styles: `
    .wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-align: center;
    }
    .icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }
  `,
})
export class AcessoNegadoComponent {}
