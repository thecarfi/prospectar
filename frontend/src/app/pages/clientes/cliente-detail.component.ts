import { Component, Inject, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ClientesService } from '../../core/services/clientes.service';
import { ContatosService } from '../../core/services/contatos.service';
import { EnderecosService } from '../../core/services/enderecos.service';
import { InteracoesService } from '../../core/services/interacoes.service';
import { CnaeService } from '../../core/services/cnae.service';
import { ClienteDetalhe, Contato, Endereco, Interacao, Segmento, Cnae, ClienteCnae } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { SeletorMunicipioComponent } from '../../shared/seletor-municipio.component';

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
    MatAutocompleteModule,
  ],
  template: `
    <div class="header" *ngIf="cliente">
      <div>
        <h1>{{ cliente.nome }}</h1>
        <p class="subtitle">
          {{ cliente.cpf_cnpj || 'Sem CPF/CNPJ' }}
          <ng-container *ngIf="cliente.municipio_nome">
            · {{ cliente.municipio_nome }}{{ cliente.municipio_uf ? ' - ' + cliente.municipio_uf : '' }}
          </ng-container>
          · <span
              class="status-pill"
              [style.background]="corFundo(cliente.status_cor)"
              [style.color]="cliente.status_cor || '#424242'"
              matTooltip="{{ cliente.status_descricao || '' }}"
            >{{ cliente.status_nome || '—' }}</span>
          <ng-container *ngIf="cliente.segmentos?.length">
            · Segmentos: {{ nomesSegmentos(cliente.segmentos!) }}
          </ng-container>
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
                  {{ endereco.municipio_nome || '—' }}{{ endereco.municipio_uf ? ' - ' + endereco.municipio_uf : '' }}
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

          <mat-tab [label]="'CNAE (' + (cliente.cnaes?.length || 0) + ')'">
            <div class="tab-actions">
              <button
                mat-flat-button
                color="primary"
                (click)="adicionarCnae()"
                appPermissao="cnae:criar"
              >
                <mat-icon>add</mat-icon>
                Adicionar CNAE
              </button>
            </div>
            <table mat-table [dataSource]="cliente.cnaes || []" class="mat-elevation-z0">
              <ng-container matColumnDef="secao">
                <th mat-header-cell *matHeaderCellDef>Seção</th>
                <td mat-cell *matCellDef="let cnae">{{ cnae.secao }}</td>
              </ng-container>
              <ng-container matColumnDef="divisao">
                <th mat-header-cell *matHeaderCellDef>Divisão</th>
                <td mat-cell *matCellDef="let cnae">{{ cnae.divisao }}</td>
              </ng-container>
              <ng-container matColumnDef="subclasse">
                <th mat-header-cell *matHeaderCellDef>Subclasse</th>
                <td mat-cell *matCellDef="let cnae">{{ cnae.subclasse }}</td>
              </ng-container>
              <ng-container matColumnDef="descricao_subclasse">
                <th mat-header-cell *matHeaderCellDef>Descrição</th>
                <td mat-cell *matCellDef="let cnae">{{ cnae.descricao_subclasse }}</td>
              </ng-container>
              <ng-container matColumnDef="principal">
                <th mat-header-cell *matHeaderCellDef>Principal</th>
                <td mat-cell *matCellDef="let cnae">
                  <button
                    mat-icon-button
                    appPermissao="cnae:editar"
                    [matTooltip]="cnae.principal ? 'Atividade principal' : 'Marcar como principal'"
                    (click)="definirCnaePrincipal(cnae)"
                  >
                    <mat-icon [class.principal-icon]="cnae.principal">
                      {{ cnae.principal ? 'star' : 'star_border' }}
                    </mat-icon>
                  </button>
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let cnae" class="acoes-cell">
                  <button mat-icon-button (click)="editarCnae(cnae)" appPermissao="cnae:editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="excluirCnae(cnae)" appPermissao="cnae:excluir">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="colunasCnae"></tr>
              <tr mat-row *matRowDef="let row; columns: colunasCnae"></tr>
            </table>
            <p *ngIf="!cliente.cnaes?.length" class="empty">Nenhum CNAE vinculado.</p>
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
    .principal-icon { color: #f9a825; }
  `,
})
export class ClienteDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientesService = inject(ClientesService);
  private readonly contatosService = inject(ContatosService);
  private readonly enderecosService = inject(EnderecosService);
  private readonly interacoesService = inject(InteracoesService);
  private readonly cnaeService = inject(CnaeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  cliente: ClienteDetalhe | null = null;
  carregando = false;
  readonly colunasContato = ['nome', 'email', 'telefone', 'cargo', 'acoes'];
  readonly colunasEndereco = ['logradouro', 'bairro', 'cidade', 'cep', 'acoes'];
  readonly colunasInteracao = ['tipo', 'assunto', 'ocorreu_em', 'criado_por', 'acoes'];
  readonly colunasCnae = ['secao', 'divisao', 'subclasse', 'descricao_subclasse', 'principal', 'acoes'];

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

  adicionarCnae(): void {
    const vinculados = (this.cliente?.cnaes ?? []).map((c) => c.subclasse);
    const ref = this.dialog.open(CnaeDialogComponent, {
      width: '520px',
      data: { vinculados },
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.cnaeService.adicionar(this.clienteId, dados).subscribe({
        next: () => {
          this.snackBar.open('CNAE adicionado.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
    });
  }

  editarCnae(cnae: ClienteCnae): void {
    const ref = this.dialog.open(CnaeDialogComponent, {
      width: '520px',
      data: { cnae },
    });
    ref.afterClosed().subscribe((dados) => {
      if (!dados) return;
      this.cnaeService
        .atualizar(this.clienteId, cnae.subclasse, dados)
        .subscribe({
          next: () => {
            this.snackBar.open('CNAE atualizado.', 'Fechar', { duration: 3000 });
            this.carregar();
          },
        });
    });
  }

  definirCnaePrincipal(cnae: ClienteCnae): void {
    if (cnae.principal) return;
    this.cnaeService
      .atualizar(this.clienteId, cnae.subclasse, { principal: true })
      .subscribe({
        next: () => {
          this.snackBar.open('CNAE definido como principal.', 'Fechar', { duration: 3000 });
          this.carregar();
        },
      });
  }

  excluirCnae(cnae: ClienteCnae): void {
    this.confirmarExclusao(
      'Excluir CNAE',
      `Deseja excluir o CNAE "${cnae.subclasse} - ${cnae.descricao_subclasse}"?`,
      () =>
        this.cnaeService.remover(this.clienteId, cnae.subclasse).subscribe({
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

  corFundo(cor?: string): string {
    if (!cor) {
      return '#eceff1';
    }
    const hex = cor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return '#eceff1';
    }
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }

  nomesSegmentos(segmentos: Segmento[]): string {
    return segmentos.map((s) => s.nome).join(', ');
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
    SeletorMunicipioComponent,
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
        <app-seletor-municipio
          [estadoControl]="formulario.controls.estado"
          [municipioControl]="formulario.controls.municipio_id"
        ></app-seletor-municipio>
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
    estado: [''],
    municipio_id: [null as number | null],
    cep: [''],
    principal: [false],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public readonly dados: Endereco | null) {
    if (dados) {
      this.formulario.patchValue({
        logradouro: dados.logradouro,
        numero: dados.numero || '',
        complemento: dados.complemento || '',
        bairro: dados.bairro || '',
        estado: dados.municipio_uf || '',
        municipio_id: dados.municipio_id || null,
        cep: dados.cep || '',
        principal: dados.principal,
      });
    }
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    const { estado, ...valor } = this.formulario.getRawValue();
    this.dialogRef.close({
      ...valor,
      numero: valor.numero || null,
      complemento: valor.complemento || null,
      bairro: valor.bairro || null,
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

export interface CnaeDialogData {
  cnae?: ClienteCnae;
  vinculados?: string[];
}

@Component({
  selector: 'app-cnae-dialog',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatAutocompleteModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.cnae ? 'Editar CNAE' : 'Adicionar CNAE' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
        <ng-container *ngIf="data.cnae; else busca">
          <div class="cnae-selecionado">
            <strong>{{ data.cnae.subclasse }}</strong> - {{ data.cnae.descricao_subclasse }}
          </div>
        </ng-container>
        <ng-template #busca>
          <mat-form-field appearance="outline">
            <mat-label>Buscar CNAE *</mat-label>
            <input
              matInput
              [formControl]="buscaControl"
              [matAutocomplete]="auto"
              placeholder="Busque por código ou descrição"
            />
            <mat-autocomplete
              #auto="matAutocomplete"
              (optionSelected)="aoSelecionar($event.option.value)"
            >
              <mat-option *ngFor="let cnae of opcoes; trackBy: rastrear" [value]="cnae">
                {{ cnae.subclasse }} - {{ cnae.descricao_subclasse }}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <div class="cnae-selecionado" *ngIf="selecionado">
            <strong>{{ selecionado.subclasse }}</strong> - {{ selecionado.descricao_subclasse }}
          </div>
        </ng-template>
        <mat-checkbox formControlName="principal">Atividade principal</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!selecionado" (click)="salvar()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
    }
    .cnae-selecionado {
      padding: 8px 0;
    }
  `,
})
export class CnaeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CnaeDialogComponent>);
  private readonly cnaeService = inject(CnaeService);
  readonly data = inject<CnaeDialogData>(MAT_DIALOG_DATA);

  readonly buscaControl = new FormControl('');
  readonly formulario = this.fb.nonNullable.group({
    principal: [
      this.data.cnae
        ? this.data.cnae.principal
        : !this.data.vinculados || this.data.vinculados.length === 0,
    ],
  });

  selecionado: Cnae | null = this.data.cnae ?? null;
  opcoes: Cnae[] = [];

  private catalogo: Cnae[] = [];
  private readonly vinculados = new Set(this.data.vinculados ?? []);

  ngOnInit(): void {
    this.cnaeService.listar().subscribe({
      next: (lista) => {
        this.catalogo = lista;
        this.filtrar(this.buscaControl.value ?? '');
      },
    });
    this.buscaControl.valueChanges.subscribe((termo) =>
      this.filtrar(termo ?? '')
    );
  }

  aoSelecionar(cnae: Cnae): void {
    this.selecionado = cnae;
    this.buscaControl.setValue(
      `${cnae.subclasse} - ${cnae.descricao_subclasse}`,
      { emitEvent: false }
    );
  }

  salvar(): void {
    if (!this.selecionado) return;
    this.dialogRef.close({
      subclasse: this.selecionado.subclasse,
      principal: this.formulario.getRawValue().principal,
    });
  }

  rastrear(_: number, cnae: Cnae): string {
    return cnae.subclasse;
  }

  private filtrar(termo: string): void {
    const t = termo.toLowerCase().trim();
    this.opcoes = this.catalogo
      .filter((c) => {
        if (this.vinculados.has(c.subclasse)) {
          return false;
        }
        if (!t) {
          return true;
        }
        return [
          c.subclasse,
          c.descricao_subclasse,
          c.descricao_classe,
        ].some((v) => v.toLowerCase().includes(t));
      })
      .slice(0, 50);
  }
}
