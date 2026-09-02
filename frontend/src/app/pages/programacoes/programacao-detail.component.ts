import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Cliente, Programacao, ProgramacaoCliente, ProgramacaoStatus } from '../../core/models';
import { ProgramacoesService } from '../../core/services/programacoes.service';
import { ClientesService } from '../../core/services/clientes.service';
import { InteracoesService } from '../../core/services/interacoes.service';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { ProgramacaoDialogComponent } from '../../shared/programacao-dialog.component';
import { ConcluirProgramacaoDialogComponent } from '../../shared/concluir-programacao-dialog.component';
import { VisualizarInteracaoDialogComponent } from '../../shared/visualizar-interacao-dialog.component';
import { InteracaoDialogComponent } from '../../shared/interacao-dialog.component';

@Component({
  selector: 'app-programacao-detail',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatAutocompleteModule,
    PermissaoDirective,
  ],
  template: `
    <ng-container *ngIf="programacao">
      <div class="header">
        <div>
          <h1>{{ programacao.titulo }}</h1>
          <p class="subtitle">
            {{ programacao.data_inicio?.substring(0, 10) }} — {{ programacao.data_fim?.substring(0, 10) }}
            <ng-container *ngIf="descricaoLocal"> · {{ descricaoLocal }}</ng-container>
            <span class="status-pill" [class]="programacao.status">{{ rotuloStatus(programacao.status) }}</span>
          </p>
          <p class="subtitle" *ngIf="programacao.descricao">{{ programacao.descricao }}</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button routerLink="/programacoes">
            <mat-icon>arrow_back</mat-icon>
            Voltar
          </button>
          <button
            mat-flat-button
            color="primary"
            appPermissao="programacoes:editar"
            [disabled]="programacao.status === 'concluida' || programacao.status === 'cancelada'"
            (click)="editarProgramacao()"
          >
            <mat-icon>edit</mat-icon>
            Editar
          </button>
          <button
            mat-flat-button
            color="accent"
            appPermissao="programacoes:editar"
            *ngIf="programacao.status === 'pendente'"
            (click)="iniciar()"
          >
            <mat-icon>play_circle</mat-icon>
            Iniciar
          </button>
          <button
            mat-flat-button
            appPermissao="programacoes:editar"
            *ngIf="programacao.status === 'em_andamento'"
            (click)="abrirConclusao()"
          >
            <mat-icon>check_circle</mat-icon>
            Concluir
          </button>
        </div>
      </div>

      <mat-card *ngIf="programacao.status !== 'concluida' && programacao.status !== 'cancelada'">
        <mat-card-content>
          <div class="add-cliente">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>Adicionar cliente</mat-label>
              <input
                matInput
                [formControl]="buscaCliente"
                [matAutocomplete]="auto"
                placeholder="Busque pelo nome do cliente"
              />
              <mat-icon matPrefix>search</mat-icon>
              <mat-autocomplete
                #auto="matAutocomplete"
                [displayWith]="exibirCliente"
                (optionSelected)="aoSelecionarCliente($event.option.value)"
              >
                <mat-option *ngFor="let cliente of clientesOpcoes" [value]="cliente">
                  {{ cliente.nome }}
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <button
              mat-flat-button
              color="primary"
              appPermissao="programacoes:criar"
              [disabled]="!clienteSelecionado"
              (click)="adicionarCliente()"
            >
              <mat-icon>person_add</mat-icon>
              Adicionar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content class="table-wrap">
          <div class="card-title">
            <h3>Clientes ({{ programacao.clientes?.length ?? 0 }})</h3>
            <span *ngIf="semInteracaoCount > 0" class="pend-msg">
              {{ semInteracaoCount }} cliente(s) sem interação
            </span>
          </div>
          <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
          <table mat-table [dataSource]="programacao.clientes || []" class="mat-elevation-z0">
            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Cliente</th>
              <td mat-cell *matCellDef="let c">
                <a [routerLink]="['/clientes', c.cliente_id]">{{ c.cliente_nome }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="interacao">
              <th mat-header-cell *matHeaderCellDef>Interação</th>
              <td mat-cell *matCellDef="let c">
                <span *ngIf="c.tem_interacao" class="ok-badge">Sim</span>
                <span *ngIf="!c.tem_interacao" class="no-badge">Não</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c" class="acoes-cell">
                <button
                  mat-stroked-button
                  color="primary"
                  appPermissao="interacoes:criar"
                  *ngIf="programacao.status !== 'concluida' && programacao.status !== 'cancelada'"
                  (click)="registrarInteracao(c)"
                  [disabled]="c.tem_interacao"
                  matTooltip="Registrar interação de visita"
                >
                  <mat-icon>add_comment</mat-icon>
                  {{ c.tem_interacao ? 'Interação registrada' : 'Registrar interação' }}
                </button>
                <button
                  mat-icon-button
                  appPermissao="interacoes:ver"
                  *ngIf="c.tem_interacao && c.interacao"
                  matTooltip="Visualizar interação"
                  (click)="visualizarInteracao(c)"
                >
                  <mat-icon>visibility</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  appPermissao="programacoes:editar"
                  *ngIf="programacao.status !== 'concluida' && programacao.status !== 'cancelada'"
                  matTooltip="Remover cliente"
                  (click)="removerCliente(c)"
                >
                  <mat-icon>person_remove</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="colunas"></tr>
            <tr mat-row *matRowDef="let row; columns: colunas"></tr>
          </table>
          <p *ngIf="!carregando && !programacao.clientes?.length" class="empty">
            Nenhum cliente vinculado a esta programação.
          </p>
        </mat-card-content>
      </mat-card>
    </ng-container>
  `,
  styles: `
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .header h1 { margin: 0 0 4px; }
    .subtitle { margin: 0 0 4px; color: rgba(0,0,0,0.6); }
    .header-actions { display: flex; gap: 8px; }
    .status-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }
    .status-pill.pendente { background: #fff3e0; color: #e65100; }
    .status-pill.em_andamento { background: #e3f2fd; color: #1565c0; }
    .status-pill.concluida { background: #e8f5e9; color: #2e7d32; }
    .status-pill.cancelada { background: #eceff1; color: #607d8b; }
    .add-cliente {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 8px 0;
    }
    .grow { flex: 1; }
    .card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .card-title h3 { margin: 0; }
    .pend-msg { color: #e65100; font-size: 13px; }
    .table-wrap { padding: 16px; position: relative; }
    .ok-badge { color: #2e7d32; }
    .no-badge { color: #c62828; }
    .acoes-cell { text-align: right; white-space: nowrap; }
    .empty { color: rgba(0,0,0,0.5); text-align: center; padding: 24px; }
  `,
})
export class ProgramacaoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly programacoesService = inject(ProgramacoesService);
  private readonly clientesService = inject(ClientesService);
  private readonly interacoesService = inject(InteracoesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  programacao: Programacao | null = null;
  carregando = false;
  readonly colunas = ['nome', 'interacao', 'acoes'];

  readonly buscaCliente = new FormControl<string | Cliente>('');
  clientesOpcoes: Cliente[] = [];
  clienteSelecionado: Cliente | null = null;

  private programacaoId = 0;

  ngOnInit(): void {
    this.programacaoId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
    this.buscaCliente.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((valor) => {
        if (typeof valor === 'string') {
          const selecionado = this.clienteSelecionado;
          if (selecionado && valor === selecionado.nome) {
            return;
          }
          this.clienteSelecionado = null;
          this.carregarOpcoes(valor);
        }
      });
  }

  get descricaoLocal(): string {
    const p = this.programacao;
    if (!p) return '';
    if (p.municipio_nome && p.regiao) {
      return `${p.municipio_nome}${p.municipio_uf ? ' - ' + p.municipio_uf : ''} (${p.regiao})`;
    }
    if (p.municipio_nome) {
      return `${p.municipio_nome}${p.municipio_uf ? ' - ' + p.municipio_uf : ''}`;
    }
    return p.regiao || '';
  }

  get semInteracaoCount(): number {
    return (this.programacao?.clientes ?? []).filter((c) => !c.tem_interacao).length;
  }

  carregar(): void {
    this.carregando = true;
    this.programacoesService.obter(this.programacaoId).subscribe({
      next: (p) => {
        this.programacao = p;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  aoSelecionarCliente(cliente: Cliente): void {
    this.clienteSelecionado = cliente;
    this.buscaCliente.setValue(cliente, { emitEvent: false });
    this.cdr.markForCheck();
  }

  exibirCliente(valor: Cliente | string | null): string {
    if (valor && typeof valor === 'object') {
      return valor.nome ?? '';
    }
    return typeof valor === 'string' ? valor : '';
  }

  adicionarCliente(): void {
    if (!this.clienteSelecionado || !this.programacao) return;
    const jaVinculado = this.programacao.clientes?.some(
      (c) => c.cliente_id === this.clienteSelecionado!.id
    );
    if (jaVinculado) {
      this.snackBar.open('Cliente já vinculado a esta programação.', 'Fechar', { duration: 3000 });
      return;
    }
    this.programacoesService
      .adicionarCliente(this.programacaoId, this.clienteSelecionado.id)
      .subscribe({
        next: () => {
          this.snackBar.open('Cliente adicionado.', 'Fechar', { duration: 3000 });
          this.buscaCliente.setValue('');
          this.clienteSelecionado = null;
          this.carregar();
        },
        error: (e) => this.snackBar.open(e?.error?.message || 'Erro ao adicionar cliente.', 'Fechar', { duration: 4000 }),
      });
  }

  removerCliente(c: { cliente_id: number; cliente_nome?: string }): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Remover cliente',
        mensagem: `Deseja remover "${c.cliente_nome}" desta programação?`,
        textoConfirmar: 'Remover',
      },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.programacoesService.removerCliente(this.programacaoId, c.cliente_id).subscribe({
        next: () => {
          this.snackBar.open('Cliente removido.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: (e) => this.snackBar.open(e?.error?.message || 'Erro ao remover cliente.', 'Fechar', { duration: 4000 }),
      });
    });
  }

  registrarInteracao(c: { cliente_id: number; cliente_nome?: string }): void {
    if (!this.programacao) return;
    const ref = this.dialog.open(InteracaoDialogComponent, {
      width: '560px',
      data: {
        interacao: null,
        selecionarCliente: false,
        clientePreselecionadoNome: c.cliente_nome || '',
        clientePreselecionado: { id: c.cliente_id, nome: c.cliente_nome || '' },
        programacao_id: this.programacao.id,
      },
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      const tipo = dados.tipo || 'visita';
      this.interacoesService.criarGlobal({ ...dados, tipo }).subscribe({
        next: () => {
          this.snackBar.open('Interação registrada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: (e) => this.snackBar.open(e?.error?.message || 'Erro ao registrar interação.', 'Fechar', { duration: 4000 }),
      });
    });
  }

  visualizarInteracao(c: ProgramacaoCliente): void {
    if (!c.interacao) return;
    this.dialog.open(VisualizarInteracaoDialogComponent, {
      width: '560px',
      data: { interacao: { ...c.interacao, cliente_nome: c.cliente_nome ?? '' } },
    });
  }

  editarProgramacao(): void {
    if (!this.programacao) return;
    const ref = this.dialog.open(ProgramacaoDialogComponent, {
      width: '560px',
      data: { programacao: this.programacao },
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.programacoesService.atualizar(this.programacaoId, dados).subscribe({
        next: () => {
          this.snackBar.open('Programação atualizada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  iniciar(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Iniciar programação',
        mensagem: 'Mover a programação para "em andamento"?',
        textoConfirmar: 'Iniciar',
      },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.programacoesService.alterarStatus(this.programacaoId, 'em_andamento').subscribe({
        next: () => {
          this.snackBar.open('Programação iniciada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  abrirConclusao(): void {
    if (!this.programacao) return;
    this.programacoesService.concluir(this.programacaoId).subscribe({
      next: () => {
        this.snackBar.open('Programação concluída.', 'Fechar', { duration: 3000 });
        this.carregar();
      },
      error: (erro: any) => {
        const corpo = erro?.error;
        if (corpo?.data?.clientes_sem_interacao) {
          this.dialog
            .open(ConcluirProgramacaoDialogComponent, {
              width: '640px',
              data: {
                programacao: this.programacao,
                clientesSemInteracao: corpo.data.clientes_sem_interacao,
              },
            })
            .afterClosed()
            .subscribe((res) => {
              if (res?.concluida || res?.sem_interacoes) this.carregar();
            });
          return;
        }
        this.snackBar.open(corpo?.message || 'Erro ao concluir programação.', 'Fechar', { duration: 4000 });
      },
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

  private carregarOpcoes(termo: string): void {
    this.clientesService.listar({ busca: termo || undefined, limite: 10 }).subscribe({
      next: (res) => {
        this.clientesOpcoes = res.dados;
        this.cdr.markForCheck();
      },
    });
  }
}
