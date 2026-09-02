import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { DatePipe, NgIf, NgFor } from '@angular/common';
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
import { InteracoesService } from '../../core/services/interacoes.service';
import { AuthService } from '../../core/services/auth.service';
import { Interacao, InteracoesFiltrosMeta } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import {
  InteracaoDialogComponent,
  InteracaoDialogData,
} from '../../shared/interacao-dialog.component';
import { VisualizarInteracaoDialogComponent } from '../../shared/visualizar-interacao-dialog.component';

@Component({
  selector: 'app-interacoes-list',
  imports: [
    NgIf,
    NgFor,
    DatePipe,
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
      <h1>Interações</h1>
      <button
        mat-flat-button
        color="primary"
        (click)="novaInteracao()"
        appPermissao="interacoes:criar"
      >
        <mat-icon>add</mat-icon>
        Nova interação
      </button>
    </div>

    <mat-card class="filter-card">
      <mat-card-content>
        <form [formGroup]="filtros" (ngSubmit)="buscar()" class="filters">
          <mat-form-field appearance="outline" class="filter-cliente">
            <mat-label>Cliente</mat-label>
            <input
              matInput
              formControlName="cliente_nome"
              placeholder="Nome do cliente"
            />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Usuário</mat-label>
            <mat-select formControlName="criado_por">
              <mat-option *ngIf="ehAdmin" [value]="null">Todos</mat-option>
              <mat-option *ngFor="let usuario of meta.usuarios" [value]="usuario.id">
                {{ usuario.nome }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de interação</mat-label>
            <mat-select formControlName="tipo">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option *ngFor="let tipo of meta.tipos" [value]="tipo">
                {{ rotuloTipo(tipo) }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data inicial</mat-label>
            <input matInput formControlName="data_inicio" type="date" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data final</mat-label>
            <input matInput formControlName="data_fim" type="date" />
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
        <table mat-table [dataSource]="interacoes" class="mat-elevation-z0">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let interacao">
              <a [routerLink]="['/clientes', interacao.cliente_id]">{{ interacao.cliente_nome }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let interacao">
              <span class="tipo-pill" [class]="interacao.tipo">{{ rotuloTipo(interacao.tipo) }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="assunto">
            <th mat-header-cell *matHeaderCellDef>Assunto</th>
            <td mat-cell *matCellDef="let interacao">{{ interacao.assunto }}</td>
          </ng-container>
          <ng-container matColumnDef="data">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let interacao">
              {{ interacao.ocorreu_em | date: 'dd/MM/yyyy' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="criado_por">
            <th mat-header-cell *matHeaderCellDef>Criado por</th>
            <td mat-cell *matCellDef="let interacao">{{ interacao.criado_por_nome || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="programacao">
            <th mat-header-cell *matHeaderCellDef>Programação</th>
            <td mat-cell *matCellDef="let interacao">
              <a *ngIf="interacao.programacao_id" [routerLink]="['/programacoes', interacao.programacao_id]">
                {{ interacao.programacao_titulo || 'Programação' }}
              </a>
              <span *ngIf="!interacao.programacao_id">—</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let interacao" class="acoes-cell">
              <button
                mat-icon-button
                appPermissao="interacoes:ver"
                matTooltip="Visualizar"
                (click)="visualizarInteracao(interacao)"
              >
                <mat-icon>visibility</mat-icon>
              </button>
              <button
                mat-icon-button
                appPermissao="interacoes:editar"
                matTooltip="Editar"
                (click)="editarInteracao(interacao)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                appPermissao="interacoes:excluir"
                matTooltip="Excluir"
                (click)="excluirInteracao(interacao)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && interacoes.length === 0" class="empty">
          Nenhuma interação encontrada.
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
    .filter-cliente {
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
    .tipo-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .tipo-pill.ligacao { background: #e3f2fd; color: #1565c0; }
    .tipo-pill.visita { background: #e8f5e9; color: #2e7d32; }
    .tipo-pill.anotacao { background: #f3e5f5; color: #6a1b9a; }
    .tipo-pill.mensagem { background: #fffde7; color: #f9a825; }
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
export class InteracoesListComponent implements OnInit {
  private readonly interacoesService = inject(InteracoesService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly ehAdmin = this.auth.usuario()?.papel === 'admin';

  readonly filtros = this.fb.nonNullable.group({
    cliente_nome: [''],
    criado_por: [null as number | null],
    tipo: [null as string | null],
    data_inicio: [''],
    data_fim: [''],
  });

  meta: InteracoesFiltrosMeta = { usuarios: [], tipos: [] };
  interacoes: Interacao[] = [];
  total = 0;
  pagina = 1;
  limite = 10;
  carregando = false;
  readonly colunas = ['nome', 'tipo', 'assunto', 'data', 'criado_por', 'programacao', 'acoes'];

  ngOnInit(): void {
    this.interacoesService.obterFiltros().subscribe({
      next: (meta) => {
        this.meta = meta;
        this.aplicarPadraoUsuario();
        this.carregar();
      },
      error: () => this.carregar(),
    });
  }

  buscar(): void {
    this.pagina = 1;
    this.carregar();
  }

  limpar(): void {
    this.filtros.reset();
    this.aplicarPadraoUsuario();
    this.buscar();
  }

  naPagina(evento: PageEvent): void {
    this.pagina = evento.pageIndex + 1;
    this.limite = evento.pageSize;
    this.carregar();
  }

  novaInteracao(): void {
    const ref = this.dialog.open(InteracaoDialogComponent, {
      width: '560px',
      data: { selecionarCliente: true } as InteracaoDialogData,
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.interacoesService.criarGlobal(dados).subscribe({
        next: () => {
          this.snackBar.open('Interação registrada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  visualizarInteracao(interacao: Interacao): void {
    this.dialog.open(VisualizarInteracaoDialogComponent, {
      width: '560px',
      data: { interacao },
    });
  }

  editarInteracao(interacao: Interacao): void {
    const ref = this.dialog.open(InteracaoDialogComponent, {
      width: '560px',
      data: { interacao } as InteracaoDialogData,
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.interacoesService.atualizarGlobal(interacao.id, dados).subscribe({
        next: () => {
          this.snackBar.open('Interação atualizada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  excluirInteracao(interacao: Interacao): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Excluir interação',
        mensagem: `Deseja excluir a interação "${interacao.assunto}"? Essa ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
      },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }
      this.interacoesService.excluirGlobal(interacao.id).subscribe({
        next: () => {
          this.snackBar.open('Interação excluída.', 'Fechar', { duration: 3000 });
          if (this.interacoes.length === 1 && this.pagina > 1) {
            this.pagina--;
          }
          this.carregar();
        },
      });
    });
  }

  rotuloTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      ligacao: 'Ligação',
      visita: 'Visita',
      anotacao: 'Anotação',
      mensagem: 'Mensagem',
    };
    return mapa[tipo] || tipo;
  }

  private aplicarPadraoUsuario(): void {
    if (this.ehAdmin) {
      return;
    }
    const proprio = this.meta.usuarios[0];
    if (proprio) {
      this.filtros.controls.criado_por.setValue(proprio.id);
    }
  }

  private carregar(): void {
    this.carregando = true;
    const { cliente_nome, criado_por, tipo, data_inicio, data_fim } =
      this.filtros.getRawValue();
    this.interacoesService
      .listarGlobal({
        cliente_nome: cliente_nome || undefined,
        criado_por: criado_por ?? undefined,
        tipo: tipo ?? undefined,
        data_inicio: data_inicio || undefined,
        data_fim: data_fim || undefined,
        pagina: this.pagina,
        limite: this.limite,
      })
      .subscribe({
        next: (res) => {
          this.interacoes = res.dados;
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
}
