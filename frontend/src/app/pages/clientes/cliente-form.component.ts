import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientesService } from '../../core/services/clientes.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-cliente-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
            <input matInput formControlName="cpf_cnpj" placeholder="Somente números" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ativo">Ativo</mat-option>
              <mat-option value="inativo">Inativo</mat-option>
              <mat-option value="prospect">Prospect</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Segmento</mat-label>
            <input matInput formControlName="segmento" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cidade</mat-label>
            <input matInput formControlName="cidade" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <input matInput formControlName="estado" maxlength="2" />
          </mat-form-field>

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    cpf_cnpj: [''],
    status: ['ativo' as string],
    segmento: [''],
    cidade: [''],
    estado: [''],
    observacoes: [''],
  });

  editando = false;
  salvando = false;
  private clienteId: number | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editando = true;
      this.clienteId = Number(id);
      this.clientesService.detalhar(this.clienteId).subscribe((cliente) => {
        this.formulario.patchValue({
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj || '',
          status: cliente.status,
          segmento: cliente.segmento || '',
          cidade: cliente.cidade || '',
          estado: cliente.estado || '',
          observacoes: cliente.observacoes || '',
        });
        this.cdr.markForCheck();
      });
    }
  }

  salvar(): void {
    if (this.formulario.invalid || this.salvando) {
      return;
    }
    this.salvando = true;
    const valor = this.formulario.getRawValue();
    const payload = {
      ...valor,
      cpf_cnpj: valor.cpf_cnpj || null,
      segmento: valor.segmento || null,
      cidade: valor.cidade || null,
      estado: valor.estado ? valor.estado.toUpperCase() : null,
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
