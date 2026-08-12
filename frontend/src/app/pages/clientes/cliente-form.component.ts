import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgFor } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientesService } from '../../core/services/clientes.service';
import { StatusClientesService } from '../../core/services/status-clientes.service';
import { Cliente, Segmento, StatusCliente } from '../../core/models';
import { SeletorMunicipioComponent } from '../../shared/seletor-municipio.component';
import { SeletorSegmentosComponent } from '../../shared/seletor-segmentos.component';

export function validarDocumento(
  control: AbstractControl
): ValidationErrors | null {
  const valor = (control.value ?? '').toString();
  if (!valor.trim()) {
    return null;
  }
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 11 || digitos.length === 14
    ? null
    : { documentoInvalido: true };
}

@Component({
  selector: 'app-cliente-form',
  imports: [
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SeletorMunicipioComponent,
    SeletorSegmentosComponent,
  ],
  template: `
    <div class="header">
      <h1>{{ editando ? 'Editar cliente' : 'Novo cliente' }}</h1>
    </div>

    <mat-card>
      <mat-card-content>
        <form [formGroup]="formulario" (ngSubmit)="salvar()" class="form-grid">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nome *</mat-label>
            <input matInput formControlName="nome" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>CPF/CNPJ</mat-label>
            <input
              matInput
              formControlName="cpf_cnpj"
              placeholder="CPF ou CNPJ"
              [maxlength]="limiteDocumento"
              (input)="onDocumentoInput()"
              (blur)="formatarDocumento()"
            />
            @if (formulario.controls.cpf_cnpj.hasError('documentoInvalido')) {
              <mat-error>Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status *</mat-label>
            <mat-select formControlName="status_id">
              <mat-option *ngFor="let status of statuses" [value]="status.id">
                {{ status.nome }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <app-seletor-segmentos
            class="full"
            [control]="formulario.controls.segmentos"
          ></app-seletor-segmentos>

          <app-seletor-municipio
            [estadoControl]="formulario.controls.estado"
            [municipioControl]="formulario.controls.municipio_id"
          ></app-seletor-municipio>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Observações</mat-label>
            <textarea
              matInput
              formControlName="observacoes"
              rows="4"
            ></textarea>
          </mat-form-field>

          <div class="actions full">
            <button mat-flat-button color="primary" type="submit" [disabled]="salvando">
              {{ salvando ? 'Salvando...' : 'Salvar' }}
            </button>
            <button mat-button type="button" routerLink="/clientes">Cancelar</button>
          </div>
        </form>
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
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0 16px;
    }
    .full {
      grid-column: 1 / -1;
    }
    .actions {
      display: flex;
      gap: 8px;
      padding-bottom: 16px;
    }
  `,
})
export class ClienteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientesService = inject(ClientesService);
  private readonly statusClientesService = inject(StatusClientesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    cpf_cnpj: ['', validarDocumento],
    status_id: [null as number | null, Validators.required],
    segmentos: this.fb.control<Segmento[]>([]),
    estado: [''],
    municipio_id: [null as number | null],
    observacoes: [''],
  });

  statuses: StatusCliente[] = [];
  editando = false;
  salvando = false;
  private clienteId: number | null = null;

  ngOnInit(): void {
    this.statusClientesService.listar().subscribe({
      next: (lista) => {
        this.statuses = lista;
        if (!this.editando && this.formulario.controls.status_id.value == null && lista.length) {
          this.formulario.controls.status_id.setValue(lista[0].id);
        }
        this.cdr.markForCheck();
      },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editando = true;
      this.clienteId = Number(id);
      this.clientesService.detalhar(this.clienteId).subscribe((cliente) => {
        this.formulario.patchValue({
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj || '',
          status_id: cliente.status_id ?? null,
          segmentos: cliente.segmentos || [],
          estado: cliente.municipio_uf || '',
          municipio_id: cliente.municipio_id || null,
          observacoes: cliente.observacoes || '',
        });
        this.cdr.markForCheck();
      });
    }
  }

  get limiteDocumento(): number {
    const valor = (this.formulario.controls.cpf_cnpj.value ?? '').toString();
    return valor.includes('/') ? 18 : 14;
  }

  onDocumentoInput(): void {
    this.cdr.markForCheck();
  }

  formatarDocumento(): void {
    const controle = this.formulario.controls.cpf_cnpj;
    const valor = (controle.value ?? '').toString();
    const digitos = valor.replace(/\D/g, '');
    if (digitos.length === 11) {
      controle.setValue(this.formatarCpf(digitos));
    } else if (digitos.length === 14) {
      controle.setValue(this.formatarCnpj(digitos));
    }
  }

  private formatarCpf(digitos: string): string {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
  }

  private formatarCnpj(digitos: string): string {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12, 14)}`;
  }

  salvar(): void {
    this.formatarDocumento();
    if (this.formulario.invalid || this.salvando) {
      if (this.formulario.invalid) {
        this.formulario.markAllAsTouched();
        this.cdr.markForCheck();
        this.snackBar.open(
          'Verifique o campo CPF/CNPJ.',
          'Fechar',
          { duration: 4000 }
        );
      }
      return;
    }
    this.salvando = true;
    const valor = this.formulario.getRawValue();
    const payload = {
      ...valor,
      cpf_cnpj: valor.cpf_cnpj || null,
      segmento_ids: (valor.segmentos ?? []).map((s) => s.id),
      municipio_id: valor.municipio_id,
      observacoes: valor.observacoes || null,
    };

    const operacao = this.editando && this.clienteId
      ? this.clientesService.atualizar(
          this.clienteId,
          payload as Partial<Cliente>
        )
      : this.clientesService.criar(payload as Partial<Cliente>);

    operacao.subscribe({
      next: (cliente) => {
        this.salvando = false;
        this.cdr.markForCheck();
        this.snackBar.open(
          this.editando ? 'Cliente atualizado.' : 'Cliente criado.',
          'Fechar',
          { duration: 3000 }
        );
        this.router.navigate(['/clientes', cliente.id]);
      },
      error: () => {
        this.salvando = false;
        this.cdr.markForCheck();
      },
    });
  }
}
