import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UsuariosService } from '../../core/services/usuarios.service';
import { PapeisService } from '../../core/services/papeis.service';
import { AuthService } from '../../core/services/auth.service';
import { Papel, Usuario } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-usuario-management',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="header">
      <h1>Usuários</h1>
    </div>

    <mat-card class="form-card" *ngIf="podeGerenciar()">
      <mat-card-title class="form-title">
        {{ editandoId ? 'Editar usuário' : 'Novo usuário' }}
      </mat-card-title>
      <mat-card-content>
        <form [formGroup]="formulario" (ngSubmit)="salvar()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nome *</mat-label>
            <input matInput formControlName="nome" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>E-mail *</mat-label>
            <input matInput formControlName="email" type="email" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ editandoId ? 'Nova senha (opcional)' : 'Senha *' }}</mat-label>
            <input matInput formControlName="senha" type="password" />
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
          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="formulario.invalid || salvando"
            >
              {{ salvando ? 'Salvando...' : 'Salvar' }}
            </button>
            <button mat-button type="button" *ngIf="editandoId" (click)="cancelarEdicao()">
              Cancelar edição
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content>
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="usuarios" class="mat-elevation-z0">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let usuario">{{ usuario.nome }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let usuario">{{ usuario.email }}</td>
          </ng-container>
          <ng-container matColumnDef="papel">
            <th mat-header-cell *matHeaderCellDef>Papel</th>
            <td mat-cell *matCellDef="let usuario">
              <span class="papel-pill" [class]="usuario.papel">
                {{ rotuloPapel(usuario.papel) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="ativo">
            <th mat-header-cell *matHeaderCellDef>Ativo</th>
            <td mat-cell *matCellDef="let usuario">
              {{ usuario.ativo ? 'Sim' : 'Não' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let usuario" class="acoes-cell">
              <span *ngIf="podeGerenciar()">
                <button mat-icon-button (click)="editar(usuario)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="excluir(usuario)">
                  <mat-icon>delete</mat-icon>
                </button>
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && usuarios.length === 0" class="empty">
          Nenhum usuário cadastrado.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .header {
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
    }
    .form-card {
      margin-bottom: 16px;
    }
    .form-title {
      padding: 16px 16px 0;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 16px;
      align-items: start;
    }
    .actions {
      display: flex;
      gap: 8px;
      padding-bottom: 16px;
      align-items: center;
    }
    .acoes-cell {
      text-align: right;
      white-space: nowrap;
    }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
    .papel-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .papel-pill.admin { background: #e3f2fd; color: #1565c0; }
    .papel-pill.operador { background: #e8f5e9; color: #2e7d32; }
    .papel-pill.visualizador { background: #f5f5f5; color: #616161; }
  `,
})
export class UsuarioManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly papeisService = inject(PapeisService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
    papel: ['visualizador' as string],
    ativo: [true],
  });

  usuarios: Usuario[] = [];
  papeis: Papel[] = [];
  carregando = false;
  salvando = false;
  editandoId: number | null = null;
  readonly colunas = ['nome', 'email', 'papel', 'ativo', 'acoes'];

  ngOnInit(): void {
    this.carregar();
    this.carregarPapeis();
  }

  podeGerenciar(): boolean {
    return this.auth.temPermissao('usuarios:gerenciar');
  }

  carregarPapeis(): void {
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

  carregar(): void {
    this.carregando = true;
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  salvar(): void {
    if (this.formulario.invalid || this.salvando) return;
    this.salvando = true;
    const valor = this.formulario.getRawValue();

    if (this.editandoId) {
      const { senha, ...dados } = valor;
      this.usuariosService
        .atualizar(this.editandoId, {
          ...dados,
          papel: dados.papel as Usuario['papel'],
          senha: senha || undefined,
        })
        .subscribe({
          next: () => {
            this.salvando = false;
            this.cdr.markForCheck();
            this.snackBar.open('Usuário atualizado.', 'Fechar', { duration: 3000 });
            this.cancelarEdicao();
            this.carregar();
          },
          error: () => {
            this.salvando = false;
            this.cdr.markForCheck();
          },
        });
    } else {
      this.usuariosService
        .criar({ ...valor, papel: valor.papel as Usuario['papel'] })
        .subscribe({
        next: () => {
          this.salvando = false;
          this.cdr.markForCheck();
          this.snackBar.open('Usuário criado.', 'Fechar', { duration: 3000 });
          this.formulario.reset({ papel: 'visualizador', ativo: true });
          this.carregar();
        },
        error: () => {
          this.salvando = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  editar(usuario: Usuario): void {
    this.editandoId = usuario.id;
    this.formulario.patchValue({
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      ativo: usuario.ativo,
    });
    this.formulario.controls.senha.clearValidators();
    this.formulario.controls.senha.reset();
  }

  cancelarEdicao(): void {
    this.editandoId = null;
    this.formulario.reset({ papel: 'visualizador', ativo: true });
    this.formulario.controls.senha.setValidators(Validators.required);
  }

  excluir(usuario: Usuario): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Excluir usuário',
        mensagem: `Deseja realmente excluir o usuário "${usuario.nome}"?`,
        textoConfirmar: 'Excluir',
      },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.usuariosService.excluir(usuario.id).subscribe({
        next: () => {
          this.snackBar.open('Usuário excluído.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  rotuloPapel(papel: string): string {
    const mapa: Record<string, string> = {
      admin: 'Admin',
      operador: 'Operador',
      visualizador: 'Visualizador',
    };
    return mapa[papel] || papel;
  }
}
