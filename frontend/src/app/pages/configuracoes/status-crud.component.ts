import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusClientesService } from '../../core/services/status-clientes.service';
import { StatusCliente } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { StatusClienteFormDialogComponent } from './status-form-dialog.component';

@Component({
  selector: 'app-status-crud',
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
    PermissaoDirective,
  ],
  template: `
    <mat-card class="toolbar-card">
      <mat-card-content>
        <form [formGroup]="formulario" (ngSubmit)="buscar()" class="toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar status</mat-label>
            <input matInput formControlName="busca" placeholder="Nome do status" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit">Filtrar</button>
          <button mat-button type="button" (click)="limpar()">Limpar</button>
          <span class="spacer"></span>
          <button
            mat-flat-button
            color="primary"
            appPermissao="status_clientes:criar"
            (click)="abrirNovo()"
          >
            <mat-icon>add</mat-icon>
            Novo
          </button>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content class="table-wrap">
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="statuses" class="mat-elevation-z0">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let status">{{ status.id }}</td>
          </ng-container>
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let status">{{ status.nome }}</td>
          </ng-container>
          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef>Descrição</th>
            <td mat-cell *matCellDef="let status">{{ status.descricao || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="cor">
            <th mat-header-cell *matHeaderCellDef>Cor</th>
            <td mat-cell *matCellDef="let status">
              <span class="cor-amostra" [style.background]="status.cor"></span>
              {{ status.cor }}
            </td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let status" class="acoes-cell">
              <button
                mat-icon-button
                appPermissao="status_clientes:editar"
                matTooltip="Editar"
                (click)="editar(status)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                appPermissao="status_clientes:excluir"
                matTooltip="Excluir"
                (click)="excluir(status)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && statuses.length === 0" class="empty">Nenhum status encontrado.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .toolbar-card {
      margin-bottom: 16px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .search-field {
      min-width: 220px;
      flex: 1;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
    }
    .cor-amostra {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 8px;
      vertical-align: middle;
      border: 1px solid rgba(0, 0, 0, 0.12);
    }
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
export class StatusClienteCrudComponent implements OnInit {
  private readonly statusClientesService = inject(StatusClientesService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    busca: [''],
  });

  statuses: StatusCliente[] = [];
  carregando = false;
  readonly colunas = ['id', 'nome', 'descricao', 'cor', 'acoes'];

  ngOnInit(): void {
    this.carregar();
  }

  buscar(): void {
    this.carregar();
  }

  limpar(): void {
    this.formulario.reset();
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    const termo = this.formulario.getRawValue().busca || undefined;
    this.statusClientesService.listar(termo).subscribe({
      next: (res) => {
        this.statuses = res;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirNovo(): void {
    const ref = this.dialog.open(StatusClienteFormDialogComponent, {
      width: '440px',
      data: {},
    });

    ref.afterClosed().subscribe((valor) => {
      if (!valor) {
        return;
      }
      this.statusClientesService.criar(valor).subscribe({
        next: () => {
          this.snackBar.open('Status criado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  editar(status: StatusCliente): void {
    const ref = this.dialog.open(StatusClienteFormDialogComponent, {
      width: '440px',
      data: { status },
    });

    ref.afterClosed().subscribe((valor) => {
      if (!valor) {
        return;
      }
      this.statusClientesService.atualizar(status.id, valor).subscribe({
        next: () => {
          this.snackBar.open('Status atualizado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  excluir(status: StatusCliente): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Excluir status',
        mensagem: `Deseja realmente excluir o status "${status.nome}"? Essa ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
      },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }
      this.statusClientesService.excluir(status.id).subscribe({
        next: () => {
          this.snackBar.open('Status excluído.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }
}
