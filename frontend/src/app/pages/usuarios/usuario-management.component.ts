import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UsuariosService } from '../../core/services/usuarios.service';
import { PapeisService } from '../../core/services/papeis.service';
import { AuthService } from '../../core/services/auth.service';
import { Papel, Usuario } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import {
  UsuarioFormDialogComponent,
  UsuarioFormResult,
} from './usuario-form-dialog.component';

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
    MatDialogModule,
    MatProgressBarModule,
    PermissaoDirective,
  ],
  template: `
    <div class="header">
      <h1>Usuários</h1>
      <button
        mat-flat-button
        color="primary"
        appPermissao="usuarios:gerenciar"
        (click)="abrirNovo()"
      >
        <mat-icon>add</mat-icon>
        Novo usuário
      </button>
    </div>

    <mat-card class="filter-card">
      <mat-card-content>
        <form [formGroup]="filtros" (ngSubmit)="buscar()" class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput formControlName="nome" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>E-mail</mat-label>
            <input matInput formControlName="email" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Papel</mat-label>
            <mat-select formControlName="papel">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let p of papeis" [value]="p.nome">
                {{ rotuloPapel(p.nome) }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="ativo">
              <mat-option value="">Todos</mat-option>
              <mat-option value="true">Ativo</mat-option>
              <mat-option value="false">Inativo</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="filter-actions">
            <button mat-flat-button color="primary" type="submit">
              Filtrar
            </button>
            <button mat-button type="button" (click)="limpar()">Limpar</button>
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
          Nenhum usuário encontrado.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
    }
    .filter-card {
      margin-bottom: 16px;
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: baseline;
    }
    .filters mat-form-field {
      flex: 1;
      min-width: 180px;
    }
    .filter-actions {
      display: flex;
      gap: 8px;
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

  readonly filtros = this.fb.nonNullable.group({
    nome: [''],
    email: [''],
    papel: [''],
    ativo: [''],
  });

  usuarios: Usuario[] = [];
  papeis: Papel[] = [];
  carregando = false;
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

  buscar(): void {
    this.carregar();
  }

  limpar(): void {
    this.filtros.reset();
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    const { nome, email, papel, ativo } = this.filtros.getRawValue();
    this.usuariosService
      .listar({
        nome: nome || undefined,
        email: email || undefined,
        papel: papel || undefined,
        ativo: ativo === '' ? undefined : ativo === 'true',
      })
      .subscribe({
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

  abrirNovo(): void {
    const ref = this.dialog.open(UsuarioFormDialogComponent, {
      width: '480px',
      data: {},
    });

    ref.afterClosed().subscribe((valor: UsuarioFormResult | undefined) => {
      if (!valor) {
        return;
      }
      if (!valor.senha) {
        return;
      }
      this.usuariosService.criar({ ...valor, senha: valor.senha }).subscribe({
        next: () => {
          this.snackBar.open('Usuário criado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  editar(usuario: Usuario): void {
    const ref = this.dialog.open(UsuarioFormDialogComponent, {
      width: '480px',
      data: { usuario },
    });

    ref.afterClosed().subscribe((valor: UsuarioFormResult | undefined) => {
      if (!valor) {
        return;
      }
      this.usuariosService.atualizar(usuario.id, valor).subscribe({
        next: () => {
          this.snackBar.open('Usuário atualizado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
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
