import { Component, Inject, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ClientesService } from '../../core/services/clientes.service';
import { ContatosService } from '../../core/services/contatos.service';
import { EnderecosService } from '../../core/services/enderecos.service';
import { InteracoesService } from '../../core/services/interacoes.service';
import { ClienteDetalhe, Contato, Endereco, Interacao } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-cliente-detail',
  imports: [
    NgIf,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
    PermissaoDirective,
  ],
  template: `
    <div class="header" *ngIf="cliente">
      <div>
        <h1>{{ cliente.nome }}</h1>
        <p class="subtitle">
          {{ cliente.cpf_cnpj || 'Sem CPF/CNPJ' }}
          <ng-container *ngIf="cliente.cidade">
            · {{ cliente.cidade }}{{ cliente.estado ? ' - ' + cliente.estado : '' }}
          </ng-container>
          · <span class="status-pill" [class]="cliente.status">{{ rotuloStatus(cliente.status) }}</span>
        </p>
      </div>
      <div class="header-actions">
        <button mat-stroked-button routerLink="/clientes">
          <mat-icon>arrow_back</mat-icon>
          Voltar
        </button>
        <button
          mat-flat-button
          color="primary"
          [routerLink]="['/clientes', cliente.id, 'editar']"
          appPermissao="clientes:editar"
        >
          <mat-icon>edit</mat-icon>
          Editar
        </button>
      </div>
    </div>

    <mat-card *ngIf="cliente?.observacoes" class="obs-card">
      <mat-card-content>
        <strong>Observações:</strong> {{ cliente!.observacoes }}
      </mat-card-content>
    </mat-card>

    <mat-card *ngIf="cliente">
      <mat-card-content>
        <mat-tab-group>
          <mat-tab [label]="'Contatos (' + cliente.contatos.length + ')'">
            <div class="tab-actions">
              <button
                mat-flat-button
                color="primary"
                (click)="novoContato()"
                appPermissao="contatos:criar"
              >
                <mat-icon>add</mat-icon>
                Adicionar contato
              </button>
            </div>
            <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
            <table mat-table [dataSource]="cliente.contatos" class="mat-elevation-z0">
              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let contato">{{ contato.nome }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>E-mail</th>
                <td mat-cell *matCellDef="let contato">{{ contato.email || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="telefone">
                <th mat-header-cell *matHeaderCellDef>Telefone</th>
                <td mat-cell *matCellDef="let contato">{{ contato.telefone || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="cargo">
                <th mat-header-cell *matHeaderCellDef>Cargo</th>
                <td mat-cell *matCellDef="let contato">{{ contato.cargo || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let contato" class="acoes-cell">
                  <button mat-icon-button (click)="editarContato(contato)" appPermissao="contatos:editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="excluirContato(contato)" appPermissao="contatos:excluir">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="colunasContato"></tr>
              <tr mat-row *matRowDef="let row; columns: colunasContato"></tr>
            </table>
            <p *ngIf="cliente.contatos.length === 0" class="empty">Nenhum contato cadastrado.</p>
          </mat-tab>

          <mat-tab [label]="'Endereços (' + cliente.enderecos.length + ')'">
            <div class="tab-actions">
              <button
                mat-flat-button
                color="primary"
                (click)="novoEndereco()"
                appPermissao="enderecos:criar"
              >
                <mat-icon>add</mat-icon>
                Adicionar endereço
              </button>
            </div>
            <table mat-table [dataSource]="cliente.enderecos" class="mat-elevation-z0">
              <ng-container matColumnDef="logradouro">
                <th mat-header-cell *matHeaderCellDef>Endereço</th>
                <td mat-cell *matCellDef="let endereco">
                  {{ endereco.logradouro }}{{ endereco.numero ? ', ' + endereco.numero : '' }}
                  <mat-icon *ngIf="endereco.principal" matTooltip="Endereço principal">star</mat-icon>
                </td>
              </ng-container>
              <ng-container matColumnDef="bairro">
                <th mat-header-cell *matHeaderCellDef>Bairro</th>
                <td mat-cell *matCellDef="let endereco">{{ endereco.bairro || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="cidade">
                <th mat-header-cell *matHeaderCellDef>Cidade</th>
                <td mat-cell *matCellDef="let endereco">
                  {{ endereco.cidade || '—' }}{{ endereco.estado ? ' - ' + endereco.estado : '' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="cep">
                <th mat-header-cell *matHeaderCellDef>CEP</th>
                <td mat-cell *matCellDef="let endereco">{{ endereco.cep || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let endereco" class="acoes-cell">
                  <button mat-icon-button (click)="editarEndereco(endereco)" appPermissao="enderecos:editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="excluirEndereco(endereco)" appPermissao="enderecos:excluir">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="colunasEndereco"></tr>
              <tr mat-row *matRowDef="let row; columns: colunasEndereco"></tr>
            </table>
            <p *ngIf="cliente.enderecos.length === 0" class="empty">Nenhum endereço cadastrado.</p>
          </mat-tab>

          <mat-tab [label]="'Interações (' + cliente.interacoes.length + ')'">
            <div class="tab-actions">
              <button
                mat-flat-button
                color="primary"
                (click)="novaInteracao()"
                appPermissao="interacoes:criar"
              >
                <mat-icon>add</mat-icon>
                Nova interação
              </button>
            </div>
            <table mat-table [dataSource]="cliente.interacoes" class="mat-elevation-z0">
              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let interacao">
                  <span class="tipo-pill" [class]="interacao.tipo">{{ rotuloTipo(interacao.tipo) }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="assunto">
                <th mat-header-cell *matHeaderCellDef>Assunto</th>
                <td mat-cell *matCellDef="let interacao">{{ interacao.assunto }}</td>
              </ng-container>
              <ng-container matColumnDef="ocorreu_em">
                <th mat-header-cell *matHeaderCellDef>Data</th>
                <td mat-cell *matCellDef="let interacao">
                  {{ interacao.ocorreu_em | date: 'dd/MM/yyyy' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="criado_por">
                <th mat-header-cell *matHeaderCellDef>Registrado por</th>
                <td mat-cell *matCellDef="let interacao">{{ interacao.criado_por_nome || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let interacao" class="acoes-cell">
                  <button mat-icon-button (click)="editarInteracao(interacao)" appPermissao="interacoes:editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="excluirInteracao(interacao)" appPermissao="interacoes:excluir">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="colunasInteracao"></tr>
              <tr mat-row *matRowDef="let row; columns: colunasInteracao"></tr>
            </table>
            <p *ngIf="cliente.interacoes.length === 0" class="empty">Nenhuma interação registrada.</p>
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0 0 4px;
    }
    .subtitle {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .obs-card {
      margin-bottom: 16px;
    }
    .tab-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px 0 8px;
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
    .status-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-pill.ativo { background: #e8f5e9; color: #2e7d32; }
    .status-pill.inativo { background: #fbe9e7; color: #c62828; }
    .status-pill.prospect { background: #fff3e0; color: #e65100; }
    .tipo-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .tipo-pill.ligacao { background: #e3f2fd; color: #1565c0; }
    .tipo-pill.visita { background: #e8f5e9; color: #2e7d32; }
    .tipo-pill.anotacao { background: #f3e5f5; color: #6a1b9a; }
    .tipo-pill.mensagem { background: #fffde7; color: #f9a825; }
  `,
})
export class ClienteDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientesService = inject(ClientesService);
  private readonly contatosService = inject(ContatosService);
  private readonly enderecosService = inject(EnderecosService);
  private readonly interacoesService = inject(InteracoesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  cliente: ClienteDetalhe | null = null;
  carregando = false;
  readonly colunasContato = ['nome', 'email', 'telefone', 'cargo', 'acoes'];
  readonly colunasEndereco = ['logradouro', 'bairro', 'cidade', 'cep', 'acoes'];
  readonly colunasInteracao = ['tipo', 'assunto', 'ocorreu_em', 'criado_por', 'acoes'];

  private clienteId = 0;

  ngOnInit(): void {
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.clientesService.detalhar(this.clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  novoContato(): void {
    const ref = this.dialog.open(ContatoDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.contatosService.criar(this.clienteId, dados).subscribe({
        next: () => {
          this.snackBar.open('Contato adicionado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  editarContato(contato: Contato): void {
    const ref = this.dialog.open(ContatoDialogComponent, {
      width: '480px',
      data: contato,
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.contatosService.atualizar(this.clienteId, contato.id, dados).subscribe({
        next: () => {
          this.snackBar.open('Contato atualizado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  excluirContato(contato: Contato): void {
    this.confirmarExclusao(
      'Excluir contato',
      `Deseja excluir o contato "${contato.nome}"?`,
      () =>
        this.contatosService.excluir(this.clienteId, contato.id).subscribe({
          next: () => this.carregar(),
        })
    );
  }

  novoEndereco(): void {
    const ref = this.dialog.open(EnderecoDialogComponent, { width: '560px' });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.enderecosService.criar(this.clienteId, dados).subscribe({
        next: () => {
          this.snackBar.open('Endereço adicionado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  editarEndereco(endereco: Endereco): void {
    const ref = this.dialog.open(EnderecoDialogComponent, {
      width: '560px',
      data: endereco,
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.enderecosService.atualizar(this.clienteId, endereco.id, dados).subscribe({
        next: () => {
          this.snackBar.open('Endereço atualizado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  excluirEndereco(endereco: Endereco): void {
    this.confirmarExclusao(
      'Excluir endereço',
      `Deseja excluir o endereço "${endereco.logradouro}"?`,
      () =>
        this.enderecosService.excluir(this.clienteId, endereco.id).subscribe({
          next: () => this.carregar(),
        })
    );
  }

  novaInteracao(): void {
    const ref = this.dialog.open(InteracaoDialogComponent, { width: '560px' });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.interacoesService.criar(this.clienteId, dados).subscribe({
        next: () => {
          this.snackBar.open('Interação registrada.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  editarInteracao(interacao: Interacao): void {
    const ref = this.dialog.open(InteracaoDialogComponent, {
      width: '560px',
      data: interacao,
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.interacoesService
        .atualizar(this.clienteId, interacao.id, dados)
        .subscribe({
          next: () => {
            this.snackBar.open('Interação atualizada.', 'Fechar', { duration: 3000 });
            this.carregar();
          },
        });
    });
  }

  excluirInteracao(interacao: Interacao): void {
    this.confirmarExclusao(
      'Excluir interação',
      `Deseja excluir a interação "${interacao.assunto}"?`,
      () =>
        this.interacoesService.excluir(this.clienteId, interacao.id).subscribe({
          next: () => this.carregar(),
        })
    );
  }

  private confirmarExclusao(
    titulo: string,
    mensagem: string,
    acao: () => void
  ): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo, mensagem, textoConfirmar: 'Excluir' },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (confirmado) acao();
    });
  }

  rotuloStatus(status: string): string {
    const mapa: Record<string, string> = {
      ativo: 'Ativo',
      inativo: 'Inativo',
      prospect: 'Prospect',
    };
    return mapa[status] || status;
  }

  rotuloTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      ligacao: 'Ligação',
      visita: 'Visita',
      anotacao: 'Anotação',
      mensagem: 'Mensagem',
    };
    return mapa[tipo] || tipo;
  }
}

@Component({
  selector: 'app-contato-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ dados ? 'Editar contato' : 'Novo contato' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nome *</mat-label>
          <input matInput formControlName="nome" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>E-mail</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Telefone</mat-label>
          <input matInput formControlName="telefone" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cargo</mat-label>
          <input matInput formControlName="cargo" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="formulario.invalid" (click)="salvar()">Salvar</button>
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
export class ContatoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ContatoDialogComponent>);

  readonly formulario = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: [''],
    telefone: [''],
    cargo: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public readonly dados: Contato | null) {
    if (dados) {
      this.formulario.patchValue(dados);
    }
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    const valor = this.formulario.getRawValue();
    this.dialogRef.close({
      ...valor,
      email: valor.email || null,
      telefone: valor.telefone || null,
      cargo: valor.cargo || null,
    });
  }
}

@Component({
  selector: 'app-endereco-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ dados ? 'Editar endereço' : 'Novo endereço' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Logradouro *</mat-label>
          <input matInput formControlName="logradouro" />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Número</mat-label>
            <input matInput formControlName="numero" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>CEP</mat-label>
            <input matInput formControlName="cep" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Complemento</mat-label>
          <input matInput formControlName="complemento" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Bairro</mat-label>
          <input matInput formControlName="bairro" />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Cidade</mat-label>
            <input matInput formControlName="cidade" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="uf">
            <mat-label>UF</mat-label>
            <input matInput formControlName="estado" maxlength="2" />
          </mat-form-field>
        </div>
        <mat-checkbox formControlName="principal">Endereço principal</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="formulario.invalid" (click)="salvar()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
    }
    .row {
      display: flex;
      gap: 12px;
    }
    .grow { flex: 1; }
    .uf { width: 90px; }
  `,
})
export class EnderecoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EnderecoDialogComponent>);

  readonly formulario = this.fb.nonNullable.group({
    logradouro: ['', Validators.required],
    numero: [''],
    complemento: [''],
    bairro: [''],
    cidade: [''],
    estado: [''],
    cep: [''],
    principal: [false],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public readonly dados: Endereco | null) {
    if (dados) {
      this.formulario.patchValue(dados);
    }
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    const valor = this.formulario.getRawValue();
    this.dialogRef.close({
      ...valor,
      numero: valor.numero || null,
      complemento: valor.complemento || null,
      bairro: valor.bairro || null,
      cidade: valor.cidade || null,
      estado: valor.estado ? valor.estado.toUpperCase() : null,
      cep: valor.cep || null,
    });
  }
}

@Component({
  selector: 'app-interacao-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ dados ? 'Editar interação' : 'Nova interação' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
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
      <button mat-flat-button color="primary" [disabled]="formulario.invalid" (click)="salvar()">Salvar</button>
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
export class InteracaoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InteracaoDialogComponent>);

  readonly formulario = this.fb.nonNullable.group({
    tipo: ['anotacao' as string],
    assunto: ['', Validators.required],
    descricao: [''],
    ocorreu_em: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public readonly dados: Interacao | null) {
    if (dados) {
      this.formulario.patchValue({
        tipo: dados.tipo,
        assunto: dados.assunto,
        descricao: dados.descricao || '',
        ocorreu_em: dados.ocorreu_em ? this.paraInputLocal(dados.ocorreu_em) : '',
      });
    }
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    const valor = this.formulario.getRawValue();
    this.dialogRef.close({
      tipo: valor.tipo,
      assunto: valor.assunto,
      descricao: valor.descricao || null,
      ocorreu_em: valor.ocorreu_em ? new Date(valor.ocorreu_em).toISOString() : undefined,
    });
  }

  private paraInputLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
