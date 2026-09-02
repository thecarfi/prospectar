import { NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Programacao } from '../core/models';
import { InteracoesService } from '../core/services/interacoes.service';
import { ProgramacoesService } from '../core/services/programacoes.service';
import { InteracaoDialogComponent, InteracaoDialogData } from './interacao-dialog.component';

export interface ConcluirProgramacaoDialogData {
  programacao: Programacao;
  clientesSemInteracao: { cliente_id: number; cliente_nome: string }[];
}

interface Pendente {
  cliente_id: number;
  cliente_nome: string;
  interacao_registrada: boolean;
}

@Component({
  selector: 'app-concluir-programacao-dialog',
  imports: [NgIf, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>Concluir programação</h2>
    <mat-dialog-content>
      <ng-container *ngIf="pendentesFaltantes.length === 0; else temPendentes">
        <p>
          Todos os {{ totalClientes }} cliente(s) da programação possuem interação vinculada.
          Deseja concluir?
        </p>
      </ng-container>
      <ng-template #temPendentes>
        <p class="warn-msg">
          <mat-icon color="warn" class="warn-icon">warning</mat-icon>
          {{ pendentesFaltantes.length }} cliente(s) ainda não possuem interação vinculada.
          Informe a interação de cada um antes de concluir.
        </p>
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z0 pending-table">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let item">
              {{ item.cliente_nome }}
              <mat-icon class="ok-icon" color="primary" *ngIf="item.interacao_registrada" matTooltip="Interação registrada">check_circle</mat-icon>
            </td>
          </ng-container>
          <ng-container matColumnDef="acao">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let item" class="acao-cell">
              <button
                mat-flat-button
                color="primary"
                [disabled]="item.interacao_registrada"
                (click)="registrarInteracao(item)"
              >
                <mat-icon>add</mat-icon>
                {{ item.interacao_registrada ? 'Registrada' : 'Registrar interação' }}
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="pendentesFaltantes.length > 0"
        (click)="confirmarConclusao()"
      >
        Concluir
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .warn-icon {
      vertical-align: middle;
      margin-right: 8px;
    }
    .warn-msg {
      margin-top: 0;
    }
    .pending-table {
      width: 100%;
      margin-top: 4px;
    }
    .acao-cell {
      text-align: right;
      white-space: nowrap;
    }
    .ok-icon {
      vertical-align: middle;
      margin-left: 6px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
  `,
})
export class ConcluirProgramacaoDialogComponent {
  readonly data = inject<ConcluirProgramacaoDialogData>(MAT_DIALOG_DATA);
  private readonly programacoesService = inject(ProgramacoesService);
  private readonly interacoesService = inject(InteracoesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ConcluirProgramacaoDialogComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly programacao: Programacao = this.data.programacao;
  readonly totalClientes = this.programacao.clientes?.length ?? 0;

  pendentes: Pendente[] = this.programacao.clientes?.length
    ? this.programacao.clientes.map((c) => ({
        cliente_id: c.cliente_id,
        cliente_nome: c.cliente_nome ?? '',
        interacao_registrada: !!c.tem_interacao,
      }))
    : this.data.clientesSemInteracao.map((c) => ({
        cliente_id: c.cliente_id,
        cliente_nome: c.cliente_nome,
        interacao_registrada: false,
      }));

  readonly dataSource = new MatTableDataSource<Pendente>(this.pendentes);

  get pendentesFaltantes(): Pendente[] {
    return this.dataSource.data.filter((p) => !p.interacao_registrada);
  }

  private atualizarPendentes(): void {
    this.programacoesService.obter(this.programacao.id).subscribe({
      next: (atual) => {
        this.pendentes = (atual.clientes ?? []).map((c) => ({
          cliente_id: c.cliente_id,
          cliente_nome: c.cliente_nome ?? '',
          interacao_registrada: !!c.tem_interacao,
        }));
        this.dataSource.data = [...this.pendentes];
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  readonly colunas = ['nome', 'acao'];

  registrarInteracao(item: Pendente): void {
    const ref = this.dialog.open(InteracaoDialogComponent, {
      width: '560px',
      data: {
        interacao: null,
        selecionarCliente: false,
        clientePreselecionadoNome: item.cliente_nome,
        clientePreselecionado: { id: item.cliente_id, nome: item.cliente_nome },
        programacao_id: this.programacao.id,
      } as InteracaoDialogData,
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      const tipo = dados.tipo || 'visita';
      this.interacoesService.criarGlobal({ ...dados, tipo }).subscribe({
        next: () => {
          this.snackBar.open('Interação registrada.', 'Fechar', { duration: 2000 });
          this.atualizarPendentes();
        },
        error: (erro) => {
          this.snackBar.open(erro?.error?.mensagem || 'Erro ao registrar interação.', 'Fechar', { duration: 4000 });
        },
      });
    });
  }

  confirmarConclusao(): void {
    this.programacoesService.concluir(this.programacao.id).subscribe({
      next: () => {
        this.snackBar.open('Programação concluída com sucesso.', 'Fechar', { duration: 3000 });
        this.dialogRef.close({ concluida: true });
      },
      error: (erro: any) => {
        const corpo = erro?.error;
        if (corpo?.data?.clientes_sem_interacao) {
          this.snackBar.open(corpo.message || 'Há clientes sem interação.', 'Fechar', { duration: 4000 });
          this.dialogRef.close({
            sem_interacoes: true,
            clientes_sem_interacao: corpo.data.clientes_sem_interacao,
          });
          return;
        }
        this.snackBar.open(corpo?.message || 'Erro ao concluir programação.', 'Fechar', { duration: 4000 });
      },
    });
  }
}
