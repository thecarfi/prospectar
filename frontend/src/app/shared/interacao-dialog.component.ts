import { Component, Inject, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ClientesService } from '../core/services/clientes.service';
import { Cliente, Interacao } from '../core/models';

export interface InteracaoDialogData {
  interacao?: Interacao | null;
  selecionarCliente?: boolean;
}

@Component({
  selector: 'app-interacao-dialog',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ interacao ? 'Editar interação' : 'Nova interação' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
        <mat-form-field appearance="outline" *ngIf="selecionarCliente">
          <mat-label>Cliente *</mat-label>
          <input
            matInput
            [formControl]="clienteControl"
            [matAutocomplete]="auto"
            placeholder="Digite o nome do cliente"
          />
          <mat-autocomplete
            #auto="matAutocomplete"
            [displayWith]="exibirCliente"
            (optionSelected)="aoSelecionarCliente($event.option.value)"
          >
            <mat-option *ngFor="let cliente of clientesOpcoes" [value]="cliente">
              {{ cliente.nome }}
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="tipo">
            <mat-option value="ligacao">Ligação</mat-option>
            <mat-option value="visita">Visita</mat-option>
            <mat-option value="anotacao">Anotação</mat-option>
            <mat-option value="mensagem">Mensagem</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Assunto *</mat-label>
          <input matInput formControlName="assunto" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <textarea matInput formControlName="descricao" rows="4"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Data da interação</mat-label>
          <input matInput formControlName="ocorreu_em" type="datetime-local" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="formulario.invalid || (selecionarCliente && !clienteSelecionado)"
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
    }
  `,
})
export class InteracaoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InteracaoDialogComponent>);
  private readonly clientesService = inject(ClientesService);

  readonly data = inject<InteracaoDialogData>(MAT_DIALOG_DATA);

  readonly interacao: Interacao | null = this.data?.interacao ?? null;
  readonly selecionarCliente: boolean =
    !!this.data?.selecionarCliente && !this.interacao;

  readonly clienteControl = new FormControl<string | Cliente>('', {
    nonNullable: true,
    validators: Validators.required,
  });
  clientesOpcoes: Cliente[] = [];
  clienteSelecionado: Cliente | null = null;

  readonly formulario = this.fb.nonNullable.group({
    tipo: ['anotacao' as string],
    assunto: ['', Validators.required],
    descricao: [''],
    ocorreu_em: [''],
  });

  constructor() {
    if (this.interacao) {
      this.formulario.patchValue({
        tipo: this.interacao.tipo,
        assunto: this.interacao.assunto,
        descricao: this.interacao.descricao || '',
        ocorreu_em: this.interacao.ocorreu_em
          ? this.paraInputLocal(this.interacao.ocorreu_em)
          : '',
      });
      if (this.interacao.cliente_id) {
        this.clienteSelecionado = {
          id: this.interacao.cliente_id,
          nome: this.interacao.cliente_nome || '',
        };
      }
    }
  }

  ngOnInit(): void {
    if (!this.selecionarCliente) {
      return;
    }
    this.clienteControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((valor) => {
        if (typeof valor === 'string') {
          this.clienteSelecionado = null;
          this.carregarOpcoes(valor);
        }
      });
    this.carregarOpcoes('');
  }

  aoSelecionarCliente(cliente: Cliente): void {
    this.clienteSelecionado = cliente;
    this.clienteControl.setValue(cliente, { emitEvent: false });
  }

  exibirCliente(valor: Cliente | string | null): string {
    return typeof valor === 'string' ? valor : (valor?.nome ?? '');
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    if (this.selecionarCliente && !this.clienteSelecionado) return;
    const valor = this.formulario.getRawValue();
    this.dialogRef.close({
      ...(this.selecionarCliente && this.clienteSelecionado
        ? { cliente_id: this.clienteSelecionado.id }
        : {}),
      tipo: valor.tipo,
      assunto: valor.assunto,
      descricao: valor.descricao || null,
      ocorreu_em: valor.ocorreu_em
        ? new Date(valor.ocorreu_em).toISOString()
        : undefined,
    });
  }

  private carregarOpcoes(termo: string): void {
    this.clientesService.listar({ busca: termo || undefined, limite: 10 }).subscribe({
      next: (res) => (this.clientesOpcoes = res.dados),
    });
  }

  private paraInputLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
