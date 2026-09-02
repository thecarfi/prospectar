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
import { AuthService } from '../core/services/auth.service';
import { ClientesService } from '../core/services/clientes.service';
import { Cliente, Interacao } from '../core/models';

export interface InteracaoDialogData {
  interacao?: Interacao | null;
  selecionarCliente?: boolean;
  clientePreselecionado?: Cliente;
  clientePreselecionadoNome?: string;
  programacao_id?: number;
}

interface OpcaoNovoCliente {
  id: null;
  nome: string;
}

type OpcaoCliente = Cliente | OpcaoNovoCliente;

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
          <mat-hint *ngIf="dicaCliente">{{ dicaCliente }}</mat-hint>
          <mat-autocomplete
            #auto="matAutocomplete"
            [displayWith]="exibirCliente"
            (optionSelected)="aoSelecionarOpcao($event.option.value)"
          >
            <mat-option *ngIf="mostrarCriarNovo" [value]="opcaoNovoCliente">
              Cadastrar novo cliente: "{{ textoCliente }}"
            </mat-option>
            <mat-option *ngFor="let cliente of clientesOpcoes" [value]="cliente">
              {{ cliente.nome }}
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="!selecionarCliente && clientePreselecionadoNome">
          <mat-label>Cliente</mat-label>
          <input matInput [value]="clientePreselecionadoNome" readonly />
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
          <input matInput formControlName="ocorreu_em" type="date" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="formulario.invalid || !podeSalvar"
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
  private readonly auth = inject(AuthService);
  private readonly clientesService = inject(ClientesService);

  readonly data = inject<InteracaoDialogData>(MAT_DIALOG_DATA);

  readonly interacao: Interacao | null = this.data?.interacao ?? null;
  readonly selecionarCliente: boolean =
    !!this.data?.selecionarCliente && !this.interacao;
  readonly podeCriarCliente = this.auth.temPermissao('clientes:criar');

  readonly clientePreselecionado: Cliente | null =
    this.data?.clientePreselecionado ?? null;
  readonly clientePreselecionadoNome: string =
    this.data?.clientePreselecionadoNome ?? '';
  readonly programacao_id: number | undefined = this.data?.programacao_id;

  readonly clienteControl = new FormControl<string | OpcaoCliente>('', {
    nonNullable: true,
    validators: Validators.required,
  });
  clientesOpcoes: Cliente[] = [];
  clienteSelecionado: Cliente | null = null;
  nomeNovoCliente: string | null = null;

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
          ? this.interacao.ocorreu_em.substring(0, 10)
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
          this.nomeNovoCliente = null;
          this.carregarOpcoes(valor);
        }
      });
    this.carregarOpcoes('');
  }

  get textoCliente(): string {
    const valor = this.clienteControl.value;
    return typeof valor === 'string' ? valor.trim() : '';
  }

  get mostrarCriarNovo(): boolean {
    if (!this.selecionarCliente || !this.podeCriarCliente) {
      return false;
    }
    const texto = this.textoCliente;
    if (texto.length < 2) {
      return false;
    }
    if ((this.nomeNovoCliente ?? '').toLowerCase() === texto.toLowerCase()) {
      return false;
    }
    return !this.temCorrespondenciaExata(texto);
  }

  get opcaoNovoCliente(): OpcaoNovoCliente {
    return { id: null, nome: this.textoCliente };
  }

  get podeSalvar(): boolean {
    if (this.clientePreselecionado) {
      return true;
    }
    if (!this.selecionarCliente) {
      return true;
    }
    return (
      !!this.clienteSelecionado ||
      (!!this.nomeNovoCliente && this.nomeNovoCliente.trim().length >= 2)
    );
  }

  get dicaCliente(): string | null {
    if (!this.selecionarCliente) {
      return null;
    }
    if (this.nomeNovoCliente) {
      return `Novo cliente "${this.nomeNovoCliente}" será criado ao salvar.`;
    }
    const texto = this.textoCliente;
    if (texto.length >= 2 && !this.temCorrespondenciaExata(texto)) {
      return this.podeCriarCliente
        ? 'Selecione "Cadastrar novo cliente" na lista para criar.'
        : 'Nenhum cliente encontrado para este nome.';
    }
    return null;
  }

  aoSelecionarOpcao(valor: OpcaoCliente | null): void {
    if (valor !== null && valor.id === null) {
      const nome = valor.nome.trim();
      if (nome.length < 2) {
        return;
      }
      this.nomeNovoCliente = nome;
      this.clienteSelecionado = null;
      this.clienteControl.setValue(nome, { emitEvent: false });
      return;
    }
    this.clienteSelecionado = valor as Cliente;
    this.nomeNovoCliente = null;
    this.clienteControl.setValue(valor as Cliente, { emitEvent: false });
  }

  exibirCliente(valor: OpcaoCliente | string | null): string {
    if (valor && typeof valor === 'object') {
      return valor.nome ?? '';
    }
    return typeof valor === 'string' ? valor : '';
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    if (!this.podeSalvar) return;
    const valor = this.formulario.getRawValue();
    const dados: Record<string, unknown> = {
      tipo: valor.tipo,
      assunto: valor.assunto,
      descricao: valor.descricao || null,
      ocorreu_em: valor.ocorreu_em
        ? new Date(valor.ocorreu_em + 'T00:00:00').toISOString()
        : undefined,
    };

    if (this.programacao_id) {
      dados['programacao_id'] = this.programacao_id;
    }

    if (this.clientePreselecionado) {
      dados['cliente_id'] = this.clientePreselecionado.id;
      this.dialogRef.close(dados);
      return;
    }

    if (this.clienteSelecionado) {
      this.dialogRef.close({ ...dados, cliente_id: this.clienteSelecionado.id });
      return;
    }

    const nome = (this.nomeNovoCliente ?? '').trim();
    this.clientesService.listar({ busca: nome, limite: 50 }).subscribe({
      next: (res) => {
        const existente = res.dados.find(
          (c) => c.nome.trim().toLowerCase() === nome.toLowerCase()
        );
        this.dialogRef.close(
          existente
            ? { ...dados, cliente_id: existente.id }
            : { ...dados, cliente_nome: nome }
        );
      },
      error: () => {
        this.dialogRef.close({ ...dados, cliente_nome: nome });
      },
    });
  }

  private temCorrespondenciaExata(nome: string): boolean {
    const n = nome.trim().toLowerCase();
    return this.clientesOpcoes.some(
      (c) => c.nome.trim().toLowerCase() === n
    );
  }

  private carregarOpcoes(termo: string): void {
    this.clientesService.listar({ busca: termo || undefined, limite: 10 }).subscribe({
      next: (res) => (this.clientesOpcoes = res.dados),
    });
  }

  private paraInputLocal(iso: string): string {
    return iso.substring(0, 10);
  }
}
