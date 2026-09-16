import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CarteirizacaoService } from '../../core/services/carteirizacao.service';
import { ClienteCarteirizacao } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';

@Component({
  selector: 'app-carteirizacao',
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    PermissaoDirective,
  ],
  template: `
    <div class="header">
      <h1>Carteirização</h1>
    </div>

    <mat-card class="filter-card">
      <mat-card-content>
        <form [formGroup]="filtros" (ngSubmit)="buscar()" class="filters">
          <mat-form-field appearance="outline" class="filter-nome">
            <mat-label>Nome do cliente</mat-label>
            <input matInput formControlName="nome_pagador" placeholder="Parte do nome" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-cnpj">
            <mat-label>CNPJ do cliente</mat-label>
            <input matInput formControlName="cnpj_pagador" placeholder="Parte do CNPJ" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Carteira responsável</mat-label>
            <mat-select formControlName="carteira_responsavel">
              <mat-option [value]="null">Todas</mat-option>
              <mat-option [value]="valorVazio">Vazio</mat-option>
              <mat-option *ngFor="let c of carteiras" [value]="c">{{ c }}</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="filter-actions">
            <button mat-flat-button color="primary" type="submit">Filtrar</button>
            <button mat-button type="button" (click)="limpar()">Limpar</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content class="table-wrap">
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z0">
          <ng-container matColumnDef="nome_pagador">
            <th mat-header-cell *matHeaderCellDef>Nome cliente</th>
            <td mat-cell *matCellDef="let d">{{ d.nome_pagador }}</td>
          </ng-container>
          <ng-container matColumnDef="cnpj_pagador">
            <th mat-header-cell *matHeaderCellDef>CNPJ cliente</th>
            <td mat-cell *matCellDef="let d">{{ d.cnpj_pagador }}</td>
          </ng-container>
          <ng-container matColumnDef="qtde_cte">
            <th mat-header-cell *matHeaderCellDef>Qtde CT-e</th>
            <td mat-cell *matCellDef="let d">{{ d.qtde_cte }}</td>
          </ng-container>
          <ng-container matColumnDef="qtde_meses_faturamento">
            <th mat-header-cell *matHeaderCellDef>Qtde meses faturado</th>
            <td mat-cell *matCellDef="let d">{{ d.qtde_meses_faturamento }}</td>
          </ng-container>
          <ng-container matColumnDef="maior_data_emissao">
            <th mat-header-cell *matHeaderCellDef>Última emissão</th>
            <td mat-cell *matCellDef="let d">
              {{ d.maior_data_emissao ? (d.maior_data_emissao | date: 'dd/MM/yyyy') : '' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="carteira_responsavel">
            <th mat-header-cell *matHeaderCellDef>Responsável</th>
            <td mat-cell *matCellDef="let d">{{ d.carteira_responsavel || '' }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              <button mat-icon-button
                      [matTooltip]="d.carteira_responsavel ? 'Alterar carteira' : 'Atribuir carteira'"
                      appPermissao="carteirizacao:editar"
                      (click)="atribuirCarteira(d)">
                <mat-icon>assignment_ind</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && dataSource.data.length === 0" class="empty">
          Nenhum cliente encontrado.
        </p>
        <mat-paginator
          *ngIf="dataSource.data.length > 0"
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
    .filter-nome {
      min-width: 260px;
      flex: 1 1 260px;
    }
    .filter-cnpj {
      min-width: 200px;
    }
    .filter-actions {
      display: flex;
      gap: 8px;
    }
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
    }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
  `,
})
export class CarteirizacaoComponent implements OnInit {
  private readonly service = inject(CarteirizacaoService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly filtros = this.fb.nonNullable.group({
    nome_pagador: [''],
    cnpj_pagador: [''],
    carteira_responsavel: [null as string | null],
  });

  readonly valorVazio = '__vazio__';

  readonly colunas = [
    'nome_pagador',
    'cnpj_pagador',
    'qtde_cte',
    'qtde_meses_faturamento',
    'maior_data_emissao',
    'carteira_responsavel',
    'acoes',
  ];

  carteiras: string[] = [];
  dataSource = new MatTableDataSource<ClienteCarteirizacao>();
  carregando = false;

  total = 0;
  pagina = 1;
  limite = 10;

  ngOnInit(): void {
    this.service.obterFiltros().subscribe((meta) => {
      this.carteiras = meta.carteiras;
      this.cdr.markForCheck();
    });
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

  atribuirCarteira(cliente: ClienteCarteirizacao): void {
    const dialogRef = this.dialog.open(CarteirizacaoCarteiraDialogComponent, {
      width: '480px',
      data: { cliente },
    });

    dialogRef.afterClosed().subscribe((nomeCarteira: string | undefined) => {
      if (!nomeCarteira || !cliente.cnpj_pagador) return;
      this.service
        .atribuirCarteira(cliente.cnpj_pagador, nomeCarteira)
        .subscribe({
          next: () => {
            this.snackBar.open('Carteira atribuída com sucesso.', 'Fechar', {
              duration: 3000,
            });
            this.carregar();
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.message || 'Erro ao atribuir carteira.',
              'Fechar',
              { duration: 5000 }
            );
          },
        });
    });
  }

  private carregar(): void {
    this.carregando = true;
    const f = this.filtros.getRawValue();
    const filtroValor = {
      nome_pagador: f.nome_pagador || undefined,
      cnpj_pagador: f.cnpj_pagador || undefined,
      carteira_responsavel: f.carteira_responsavel ?? undefined,
    };
    this.service.listar(filtroValor, this.pagina, this.limite).subscribe({
      next: (res) => {
        this.dataSource.data = res.dados;
        this.total = res.total;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.dataSource.data = [];
        this.total = 0;
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }
}

@Component({
  selector: 'app-carteirizacao-carteira-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Atribuir Carteira</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome do cliente</mat-label>
          <input matInput [value]="data.cliente.nome_pagador" disabled />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>CNPJ do cliente</mat-label>
          <input matInput [value]="data.cliente.cnpj_pagador" disabled />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Carteira responsável</mat-label>
          <input matInput formControlName="nome_carteira"
                 placeholder="Digite a carteira" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary"
              [disabled]="formulario.get('nome_carteira')!.invalid"
              (click)="salvar()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width { width: 100%; }
    .dialog-form { display: flex; flex-direction: column; gap: 4px; }
  `,
})
export class CarteirizacaoCarteiraDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<CarteirizacaoCarteiraDialogComponent>
  );
  private readonly fb = inject(FormBuilder);

  readonly formulario = this.fb.nonNullable.group({
    nome_carteira: ['', Validators.required],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly data: { cliente: ClienteCarteirizacao }
  ) {
    this.formulario.patchValue({
      nome_carteira: data.cliente.carteira_responsavel || '',
    });
  }

  salvar(): void {
    const raw = this.formulario.getRawValue();
    this.dialogRef.close(raw.nome_carteira);
  }
}