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
import { StatusCliente } from '../../core/models';

export interface StatusClienteFormDialogData {
  status?: StatusCliente;
}

@Component({
  selector: 'app-status-form-dialog',
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
      {{ data.status ? 'Editar status' : 'Novo status' }}
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
        <div class="cor-field">
          <label>Cor *</label>
          <div class="cor-input">
            <input formControlName="cor" type="color" />
            <span>{{ formulario.controls.cor.value }}</span>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="formulario.invalid" (click)="salvar()">
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
    .cor-field {
      margin: 8px 0 4px;
    }
    .cor-field label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    .cor-input {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }
    .cor-input input {
      width: 48px;
      height: 32px;
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      background: none;
      cursor: pointer;
    }
  `,
})
export class StatusClienteFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<StatusClienteFormDialogComponent>);
  readonly data = inject<StatusClienteFormDialogData>(MAT_DIALOG_DATA);

  readonly formulario = this.fb.nonNullable.group({
    nome: [this.data.status?.nome || '', Validators.required],
    descricao: [this.data.status?.descricao || ''],
    cor: [this.data.status?.cor || '#757575', Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
  });

  salvar(): void {
    if (this.formulario.invalid) {
      return;
    }
    const valor = this.formulario.getRawValue();
    this.dialogRef.close({
      ...valor,
      descricao: valor.descricao || null,
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
