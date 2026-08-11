import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Segmento } from '../../core/models';

export interface SegmentoFormDialogData {
  segmento?: Segmento;
}

@Component({
  selector: 'app-segmento-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.segmento ? 'Editar segmento' : 'Novo segmento' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="form-column">
        <mat-form-field appearance="outline">
          <mat-label>Nome *</mat-label>
          <input matInput formControlName="nome" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <textarea matInput formControlName="descricao" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="formulario.invalid"
        (click)="salvar()"
      >
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-column {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 320px;
    }
  `,
})
export class SegmentoFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SegmentoFormDialogComponent>);
  readonly data = inject<SegmentoFormDialogData>(MAT_DIALOG_DATA);

  readonly formulario = this.fb.nonNullable.group({
    nome: [
      this.data.segmento?.nome || '',
      Validators.required,
    ],
    descricao: [this.data.segmento?.descricao || ''],
  });

  salvar(): void {
    if (this.formulario.invalid) {
      return;
    }
    this.dialogRef.close(this.formulario.getRawValue());
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
