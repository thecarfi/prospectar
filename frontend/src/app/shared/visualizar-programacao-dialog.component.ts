import { DatePipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Programacao, ProgramacaoStatus } from '../core/models';

export interface VisualizarProgramacaoDialogData {
  programacao: Programacao;
}

@Component({
  selector: 'app-visualizar-programacao-dialog',
  imports: [NgIf, DatePipe, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Visualizar programação</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput [value]="programacao.titulo" readonly />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Data início</mat-label>
            <input matInput [value]="programacao.data_inicio | date: 'dd/MM/yyyy'" readonly />
          </mat-form-field>
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Data fim</mat-label>
            <input matInput [value]="programacao.data_fim | date: 'dd/MM/yyyy'" readonly />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Local</mat-label>
          <input matInput [value]="descricaoLocal" readonly />
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="programacao.descricao">
          <mat-label>Descrição</mat-label>
          <textarea matInput [value]="programacao.descricao" rows="3" readonly></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <input matInput [value]="rotuloStatus" readonly />
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close cdkFocusInitial>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
      min-width: 440px;
    }
    .row {
      display: flex;
      gap: 12px;
    }
    .grow {
      flex: 1;
    }
  `,
})
export class VisualizarProgramacaoDialogComponent {
  readonly data = inject<VisualizarProgramacaoDialogData>(MAT_DIALOG_DATA);
  readonly programacao: Programacao = this.data.programacao;

  get descricaoLocal(): string {
    if (this.programacao.municipio_nome && this.programacao.regiao) {
      return `${this.programacao.municipio_nome}${this.programacao.municipio_uf ? ' - ' + this.programacao.municipio_uf : ''} (${this.programacao.regiao})`;
    }
    if (this.programacao.municipio_nome) {
      return `${this.programacao.municipio_nome}${this.programacao.municipio_uf ? ' - ' + this.programacao.municipio_uf : ''}`;
    }
    return this.programacao.regiao || '—';
  }

  get rotuloStatus(): string {
    return rotuloStatus(this.programacao.status);
  }
}

export function rotuloStatus(status: ProgramacaoStatus): string {
  const mapa: Record<ProgramacaoStatus, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  };
  return mapa[status] || status;
}
