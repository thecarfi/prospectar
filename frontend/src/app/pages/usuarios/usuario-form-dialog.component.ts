import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
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
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PapeisService } from '../../core/services/papeis.service';
import { Papel, Usuario } from '../../core/models';

export interface UsuarioFormDialogData {
  usuario?: Usuario;
}

export interface UsuarioFormResult {
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  senha?: string;
}

@Component({
  selector: 'app-usuario-form-dialog',
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.usuario ? 'Editar usuário' : 'Novo usuário' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="form-column">
        <mat-form-field appearance="outline">
          <mat-label>Nome *</mat-label>
          <input matInput formControlName="nome" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>E-mail *</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ data.usuario ? 'Nova senha (opcional)' : 'Senha *' }}</mat-label>
          <input matInput formControlName="senha" type="password" />
          <mat-hint *ngIf="data.usuario">Deixe vazio para manter a atual</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Confirmar senha</mat-label>
          <input matInput formControlName="confirmarSenha" type="password" />
          <mat-error *ngIf="formulario.hasError('senhasDiferentes')">
            As senhas não coincidem
          </mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Papel</mat-label>
          <mat-select formControlName="papel">
            <mat-option *ngFor="let p of papeis" [value]="p.nome">
              {{ rotuloPapel(p.nome) }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-slide-toggle formControlName="ativo">Ativo</mat-slide-toggle>
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
      min-width: 380px;
    }
  `,
})
export class UsuarioFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UsuarioFormDialogComponent>);
  private readonly papeisService = inject(PapeisService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly data = inject<UsuarioFormDialogData>(MAT_DIALOG_DATA);

  readonly formulario = this.fb.nonNullable.group(
    {
      nome: [this.data.usuario?.nome || '', Validators.required],
      email: [
        this.data.usuario?.email || '',
        [Validators.required, Validators.email],
      ],
      senha: [
        '',
        this.data.usuario
          ? [this.senhaMinima]
          : [Validators.required, this.senhaMinima],
      ],
      confirmarSenha: [''],
      papel: [this.data.usuario?.papel || 'visualizador'],
      ativo: [this.data.usuario ? this.data.usuario.ativo : true],
    },
    { validators: [this.validarSenhas] }
  );

  papeis: Papel[] = [];

  ngOnInit(): void {
    this.papeisService.listar().subscribe({
      next: (papeis) => {
        this.papeis = papeis;
        this.cdr.markForCheck();
      },
      error: () => {
        this.papeis = [
          { id: 0, nome: 'admin', permissoes: [] },
          { id: 0, nome: 'operador', permissoes: [] },
          { id: 0, nome: 'visualizador', permissoes: [] },
        ];
        this.cdr.markForCheck();
      },
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      return;
    }
    const { nome, email, senha, papel, ativo } = this.formulario.getRawValue();
    const resultado: UsuarioFormResult = {
      nome,
      email,
      papel,
      ativo,
      ...(senha ? { senha } : {}),
    };
    this.dialogRef.close(resultado);
  }

  fechar(): void {
    this.dialogRef.close();
  }

  rotuloPapel(papel: string): string {
    const mapa: Record<string, string> = {
      admin: 'Admin',
      operador: 'Operador',
      visualizador: 'Visualizador',
    };
    return mapa[papel] || papel;
  }

  private validarSenhas(controle: AbstractControl): ValidationErrors | null {
    const grupo = controle as FormGroup;
    const senha = grupo.get('senha')?.value ?? '';
    const confirmar = grupo.get('confirmarSenha')?.value ?? '';
    if (senha && senha !== confirmar) {
      return { senhasDiferentes: true };
    }
    return null;
  }

  private senhaMinima(controle: AbstractControl): ValidationErrors | null {
    const valor = controle.value ?? '';
    if (valor && valor.length < 6) {
      return { minlength: { requiredLength: 6, actualLength: valor.length } };
    }
    return null;
  }
}
