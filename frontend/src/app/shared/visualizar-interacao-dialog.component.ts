import { Component, inject } from '@angular/core';
import { DatePipe, NgIf } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Interacao } from '../core/models';

export interface VisualizarInteracaoDialogData {
  interacao: Interacao;
}

@Component({
  selector: 'app-visualizar-interacao-dialog',
  imports: [
    NgIf,
    DatePipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Visualizar interação</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline" *ngIf="interacao.cliente_nome">
          <mat-label>Cliente</mat-label>
          <input matInput [value]="interacao.cliente_nome" readonly />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <input matInput [value]="rotuloTipo" readonly />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Assunto</mat-label>
          <input matInput [value]="interacao.assunto" readonly />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <textarea
            matInput
            [value]="interacao.descricao || ''"
            rows="4"
            readonly
          ></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Data da interação</mat-label>
          <input
            matInput
            [value]="interacao.ocorreu_em | date: 'dd/MM/yyyy HH:mm'"
            readonly
          />
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
    }
  `,
})
export class VisualizarInteracaoDialogComponent {
  readonly data = inject<VisualizarInteracaoDialogData>(MAT_DIALOG_DATA);

  readonly interacao: Interacao = this.data.interacao;

  get rotuloTipo(): string {
    const mapa: Record<string, string> = {
      ligacao: 'Ligação',
      visita: 'Visita',
      anotacao: 'Anotação',
      mensagem: 'Mensagem',
    };
    return mapa[this.interacao.tipo] || this.interacao.tipo;
  }
}
