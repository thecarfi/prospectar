import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Programacao } from '../core/models';
import { SeletorMunicipioComponent } from './seletor-municipio.component';

export interface ProgramacaoDialogData {
  programacao?: Programacao | null;
}

@Component({
  selector: 'app-programacao-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    SeletorMunicipioComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ programacao ? 'Editar programação' : 'Nova programação' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Título *</mat-label>
          <input matInput formControlName="titulo" placeholder="Ex.: Visita a Vilhena e região" />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Data início *</mat-label>
            <input matInput formControlName="data_inicio" type="date" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Data fim *</mat-label>
            <input matInput formControlName="data_fim" type="date" />
          </mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Região</mat-label>
            <input matInput formControlName="regiao" placeholder="Ex.: Norte do estado" />
          </mat-form-field>
        </div>
        <app-seletor-municipio
          [estadoControl]="formulario.controls.estado"
          [municipioControl]="formulario.controls.municipio_id"
        ></app-seletor-municipio>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <textarea matInput formControlName="descricao" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="formulario.invalid || dataFimMenorQueInicio"
        (click)="salvar()"
      >
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
      min-width: 460px;
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
export class ProgramacaoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProgramacaoDialogComponent>);
  readonly data = inject<ProgramacaoDialogData>(MAT_DIALOG_DATA);

  readonly programacao: Programacao | null = this.data?.programacao ?? null;

  readonly formulario = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    data_inicio: ['', Validators.required],
    data_fim: ['', Validators.required],
    regiao: [''],
    estado: [''],
    municipio_id: [null as number | null],
    descricao: [''],
  });

  constructor() {
    if (this.programacao) {
      this.formulario.patchValue({
        titulo: this.programacao.titulo,
        data_inicio: this.programacao.data_inicio?.substring(0, 10) || '',
        data_fim: this.programacao.data_fim?.substring(0, 10) || '',
        regiao: this.programacao.regiao || '',
        estado: this.programacao.municipio_uf || '',
        municipio_id: this.programacao.municipio_id || null,
        descricao: this.programacao.descricao || '',
      });
    }
  }

  get dataFimMenorQueInicio(): boolean {
    const { data_inicio, data_fim } = this.formulario.getRawValue();
    if (!data_inicio || !data_fim) {
      return false;
    }
    return data_fim < data_inicio;
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    const { estado, ...valor } = this.formulario.getRawValue();
    this.dialogRef.close({
      ...valor,
      regiao: valor.regiao || null,
      descricao: valor.descricao || null,
    });
  }
}
