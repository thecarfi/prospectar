import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  rotulo: string;
  rota: string;
  icone: string;
  permissoes: string[];
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf,
    NgFor,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav mode="side" opened class="layout-sidenav">
        <div class="logo">
          <mat-icon>groups</mat-icon>
          <span>Gestão de Clientes</span>
        </div>
        <mat-nav-list>
          <ng-container *ngFor="let item of itensNav">
            <a
              mat-list-item
              routerLinkActive="active-link"
              [routerLink]="item.rota"
              *ngIf="auth.temAlgumaPermissao(...item.permissoes)"
            >
              <mat-icon matListItemIcon>{{ item.icone }}</mat-icon>
              <span matListItemTitle>{{ item.rotulo }}</span>
            </a>
          </ng-container>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="layout-content">
        <mat-toolbar color="primary">
          <span class="toolbar-title">Sistema de Gestão de Clientes</span>
          <span class="spacer"></span>
          <span class="user-info" *ngIf="auth.usuario()">
            {{ auth.usuario()!.nome }}
            <mat-icon class="user-avatar">account_circle</mat-icon>
          </span>
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="sair()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="page-container">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .layout-container {
      height: 100vh;
    }
    .layout-sidenav {
      width: 260px;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 16px;
      font-weight: 500;
      color: var(--mat-sidenav-content-text-color, #333);
    }
    .logo mat-icon {
      color: #3f51b5;
    }
    .active-link {
      background: rgba(63, 81, 181, 0.12);
    }
    .layout-content {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .toolbar-title {
      font-size: 18px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 4px;
    }
    .user-avatar {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .page-container {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }
  `,
})
export class LayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly itensNav: NavItem[] = [
    { rotulo: 'Dashboard', rota: '/dashboard', icone: 'dashboard', permissoes: ['clientes:ver'] },
    { rotulo: 'Clientes', rota: '/clientes', icone: 'groups', permissoes: ['clientes:ver'] },
    { rotulo: 'Usuários', rota: '/usuarios', icone: 'manage_accounts', permissoes: ['usuarios:ver', 'usuarios:gerenciar'] },
    { rotulo: 'Permissões', rota: '/permissoes', icone: 'admin_panel_settings', permissoes: ['permissoes:ver'] },
    { rotulo: 'Configurações', rota: '/configuracoes', icone: 'settings', permissoes: ['segmentos:ver'] },
  ];

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
