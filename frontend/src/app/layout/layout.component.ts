import { Component, inject, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenavContainer } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav mode="side" opened class="layout-sidenav" [class.collapsed]="menuRecolhido">
        <div class="logo">
          <mat-icon>groups</mat-icon>
          <span *ngIf="!menuRecolhido">Gestão de Clientes</span>
        </div>
        <mat-nav-list class="nav-list">
          <ng-container *ngFor="let item of itensNav">
            <a
              mat-list-item
              routerLinkActive="active-link"
              [routerLink]="item.rota"
              [matTooltip]="menuRecolhido ? item.rotulo : ''"
              matTooltipPosition="right"
              *ngIf="auth.temAlgumaPermissao(...item.permissoes)"
            >
              <mat-icon matListItemIcon>{{ item.icone }}</mat-icon>
              <span matListItemTitle *ngIf="!menuRecolhido">{{ item.rotulo }}</span>
            </a>
          </ng-container>
        </mat-nav-list>
        <div class="sidenav-footer" *ngIf="auth.usuario()">
          <button
            mat-button
            class="user-footer"
            [matMenuTriggerFor]="menuUsuario"
            [matTooltip]="menuRecolhido ? auth.usuario()!.nome : ''"
            matTooltipPosition="right"
          >
            <mat-icon>account_circle</mat-icon>
            <span *ngIf="!menuRecolhido">{{ auth.usuario()!.nome }}</span>
          </button>
          <mat-menu #menuUsuario="matMenu">
            <button mat-menu-item (click)="sair()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="layout-content">
        <mat-toolbar color="primary">
          <button
            mat-icon-button
            class="menu-toggle"
            [matTooltip]="menuRecolhido ? 'Expandir menu' : 'Recolher menu'"
            (click)="alternarMenu()"
          >
            <mat-icon>{{ menuRecolhido ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          <span class="toolbar-title">Sistema de Gestão de Clientes</span>
          <span class="spacer"></span>
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
      display: flex;
      flex-direction: column;
      width: 260px;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      transition: width 0.2s ease;
    }
    .layout-sidenav ::ng-deep .mat-drawer-inner-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .layout-sidenav.collapsed {
      width: 64px;
    }
    .layout-sidenav.collapsed .logo {
      justify-content: center;
      padding: 18px 0;
    }
    .layout-sidenav.collapsed ::ng-deep .mdc-list-item {
      padding: 0;
      justify-content: center;
    }
    .nav-list {
      flex: 1;
      overflow: auto;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 16px;
      font-weight: 500;
      color: var(--mat-sidenav-content-text-color, #333);
      white-space: nowrap;
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
    .menu-toggle {
      margin-right: 8px;
    }
    .toolbar-title {
      font-size: 18px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .sidenav-footer {
      margin-top: auto;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    .sidenav-footer .user-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      justify-content: flex-start;
    }
    .sidenav-footer .user-footer mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .layout-sidenav.collapsed .sidenav-footer .user-footer {
      justify-content: center;
      min-width: 48px;
      padding: 12px 0;
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

  @ViewChild(MatSidenavContainer) private sidenavContainer?: MatSidenavContainer;

  private static readonly MENU_KEY = 'menu-recolhido';
  private static readonly DURACAO_TRANSICAO_MS = 220;

  menuRecolhido = typeof localStorage !== 'undefined' && localStorage.getItem(LayoutComponent.MENU_KEY) === 'true';

  readonly itensNav: NavItem[] = [
    { rotulo: 'Dashboard', rota: '/dashboard', icone: 'dashboard', permissoes: ['clientes:ver'] },
    { rotulo: 'Clientes', rota: '/clientes', icone: 'groups', permissoes: ['clientes:ver'] },
    { rotulo: 'Interações', rota: '/interacoes', icone: 'forum', permissoes: ['interacoes:ver'] },
    { rotulo: 'Programações de Visita', rota: '/programacoes', icone: 'event_available', permissoes: ['programacoes:ver'] },
    { rotulo: 'Monitora Rondônia', rota: '/monitora-rondonia', icone: 'local_shipping', permissoes: ['monitora-rondonia:ver'] },
    { rotulo: 'Usuários', rota: '/usuarios', icone: 'manage_accounts', permissoes: ['usuarios:ver', 'usuarios:gerenciar'] },
    { rotulo: 'Permissões', rota: '/permissoes', icone: 'admin_panel_settings', permissoes: ['permissoes:ver'] },
    { rotulo: 'Configurações', rota: '/configuracoes', icone: 'settings', permissoes: ['configuracao:ver'] },
  ];

  alternarMenu(): void {
    this.menuRecolhido = !this.menuRecolhido;
    localStorage.setItem(LayoutComponent.MENU_KEY, String(this.menuRecolhido));
    this.sincronizarMargemDoConteudo();
  }

  private sincronizarMargemDoConteudo(): void {
    const container = this.sidenavContainer;
    if (!container || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    const inicio = performance.now();
    const passo = (): void => {
      container.updateContentMargins();
      if (performance.now() - inicio < LayoutComponent.DURACAO_TRANSICAO_MS) {
        requestAnimationFrame(passo);
      }
    };
    requestAnimationFrame(passo);
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
