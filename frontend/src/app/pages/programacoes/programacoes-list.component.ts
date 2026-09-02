import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Programacao, ProgramacaoStatus } from '../../core/models';
import { ProgramacoesService } from '../../core/services/programacoes.service';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { ProgramacaoDialogComponent, ProgramacaoDialogData } from '../../shared/programacao-dialog.component';
import { VisualizarProgramacaoDialogComponent } from '../../shared/visualizar-programacao-dialog.component';
import { ConcluirProgramacaoDialogComponent } from '../../shared/concluir-programacao-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-programacoes-list',
  imports: [
    NgIf,
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
      <h1>Programações de Visita</h1>
      <button
        mat-flat-button
        color="primary"
        appPermissao="programacoes:criar"
        (click)="novaProgramacao()"
      >
        <mat-icon>add</mat-icon>
        Nova programação
      </button>
    </div>

    <mat-card class="filter-card">
      <mat-card-content>
        <form [formGroup]="filtros" (ngSubmit)="buscar()" class="filters">
          <mat-form-field appearance="outline" class="filter-titulo">
            <mat-label>Título</mat-label>
            <input matInput formControlName="titulo" placeholder="Buscar por título" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option value="pendente">Pendente</mat-option>
              <mat-option value="em_andamento">Em andamento</mat-option>
              <mat-option value="concluida">Concluída</mat-option>
              <mat-option value="cancelada">Cancelada</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data início</mat-label>
            <input matInput formControlName="data_inicio" type="date" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data fim</mat-label>
            <input matInput formControlName="data_fim" type="date" />
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
        <table mat-table [dataSource]="programacoes" class="mat-elevation-z0">
          <ng-container matColumnDef="titulo">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let p">
              <a [routerLink]="['/programacoes', p.id]">{{ p.titulo }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="periodo">
            <th mat-header-cell *matHeaderCellDef>Período</th>
            <td mat-cell *matCellDef="let p">
              {{ p.data_inicio | date: 'dd/MM/yyyy' }} — {{ p.data_fim | date: 'dd/MM/yyyy' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="local">
            <th mat-header-cell *matHeaderCellDef>Local</th>
            <td mat-cell *matCellDef="let p">
              {{ p.municipio_nome ? p.municipio_nome + (p.municipio_uf ? ' - ' + p.municipio_uf : '') : (p.regiao || '—') }}
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <span class="status-pill" [class]="p.status">{{ rotuloStatus(p.status) }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="progresso">
            <th mat-header-cell *matHeaderCellDef>Interações</th>
            <td mat-cell *matCellDef="let p">
              {{ p.clientes_com_interacao ?? 0 }}/{{ p.clientes_count ?? 0 }}
              <mat-progress-bar
                mode="determinate"
                [value]="percentual(p)"
                class="progress-bar"
                [matTooltip]="p.clientes_count ? (p.clientes_com_interacao ?? 0) + ' de ' + p.clientes_count + ' clientes com interação' : ''"
              ></mat-progress-bar>
            </td>
          </ng-container>
          <ng-container matColumnDef="criado_por">
            <th mat-header-cell *matHeaderCellDef>Criado por</th>
            <td mat-cell *matCellDef="let p">{{ p.criado_por_nome || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p" class="acoes-cell">
              <button mat-icon-button matTooltip="Visualizar" (click)="visualizar(p)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button
                mat-icon-button
                appPermissao="programacoes:criar"
                matTooltip="Iniciar (em andamento)"
                [disabled]="p.status !== 'pendente'"
                (click)="iniciar(p)"
              >
                <mat-icon>play_circle</mat-icon>
              </button>
              <button
                mat-icon-button
                appPermissao="programacoes:editar"
                matTooltip="Editar"
                [disabled]="p.status === 'concluida' || p.status === 'cancelada'"
                (click)="editar(p)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                appPermissao="programacoes:editar"
                matTooltip="Concluir"
                [disabled]="p.status !== 'em_andamento'"
                (click)="concluir(p)"
              >
                <mat-icon>check_circle</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                appPermissao="programacoes:excluir"
                matTooltip="Excluir"
                [disabled]="p.status === 'concluida'"
                (click)="excluir(p)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && programacoes.length === 0" class="empty">
          Nenhuma programação encontrada.
        </p>
        <mat-paginator
          [length]="total"
          [pageSize]="limite"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="naPagina($event)"
          [showFirstLastButtons]="true"
        ></mat-paginator>
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
    .header h1 { margin: 0; }
    .filter-card { margin-bottom: 16px; }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: baseline;
    }
    .filter-titulo { min-width: 220px; flex: 1; }
    .filter-actions { display: flex; gap: 8px; }
    .table-wrap { padding: 8px 16px 16px; position: relative; }
    .status-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-pill.pendente { background: #fff3e0; color: #e65100; }
    .status-pill.em_andamento { background: #e3f2fd; color: #1565c0; }
    .status-pill.concluida { background: #e8f5e9; color: #2e7d32; }
    .status-pill.cancelada { background: #eceff1; color: #607d8b; }
    .progress-bar { margin-top: 6px; }
    .acoes-cell { text-align: right; white-space: nowrap; }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
  `,
})
export class ProgramacoesListComponent implements OnInit {
  private readonly programacoesService = inject(ProgramacoesService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly filtros = this.fb.nonNullable.group({
    titulo: [''],
    status: [null as string | null],
    data_inicio: [''],
    data_fim: [''],
  });

  programacoes: Programacao[] = [];
  total = 0;
  pagina = 1;
  limite = 10;
  carregando = false;
  readonly colunas = ['titulo', 'periodo', 'local', 'status', 'progresso', 'criado_por', 'acoes'];

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

  novaProgramacao(): void {
    const ref = this.dialog.open(ProgramacaoDialogComponent, { width: '560px' });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.programacoesService.criar(dados).subscribe({
        next: () => {
          this.snackBar.open('Programação criada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: (e) => this.snackBar.open(e?.error?.message || 'Erro ao criar programação.', 'Fechar', { duration: 4000 }),
      });
    });
  }

  visualizar(p: Programacao): void {
    this.dialog.open(VisualizarProgramacaoDialogComponent, {
      width: '520px',
      data: { programacao: p },
    });
  }

  editar(p: Programacao): void {
    const ref = this.dialog.open(ProgramacaoDialogComponent, {
      width: '560px',
      data: { programacao: p } as ProgramacaoDialogData,
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.programacoesService.atualizar(p.id, dados).subscribe({
        next: () => {
          this.snackBar.open('Programação atualizada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: (e) => this.snackBar.open(e?.error?.message || 'Erro ao editar programação.', 'Fechar', { duration: 4000 }),
      });
    });
  }

  iniciar(p: Programacao): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Iniciar programação',
        mensagem: `Mover a programação "${p.titulo}" para "em andamento"?`,
        textoConfirmar: 'Iniciar',
      },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.programacoesService.alterarStatus(p.id, 'em_andamento').subscribe({
        next: () => {
          this.snackBar.open('Programação iniciada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  concluir(p: Programacao): void {
    this.programacoesService.concluir(p.id).subscribe({
      next: () => {
        this.snackBar.open('Programação concluída.', 'Fechar', { duration: 3000 });
        this.carregar();
      },
      error: (erro: any) => {
        const corpo = erro?.error;
        if (corpo?.data?.clientes_sem_interacao) {
          this.programacoesService.obter(p.id).subscribe((detalhe) => {
            this.dialog.open(ConcluirProgramacaoDialogComponent, {
              width: '640px',
              data: {
                programacao: detalhe,
                clientesSemInteracao: corpo.data.clientes_sem_interacao,
              },
            }).afterClosed().subscribe((res) => {
              if (res?.concluida) this.carregar();
            });
          });
          return;
        }
        this.snackBar.open(corpo?.message || 'Erro ao concluir programação.', 'Fechar', { duration: 4000 });
      },
    });
  }

  excluir(p: Programacao): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Excluir programação',
        mensagem: `Deseja excluir a programação "${p.titulo}"? Essa ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
      },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.programacoesService.excluir(p.id).subscribe({
        next: () => {
          this.snackBar.open('Programação excluída.', 'Fechar', { duration: 3000 });
          if (this.programacoes.length === 1 && this.pagina > 1) this.pagina--;
          this.carregar();
        },
        error: (e) => this.snackBar.open(e?.error?.message || 'Erro ao excluir programação.', 'Fechar', { duration: 4000 }),
      });
    });
  }

  rotuloStatus(status: ProgramacaoStatus): string {
    const mapa: Record<ProgramacaoStatus, string> = {
      pendente: 'Pendente',
      em_andamento: 'Em andamento',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
    };
    return mapa[status] || status;
  }

  percentual(p: Programacao): number {
    const total = p.clientes_count ?? 0;
    if (total === 0) return 0;
    return Math.round(((p.clientes_com_interacao ?? 0) / total) * 100);
  }

  private carregar(): void {
    this.carregando = true;
    const { titulo, status, data_inicio, data_fim } = this.filtros.getRawValue();
    this.programacoesService
      .listar({
        titulo: titulo || undefined,
        status: status ?? undefined,
        data_inicio: data_inicio || undefined,
        data_fim: data_fim || undefined,
        pagina: this.pagina,
        limite: this.limite,
      })
      .subscribe({
        next: (res) => {
          this.programacoes = res.dados;
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
