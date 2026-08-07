import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientesService } from '../../core/services/clientes.service';
import { Cliente } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-cliente-list',
  imports: [
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
    PermissaoDirective,
  ],
  template: `
    <div class="header">
      <h1>Clientes</h1>
      <button
        mat-flat-button
        color="primary"
        routerLink="/clientes/novo"
        appPermissao="clientes:criar"
      >
        <mat-icon>add</mat-icon>
        Novo cliente
      </button>
    </div>

    <mat-card class="filter-card">
      <mat-card-content>
        <form [formGroup]="filtros" (ngSubmit)="buscar()" class="filters">
          <mat-form-field appearance="outline" class="filter-busca">
            <mat-label>Buscar</mat-label>
            <input
              matInput
              formControlName="busca"
              placeholder="Nome ou CPF/CNPJ"
            />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cidade</mat-label>
            <input matInput formControlName="cidade" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <input matInput formControlName="estado" maxlength="2" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Segmento</mat-label>
            <input matInput formControlName="segmento" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">Todos</mat-option>
              <mat-option value="ativo">Ativo</mat-option>
              <mat-option value="inativo">Inativo</mat-option>
              <mat-option value="prospect">Prospect</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="filter-actions">
            <button mat-flat-button color="primary" type="submit">
              Filtrar
            </button>
            <button mat-button type="button" (click)="limpar()">Limpar</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content class="table-wrap">
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="clientes" class="mat-elevation-z0">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let cliente">
              <a [routerLink]="['/clientes', cliente.id]">{{ cliente.nome }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="cpf_cnpj">
            <th mat-header-cell *matHeaderCellDef>CPF/CNPJ</th>
            <td mat-cell *matCellDef="let cliente">{{ cliente.cpf_cnpj || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="cidade">
            <th mat-header-cell *matHeaderCellDef>Cidade</th>
            <td mat-cell *matCellDef="let cliente">
              {{ cliente.cidade ? cliente.cidade + (cliente.estado ? ' - ' + cliente.estado : '') : '—' }}
            </td>
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
            <td mat-cell *matCellDef="let cliente" class="acoes-cell">
              <button
                mat-icon-button
                [routerLink]="['/clientes', cliente.id, 'editar']"
                appPermissao="clientes:editar"
                matTooltip="Editar"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                appPermissao="clientes:excluir"
                matTooltip="Excluir"
                (click)="excluir(cliente)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && clientes.length === 0" class="empty">
          Nenhum cliente encontrado.
        </p>
        <mat-paginator
          [length]="total"
          [pageSize]="limite"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="naPagina($event)"
          [showFirstLastButtons]="true"
        >
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
    }
    .filter-card {
      margin-bottom: 16px;
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: baseline;
    }
    .filter-busca {
      min-width: 220px;
      flex: 1;
    }
    .filter-actions {
      display: flex;
      gap: 8px;
    }
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
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
    .acoes-cell {
      text-align: right;
      white-space: nowrap;
    }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
  `,
})
export class ClienteListComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly filtros = this.fb.nonNullable.group({
    busca: [''],
    cidade: [''],
    estado: [''],
    segmento: [''],
    status: [''],
  });

  clientes: Cliente[] = [];
  total = 0;
  pagina = 1;
  limite = 10;
  carregando = false;
  readonly colunas = ['nome', 'cpf_cnpj', 'cidade', 'segmento', 'status', 'acoes'];

  ngOnInit(): void {
    this.carregar();
  }

  buscar(): void {
    this.pagina = 1;
    this.carregar();
  }

  limpar(): void {
    this.filtros.reset();
    this.buscar();
  }

  naPagina(evento: PageEvent): void {
    this.pagina = evento.pageIndex + 1;
    this.limite = evento.pageSize;
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    const { busca, cidade, estado, segmento, status } =
      this.filtros.getRawValue();
    this.clientesService
      .listar({
        busca: busca || undefined,
        cidade: cidade || undefined,
        estado: estado ? estado.toUpperCase() : undefined,
        segmento: segmento || undefined,
        status: status || undefined,
        pagina: this.pagina,
        limite: this.limite,
      })
      .subscribe({
        next: (res) => {
          this.clientes = res.dados;
          this.total = res.total;
          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregando = false;
          this.cdr.markForCheck();
        },
      });
  }

  excluir(cliente: Cliente): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Excluir cliente',
        mensagem: `Deseja realmente excluir o cliente "${cliente.nome}"? Essa ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
      },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }
      this.clientesService.excluir(cliente.id).subscribe({
        next: () => {
          this.snackBar.open('Cliente excluído.', 'Fechar', { duration: 3000 });
          if (this.clientes.length === 1 && this.pagina > 1) {
            this.pagina--;
          }
          this.carregar();
        },
      });
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
