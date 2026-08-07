import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ClientesService } from '../../core/services/clientes.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [
    NgIf,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
  ],
  template: `
    <h1>Dashboard</h1>

    <div class="cards">
      <mat-card class="stat-card">
        <mat-icon class="stat-icon total">groups</mat-icon>
        <div>
          <div class="stat-value">{{ estatisticas?.total ?? 0 }}</div>
          <div class="stat-label">Total de clientes</div>
        </div>
      </mat-card>
      <mat-card class="stat-card">
        <mat-icon class="stat-icon ativo">check_circle</mat-icon>
        <div>
          <div class="stat-value">{{ estatisticas?.ativos ?? 0 }}</div>
          <div class="stat-label">Ativos</div>
        </div>
      </mat-card>
      <mat-card class="stat-card">
        <mat-icon class="stat-icon inativo">cancel</mat-icon>
        <div>
          <div class="stat-value">{{ estatisticas?.inativos ?? 0 }}</div>
          <div class="stat-label">Inativos</div>
        </div>
      </mat-card>
      <mat-card class="stat-card">
        <mat-icon class="stat-icon prospect">trending_up</mat-icon>
        <div>
          <div class="stat-value">{{ estatisticas?.prospects ?? 0 }}</div>
          <div class="stat-label">Prospects</div>
        </div>
      </mat-card>
    </div>

    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title>Últimos clientes cadastrados</mat-card-title>
        <mat-card-subtitle>
          <a routerLink="/clientes">Ver todos</a>
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="clientesRecentes" class="mat-elevation-z0">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let cliente">{{ cliente.nome }}</td>
          </ng-container>
          <ng-container matColumnDef="cidade">
            <th mat-header-cell *matHeaderCellDef>Cidade</th>
            <td mat-cell *matCellDef="let cliente">{{ cliente.cidade || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="segmento">
            <th mat-header-cell *matHeaderCellDef>Segmento</th>
            <td mat-cell *matCellDef="let cliente">{{ cliente.segmento || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let cliente">
              <span class="status-pill" [class]="cliente.status">
                {{ rotuloStatus(cliente.status) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let cliente">
              <a [routerLink]="['/clientes', cliente.id]">Detalhes</a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && clientesRecentes.length === 0" class="empty">
          Nenhum cliente cadastrado ainda.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    h1 {
      margin-top: 0;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }
    .stat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
    .stat-icon.total { color: #3f51b5; }
    .stat-icon.ativo { color: #4caf50; }
    .stat-icon.inativo { color: #f44336; }
    .stat-icon.prospect { color: #ff9800; }
    .stat-value {
      font-size: 26px;
      font-weight: 500;
    }
    .stat-label {
      color: rgba(0, 0, 0, 0.6);
      font-size: 13px;
    }
    .table-card mat-card-content {
      padding-top: 8px;
    }
    .status-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-pill.ativo { background: #e8f5e9; color: #2e7d32; }
    .status-pill.inativo { background: #fbe9e7; color: #c62828; }
    .status-pill.prospect { background: #fff3e0; color: #e65100; }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 16px;
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly cdr = inject(ChangeDetectorRef);

  estatisticas: { total: number; ativos: number; inativos: number; prospects: number } | null = null;
  clientesRecentes: Cliente[] = [];
  carregando = true;
  readonly colunas = ['nome', 'cidade', 'segmento', 'status', 'acoes'];

  ngOnInit(): void {
    this.clientesService.estatisticas().subscribe((stats) => {
      this.estatisticas = stats;
      this.cdr.markForCheck();
    });

    this.clientesService
      .listar({ limite: 5, ordenar_por: 'criado_em', direcao: 'desc' })
      .subscribe({
        next: (res) => {
          this.clientesRecentes = res.dados;
          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregando = false;
          this.cdr.markForCheck();
        },
      });
  }

  rotuloStatus(status: string): string {
    const mapa: Record<string, string> = {
      ativo: 'Ativo',
      inativo: 'Inativo',
      prospect: 'Prospect',
    };
    return mapa[status] || status;
  }
}
