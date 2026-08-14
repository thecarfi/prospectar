import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { Contato } from '../core/models';

@Component({
  selector: 'app-seletor-contatos',
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="contatos-section">
      <div class="section-title">Contatos</div>

      <form [formGroup]="formulario" class="contatos-add-row" (ngSubmit)="adicionar()">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="nome" placeholder="Nome do contato" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Telefone</mat-label>
          <input matInput formControlName="telefone" placeholder="Ex.: 11-999999999" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>E-mail</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Cargo</mat-label>
          <input matInput formControlName="cargo" />
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" [disabled]="adicionandoInvalido()">
          <mat-icon>add</mat-icon>
          Adicionar
        </button>
      </form>

      <table
        mat-table
        [dataSource]="selecionados()"
        class="mat-elevation-z0 contatos-table"
        *ngIf="selecionados().length > 0"
      >
        <ng-container matColumnDef="nome">
          <th mat-header-cell *matHeaderCellDef>Nome</th>
          <td mat-cell *matCellDef="let contato">{{ contato.nome }}</td>
        </ng-container>
        <ng-container matColumnDef="telefone">
          <th mat-header-cell *matHeaderCellDef>Telefone</th>
          <td mat-cell *matCellDef="let contato">{{ contato.telefone || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>E-mail</th>
          <td mat-cell *matCellDef="let contato">{{ contato.email || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="cargo">
          <th mat-header-cell *matHeaderCellDef>Cargo</th>
          <td mat-cell *matCellDef="let contato">{{ contato.cargo || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="acoes">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let contato" class="acoes-cell">
            <button
              mat-icon-button
              color="warn"
              matTooltip="Remover contato"
              (click)="remover(contato)"
            >
              <mat-icon>close</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="colunas"></tr>
        <tr mat-row *matRowDef="let row; columns: colunas"></tr>
      </table>
      <p *ngIf="selecionados().length === 0" class="contatos-empty">
        Nenhum contato vinculado.
      </p>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .contatos-section {
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      padding-top: 8px;
      margin-top: 8px;
    }
    .section-title {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin: 8px 0 4px;
    }
    .full {
      width: 100%;
    }
    .contatos-add-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0 16px;
      align-items: baseline;
      margin-top: 4px;
    }
    .contatos-table {
      width: 100%;
      margin-top: 8px;
    }
    .acoes-cell {
      width: 48px;
      text-align: right;
    }
    .contatos-empty {
      color: rgba(0, 0, 0, 0.6);
      font-size: 13px;
      margin: 8px 0 0;
    }
  `,
})
export class SeletorContatosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() control!: FormControl<Contato[] | null>;

  readonly colunas = ['nome', 'telefone', 'email', 'cargo', 'acoes'];

  readonly formulario = this.fb.nonNullable.group({
    nome: [''],
    telefone: [''],
    email: [''],
    cargo: [''],
  });

  readonly selecionados = signal<Contato[]>([]);

  ngOnInit(): void {
    this.selecionados.set(this.control.value ?? []);
    this.control.valueChanges.subscribe((valor) =>
      this.selecionados.set(valor ?? [])
    );
  }

  adicionandoInvalido(): boolean {
    const valor = this.formulario.getRawValue();
    return !(
      valor.nome.trim() ||
      valor.telefone.trim() ||
      valor.email.trim() ||
      valor.cargo.trim()
    );
  }

  adicionar(): void {
    if (this.adicionandoInvalido()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valor = this.formulario.getRawValue();
    const novo: Contato = {
      nome: valor.nome.trim() || (valor.telefone.trim() ? 'Telefone' : 'E-mail'),
      telefone: valor.telefone.trim() || undefined,
      email: valor.email.trim() || undefined,
      cargo: valor.cargo.trim() || undefined,
    };
    this.control.setValue([...(this.control.value ?? []), novo]);
    this.formulario.reset();
  }

  remover(contato: Contato): void {
    const atual = this.control.value ?? [];
    this.control.setValue(atual.filter((c) => c !== contato));
  }
}
