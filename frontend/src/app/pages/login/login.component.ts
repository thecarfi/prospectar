import { Component, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgIf,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header class="login-header">
          <mat-icon class="login-icon">groups</mat-icon>
          <mat-card-title>Gestão de Clientes</mat-card-title>
          <mat-card-subtitle>Entre com suas credenciais</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="formulario" (ngSubmit)="entrar()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-mail</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="username" />
              <mat-icon matPrefix>mail</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input
                matInput
                formControlName="senha"
                [type]="mostrarSenha ? 'text' : 'password'"
                autocomplete="current-password"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="mostrarSenha = !mostrarSenha"
              >
                <mat-icon>{{ mostrarSenha ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              class="full-width"
              type="submit"
              [disabled]="formulario.invalid || carregando"
            >
              <mat-spinner diameter="20" *ngIf="carregando"></mat-spinner>
              <span *ngIf="!carregando">Entrar</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .login-wrapper {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3f51b5 0%, #7986cb 100%);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }
    .login-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 16px;
    }
    .login-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
      margin-bottom: 8px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  mostrarSenha = false;
  carregando = false;

  entrar(): void {
    if (this.formulario.invalid || this.carregando) {
      return;
    }
    this.carregando = true;
    const { email, senha } = this.formulario.getRawValue();
    this.auth.login(email, senha).subscribe({
      next: () => {
        this.auth.carregarUsuario().subscribe({
          next: () => {
            this.carregando = false;
            this.cdr.markForCheck();
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.carregando = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }
}
