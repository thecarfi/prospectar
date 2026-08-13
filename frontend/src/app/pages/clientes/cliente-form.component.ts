import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgFor } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
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
import { ConsultaCnpjService, ConsultaCnpj } from '../../core/services/consulta-cnpj.service';
import { LocalizacaoService } from '../../core/services/localizacao.service';
import { Cliente, Municipio, Segmento, StatusCliente } from '../../core/models';
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

export function validarEndereco(
  grupo: AbstractControl
): ValidationErrors | null {
  const endereco = grupo as FormGroup;
  const logradouro = (endereco.get('logradouro')?.value ?? '').toString().trim();
  const municipioId = endereco.get('municipio_id')?.value;
  const temLogradouro = !!logradouro;
  const temMunicipio = municipioId != null && municipioId !== '';
  if (!temLogradouro && !temMunicipio) {
    return null;
  }
  const erros: { logradouroObrigatorio?: boolean; municipioObrigatorio?: boolean } = {};
  if (!temLogradouro) {
    erros.logradouroObrigatorio = true;
  }
  if (!temMunicipio) {
    erros.municipioObrigatorio = true;
  }
  return erros;
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

          <div class="campo-documento full">
            <mat-form-field appearance="outline" class="campo-documento-input">
              <mat-label>CPF/CNPJ</mat-label>
              <input
                matInput
                formControlName="cpf_cnpj"
                placeholder="CPF ou CNPJ"
                [maxlength]="18"
                (blur)="formatarDocumento()"
              />
              @if (formulario.controls.cpf_cnpj.hasError('documentoInvalido')) {
                <mat-error>Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).</mat-error>
              }
            </mat-form-field>
            <button
              mat-raised-button
              color="primary"
              type="button"
              (click)="consultarOnline()"
              [disabled]="!isCnpjValido() || consultando"
            >
              {{ consultando ? 'Consultando...' : 'Consultar online' }}
            </button>
          </div>

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

          <div [formGroup]="formulario.controls.endereco" class="full endereco-section">
            <div class="section-title">Endereço</div>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Logradouro</mat-label>
              <input matInput formControlName="logradouro" placeholder="Ex.: Rua das Flores" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Número</mat-label>
              <input matInput formControlName="numero" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>CEP</mat-label>
              <input matInput formControlName="cep" placeholder="00000-000" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Complemento</mat-label>
              <input matInput formControlName="complemento" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Bairro</mat-label>
              <input matInput formControlName="bairro" />
            </mat-form-field>
            <app-seletor-municipio
              [estadoControl]="formulario.controls.endereco.controls.estado"
              [municipioControl]="formulario.controls.endereco.controls.municipio_id"
            ></app-seletor-municipio>
            @if (formulario.controls.endereco.invalid && formulario.controls.endereco.touched) {
              <div class="endereco-error">Informe o logradouro e o município do endereço.</div>
            }
          </div>

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
    .section-title {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin: 8px 0 4px;
    }
    .endereco-section {
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      padding-top: 8px;
      margin-top: 8px;
    }
    .campo-documento {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .campo-documento-input {
      flex: 1;
    }
    .endereco-error {
      grid-column: 1 / -1;
      color: #f44336;
      font-size: 12px;
      padding-bottom: 8px;
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
  private readonly consultaCnpjService = inject(ConsultaCnpjService);
  private readonly localizacao = inject(LocalizacaoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    cpf_cnpj: ['', validarDocumento],
    status_id: [null as number | null, Validators.required],
    segmentos: this.fb.control<Segmento[]>([]),
    observacoes: [''],
    endereco: this.fb.nonNullable.group(
      {
        logradouro: [''],
        numero: [''],
        complemento: [''],
        bairro: [''],
        estado: [''],
        municipio_id: [null as number | null],
        cep: [''],
      },
      { validators: validarEndereco }
    ),
  });

  statuses: StatusCliente[] = [];
  editando = false;
  salvando = false;
  consultando = false;
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
        const principal = cliente.endereco_principal;
        this.formulario.patchValue({
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj || '',
          status_id: cliente.status_id ?? null,
          segmentos: cliente.segmentos || [],
          observacoes: cliente.observacoes || '',
          endereco: {
            logradouro: principal?.logradouro || '',
            numero: principal?.numero || '',
            complemento: principal?.complemento || '',
            bairro: principal?.bairro || '',
            estado: principal?.municipio_uf || '',
            municipio_id: principal?.municipio_id || null,
            cep: principal?.cep || '',
          },
        });
        this.cdr.markForCheck();
      });
    }
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

  isCnpjValido(): boolean {
    const valor = (this.formulario.controls.cpf_cnpj.value ?? '').toString();
    return valor.replace(/\D/g, '').length === 14;
  }

  consultarOnline(): void {
    if (this.consultando || !this.isCnpjValido()) {
      return;
    }
    const numero = (this.formulario.controls.cpf_cnpj.value ?? '')
      .toString()
      .replace(/\D/g, '');
    this.localizacao.carregar();
    this.consultando = true;
    this.cdr.markForCheck();

    this.consultaCnpjService.consultar(numero).subscribe({
      next: (resposta) => {
        if (resposta.status === 400) {
          this.snackBar.open(resposta.titulo || 'Requisição inválida', 'Fechar', {
            duration: 4000,
          });
          return;
        }
        this.aplicarDadosConsulta(resposta);
      },
      error: (erro) => {
        this.snackBar.open(
          erro.error?.titulo || erro.error?.message || 'Erro ao consultar CNPJ.',
          'Fechar',
          { duration: 4000 }
        );
      },
      complete: () => {
        this.consultando = false;
        this.cdr.markForCheck();
      },
    });
  }

  private aplicarDadosConsulta(resposta: ConsultaCnpj): void {
    const estabelecimento = resposta.estabelecimento || {};
    const endereco = this.formulario.controls.endereco;

    endereco.controls.logradouro.setValue(
      [estabelecimento.tipo_logradouro, estabelecimento.logradouro]
        .filter((v): v is string => !!v && v.trim() !== '')
        .join(' ')
    );
    endereco.controls.numero.setValue(estabelecimento.numero || '');
    endereco.controls.complemento.setValue(estabelecimento.complemento || '');
    endereco.controls.bairro.setValue(estabelecimento.bairro || '');
    endereco.controls.cep.setValue(this.formatarCep(estabelecimento.cep || ''));

    const sigla = estabelecimento.estado?.sigla || '';
    endereco.controls.estado.setValue(sigla);

    const nomeCidade = estabelecimento.cidade?.nome || '';
    const municipio = this.buscarMunicipio(sigla, nomeCidade);
    if (municipio) {
      endereco.controls.municipio_id.setValue(municipio.id);
    } else {
      endereco.controls.municipio_id.setValue(null);
      if (nomeCidade) {
        this.snackBar.open(
          `Cidade "${nomeCidade}" não encontrada na base. Preencha manualmente.`,
          'Fechar',
          { duration: 4000 }
        );
      }
    }

    this.formulario.controls.nome.setValue(resposta.razao_social || '');
    this.cdr.markForCheck();
  }

  private buscarMunicipio(sigla: string, nome: string): Municipio | undefined {
    if (!sigla || !nome) {
      return undefined;
    }
    return this.localizacao
      .municipiosPorUf(sigla)
      .find((m) => this.normalizar(m.nome) === this.normalizar(nome));
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private formatarCep(cep: string): string {
    const digitos = cep.replace(/\D/g, '');
    return digitos.length === 8
      ? `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`
      : cep;
  }

  salvar(): void {
    this.formatarDocumento();
    if (this.formulario.invalid || this.salvando) {
      if (this.formulario.invalid) {
        this.formulario.markAllAsTouched();
        this.cdr.markForCheck();
        this.snackBar.open(
          'Verifique os campos obrigatórios.',
          'Fechar',
          { duration: 4000 }
        );
      }
      return;
    }
    this.salvando = true;
    const valor = this.formulario.getRawValue();
    const endereco = valor.endereco;
    const payload = {
      ...valor,
      cpf_cnpj: valor.cpf_cnpj || null,
      segmento_ids: (valor.segmentos ?? []).map((s) => s.id),
      observacoes: valor.observacoes || null,
      logradouro: endereco.logradouro || null,
      numero: endereco.numero || null,
      complemento: endereco.complemento || null,
      bairro: endereco.bairro || null,
      cep: endereco.cep || null,
      municipio_id: endereco.municipio_id,
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
