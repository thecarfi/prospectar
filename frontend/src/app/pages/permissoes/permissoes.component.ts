import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PapeisService } from '../../core/services/papeis.service';
import { Papel } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { PapelFormDialogComponent } from './papel-form-dialog.component';

@Component({
  selector: 'app-permissoes',
  imports: [
    NgIf,
    NgFor,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
    PermissaoDirective,
  ],
  template: `
    <div class="header">
      <h1>Permissões</h1>
      <button
        mat-flat-button
        color="primary"
        appPermissao="permissoes:gerenciar"
        (click)="abrirNovo()"
      >
        <mat-icon>add</mat-icon>
        Novo papel
      </button>
    </div>

    <mat-card>
      <mat-card-content class="table-wrap">
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="papeis" class="mat-elevation-z0">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Papel</th>
            <td mat-cell *matCellDef="let papel">
              <span class="papel-nome">{{ papel.nome }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef>Descrição</th>
            <td mat-cell *matCellDef="let papel">{{ papel.descricao || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="permissoes">
            <th mat-header-cell *matHeaderCellDef>Permissões</th>
            <td mat-cell *matCellDef="let papel">
              <ng-container *ngIf="papel.permissoes.length > 0; else semPermissoes">
                <span class="permissao-chip" *ngFor="let p of papel.permissoes">
                  {{ p }}
                </span>
              </ng-container>
              <ng-template #semPermissoes>
                <span class="sem-permissoes">Nenhuma</span>
              </ng-template>
            </td>
          </ng-container>
          <ng-container matColumnDef="usuarios">
            <th mat-header-cell *matHeaderCellDef>Usuários</th>
            <td mat-cell *matCellDef="let papel">{{ papel.usuarios_count || 0 }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let papel" class="acoes-cell">
              <button
                mat-icon-button
                appPermissao="permissoes:gerenciar"
                matTooltip="Editar"
                (click)="editar(papel)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                appPermissao="permissoes:gerenciar"
                matTooltip="Excluir"
                (click)="excluir(papel)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && papeis.length === 0" class="empty">
          Nenhum papel cadastrado.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
    }
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
    }
    .acoes-cell {
      text-align: right;
      white-space: nowrap;
    }
    .papel-nome {
      font-weight: 500;
    }
    .permissao-chip {
      display: inline-block;
      background: #e8eaf6;
      color: #3f51b5;
      border-radius: 12px;
      padding: 2px 10px;
      font-size: 12px;
      margin: 2px 4px 2px 0;
    }
    .sem-permissoes {
      color: rgba(0, 0, 0, 0.5);
    }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
  `,
})
export class PermissoesComponent implements OnInit {
  private readonly papeisService = inject(PapeisService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  papeis: Papel[] = [];
  carregando = false;
  readonly colunas = ['nome', 'descricao', 'permissoes', 'usuarios', 'acoes'];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.papeisService.listar().subscribe({
      next: (papeis) => {
        this.papeis = papeis;
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
    const ref = this.dialog.open(PapelFormDialogComponent, {
      width: '620px',
      data: {},
    });

    ref.afterClosed().subscribe((valor) => {
      if (!valor) {
        return;
      }
      this.papeisService.criar(valor).subscribe({
        next: () => {
          this.snackBar.open('Papel criado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  editar(papel: Papel): void {
    const ref = this.dialog.open(PapelFormDialogComponent, {
      width: '620px',
      data: { papel },
    });

    ref.afterClosed().subscribe((valor) => {
      if (!valor) {
        return;
      }
      this.papeisService.atualizar(papel.nome, valor).subscribe({
        next: () => {
          this.snackBar.open('Papel atualizado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  excluir(papel: Papel): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Excluir papel',
        mensagem: `Deseja realmente excluir o papel "${papel.nome}"? Essa ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
      },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }
      this.papeisService.excluir(papel.nome).subscribe({
        next: () => {
          this.snackBar.open('Papel excluído.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }
}
