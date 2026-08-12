import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PapeisService } from '../../core/services/papeis.service';
import { Papel, Permissao } from '../../core/models';

export interface PapelFormDialogData {
  papel?: Papel;
}

interface GrupoPermissoes {
  modulo: string;
  itens: Permissao[];
}

@Component({
  selector: 'app-papel-form-dialog',
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
    MatCheckboxModule,
    MatProgressBarModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.papel ? 'Editar papel' : 'Novo papel' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="form-column">
        <mat-form-field appearance="outline">
          <mat-label>Nome *</mat-label>
          <input matInput formControlName="nome" />
          <mat-hint>Letras minúsculas, números e _ (3 a 30 caracteres)</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <textarea matInput formControlName="descricao" rows="2"></textarea>
        </mat-form-field>
      </form>

      <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>

      <div class="permissoes" *ngIf="!carregando">
        <p class="permissoes-titulo">Permissões do papel</p>
        <div class="grupo" *ngFor="let grupo of grupos">
          <p class="grupo-titulo">{{ grupo.modulo }}</p>
          <div class="grupo-itens">
            <mat-checkbox
              *ngFor="let p of grupo.itens"
              [checked]="selecionadas.has(p.id)"
              (change)="alternar(p.id, $event.checked)"
            >
              {{ p.acao }}
            </mat-checkbox>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="formulario.invalid || carregando"
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
    .permissoes {
      margin-top: 12px;
      max-height: 320px;
      overflow-y: auto;
      border-top: 1px solid #e0e0e0;
      padding-top: 8px;
    }
    .permissoes-titulo {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 8px;
    }
    .grupo {
      margin-bottom: 8px;
    }
    .grupo-titulo {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #3f51b5;
      margin: 8px 0 4px;
    }
    .grupo-itens {
      display: flex;
      flex-wrap: wrap;
      gap: 0 16px;
    }
  `,
})
export class PapelFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PapelFormDialogComponent>);
  private readonly papeisService = inject(PapeisService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly data = inject<PapelFormDialogData>(MAT_DIALOG_DATA);

  readonly formulario = this.fb.nonNullable.group({
    nome: [this.data.papel?.nome || '', Validators.required],
    descricao: [this.data.papel?.descricao || ''],
  });

  grupos: GrupoPermissoes[] = [];
  selecionadas = new Set<number>();
  carregando = true;

  ngOnInit(): void {
    if (this.data.papel) {
      this.formulario.controls.nome.disable();
    }
    this.papeisService.listarPermissoes().subscribe({
      next: (permissoes) => {
        if (this.data.papel) {
          for (const p of this.data.papel.permissoes) {
            const id = permissoes.find((perm) => perm.permissao === p)?.id;
            if (id) {
              this.selecionadas.add(id);
            }
          }
        }
        this.grupos = this.agrupar(permissoes);
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  alternar(permissaoId: number, marcado: boolean): void {
    if (marcado) {
      this.selecionadas.add(permissaoId);
    } else {
      this.selecionadas.delete(permissaoId);
    }
  }

  salvar(): void {
    if (this.formulario.invalid || this.carregando) {
      return;
    }
    const { nome, descricao } = this.formulario.getRawValue();
    this.dialogRef.close({
      nome,
      descricao: descricao || undefined,
      permissao_ids: [...this.selecionadas],
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }

  private agrupar(permissoes: Permissao[]): GrupoPermissoes[] {
    const grupos: GrupoPermissoes[] = [];
    for (const p of permissoes) {
      const grupo = grupos.find((g) => g.modulo === p.modulo);
      if (grupo) {
        grupo.itens.push(p);
      } else {
        grupos.push({ modulo: p.modulo, itens: [p] });
      }
    }
    return grupos;
  }
}
