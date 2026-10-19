import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RotaCotacao } from '../../core/models';
import { lerDecimal } from '../../core/utils/formato';

export interface RotaCotacaoFormData {
  rota?: RotaCotacao;
}

export interface RotaCotacaoFormResult {
  nome: string;
  icms: number;
  frete_minimo: number;
}

@Component({
  selector: 'app-rota-cotacao-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.rota ? 'Editar rota' : 'Nova rota' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="formulario">
        <mat-form-field appearance="outline">
          <mat-label>Nome da rota</mat-label>
          <input matInput formControlName="nome" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>ICMS (decimal, ex.: 0,07)</mat-label>
          <input matInput formControlName="icms" inputmode="decimal" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Frete mínimo</mat-label>
          <input matInput formControlName="frete_minimo" inputmode="decimal" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="salvar()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .formulario {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 320px;
    }
  `,
})
export class RotaCotacaoFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RotaCotacaoFormDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<RotaCotacaoFormData>(MAT_DIALOG_DATA);

  readonly formulario = this.fb.group({
    nome: [this.data.rota?.nome ?? '', Validators.required],
    icms: [this.formatarEntrada(this.data.rota?.icms), Validators.required],
    frete_minimo: [this.formatarEntrada(this.data.rota?.frete_minimo), Validators.required],
  });

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const nome = String(valores.nome ?? '').trim();
    const icms = lerDecimal(valores.icms);
    const freteMinimo = lerDecimal(valores.frete_minimo);

    if (!nome) {
      this.snackBar.open('Informe o nome da rota.', 'Fechar', { duration: 3000 });
      return;
    }
    if (!Number.isFinite(icms) || icms < 0 || icms > 1) {
      this.snackBar.open('O ICMS deve ser um decimal entre 0 e 1.', 'Fechar', { duration: 3000 });
      return;
    }
    if (!Number.isFinite(freteMinimo) || freteMinimo < 0) {
      this.snackBar.open('Informe um frete mínimo válido.', 'Fechar', { duration: 3000 });
      return;
    }

    this.dialogRef.close({ nome, icms, frete_minimo: freteMinimo });
  }

  private formatarEntrada(valor?: number): string {
    if (valor === null || valor === undefined) {
      return '';
    }
    return String(valor).replace('.', ',');
  }
}
