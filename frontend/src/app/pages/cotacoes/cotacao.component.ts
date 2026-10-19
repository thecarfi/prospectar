import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CotacaoService } from '../../core/services/cotacao.service';
import { ClientesService } from '../../core/services/clientes.service';
import {
  Cliente,
  CotacaoCalculo,
  CotacaoEntrada,
  CotacaoHistoricoItem,
  CotacaoRotaOverride,
  GeneralidadeCotacao,
  RotaCotacao,
} from '../../core/models';
import {
  formatarData,
  formatarDecimal,
  formatarMoeda,
  lerDecimal,
} from '../../core/utils/formato';
import { CotacaoDetalheDialogComponent } from './cotacao-detalhe-dialog.component';

interface ItemResultado {
  rotulo: string;
  valor: string;
  ajuda?: string;
}

interface GrupoResultado {
  titulo: string;
  itens: ItemResultado[];
}

const ROTULOS_GENERALIDADES: Record<string, string> = {
  seguro: 'Seguro',
  gris: 'GRIS',
  pedagio: 'Pedágio',
  sec_cat: 'SEC/CAT',
  valor_quilo: 'Valor por quilo',
  frete_percentual: 'Frete percentual',
};

@Component({
  selector: 'app-cotacao',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="header">
      <h1>Cotação</h1>
    </div>

    <div class="aviso-local" *ngIf="alteracoesLocais">
      <mat-icon>info</mat-icon>
      <span>
        Alterações locais nos valores de Rotas e Generalidades impactam o cálculo,
        mas não são salvas no banco.
      </span>
      <button mat-stroked-button color="primary" (click)="restaurarValores()">
        Restaurar
      </button>
    </div>

    <mat-tab-group animationDuration="0ms">
      <mat-tab label="Cotação">
        <div class="tab-content">
          <mat-card>
            <mat-card-content>
              <form [formGroup]="formulario" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Cliente</mat-label>
                  <input
                    matInput
                    formControlName="cliente_texto"
                    [matAutocomplete]="autoCliente"
                    placeholder="Opcional"
                    (input)="aoDigitarCliente()"
                  />
                  <mat-autocomplete
                    #autoCliente="matAutocomplete"
                    (optionSelected)="selecionarCliente($event.option.value)"
                  >
                    <mat-option *ngFor="let cliente of clientesFiltrados" [value]="cliente">
                      {{ cliente.nome }}
                    </mat-option>
                  </mat-autocomplete>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Rota</mat-label>
                  <mat-select formControlName="rota_id">
                    <mat-option *ngFor="let rota of rotas" [value]="rota.id">
                      {{ rota.nome }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Largura (m)</mat-label>
                  <input matInput formControlName="largura" inputmode="decimal" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Altura (m)</mat-label>
                  <input matInput formControlName="altura" inputmode="decimal" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Comprimento (m)</mat-label>
                  <input matInput formControlName="comprimento" inputmode="decimal" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Valor NF</mat-label>
                  <input matInput formControlName="valor_nf" inputmode="decimal" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Peso (kg)</mat-label>
                  <input matInput formControlName="peso" inputmode="decimal" />
                </mat-form-field>
              </form>

              <div class="acoes">
                <button
                  mat-flat-button
                  color="primary"
                  type="button"
                  [disabled]="calculando"
                  (click)="calcular()"
                >
                  <mat-icon>calculate</mat-icon>
                  Calcular
                </button>
                <button
                  mat-stroked-button
                  color="primary"
                  type="button"
                  [disabled]="!resultado || salvando"
                  (click)="salvar()"
                >
                  <mat-icon>save</mat-icon>
                  Salvar cotação
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card *ngIf="resultado" class="resultado">
            <mat-card-content>
              <h2>Resultado do cálculo</h2>
              <div class="contexto">
                <span><strong>Cliente:</strong> {{ clienteResultado }}</span>
                <span><strong>Rota:</strong> {{ resultado.rota.nome }}</span>
              </div>
              <section *ngFor="let grupo of grupos; let primeiro = first" class="grupo">
                <hr *ngIf="!primeiro" />
                <h3>{{ grupo.titulo }}</h3>
                <div class="itens">
                  <div
                    *ngFor="let item of grupo.itens"
                    class="item"
                    [matTooltip]="item.ajuda || ''"
                    [matTooltipDisabled]="!item.ajuda"
                  >
                    <span class="rotulo">{{ item.rotulo }}</span>
                    <span class="valor">{{ item.valor }}</span>
                  </div>
                </div>
              </section>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <mat-tab label="Rotas">
        <div class="tab-content">
          <mat-card>
            <mat-card-content class="table-wrap">
              <h2>Rotas</h2>
              <table mat-table [dataSource]="rotas" class="mat-elevation-z0">
                <ng-container matColumnDef="nome">
                  <th mat-header-cell *matHeaderCellDef>Rota</th>
                  <td mat-cell *matCellDef="let rota">{{ rota.nome }}</td>
                </ng-container>
                <ng-container matColumnDef="icms">
                  <th mat-header-cell *matHeaderCellDef>ICMS</th>
                  <td mat-cell *matCellDef="let rota; let i = index" [formGroup]="grupoRota(i)">
                    <mat-form-field
                      appearance="outline"
                      subscriptSizing="dynamic"
                      class="campo-edicao"
                    >
                      <input
                        matInput
                        formControlName="icms"
                        inputmode="decimal"
                        (input)="marcarAlteracoesLocais()"
                      />
                    </mat-form-field>
                  </td>
                </ng-container>
                <ng-container matColumnDef="frete_minimo">
                  <th mat-header-cell *matHeaderCellDef>Frete mínimo</th>
                  <td mat-cell *matCellDef="let rota; let i = index" [formGroup]="grupoRota(i)">
                    <mat-form-field
                      appearance="outline"
                      subscriptSizing="dynamic"
                      class="campo-edicao"
                    >
                      <input
                        matInput
                        formControlName="frete_minimo"
                        inputmode="decimal"
                        (input)="marcarAlteracoesLocais()"
                      />
                    </mat-form-field>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="colunasRotas"></tr>
                <tr mat-row *matRowDef="let row; columns: colunasRotas"></tr>
              </table>
              <p class="ajuda">
                ICMS em decimal (0,07 = 7%). As edições aqui valem apenas para o
                cálculo desta tela e não são gravadas; a edição permanente é feita
                em Configurações.
              </p>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <mat-tab label="Generalidades">
        <div class="tab-content">
          <mat-card>
            <mat-card-content class="table-wrap">
              <h2>Generalidades</h2>
              <table
                mat-table
                [dataSource]="generalidades"
                class="mat-elevation-z0"
                [formGroup]="generalidadesForm"
              >
                <ng-container matColumnDef="tipo_generalidade">
                  <th mat-header-cell *matHeaderCellDef>Generalidade</th>
                  <td mat-cell *matCellDef="let item">
                    {{ rotuloGeneralidade(item.tipo_generalidade) }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="valor_generalidade">
                  <th mat-header-cell *matHeaderCellDef>Valor</th>
                  <td mat-cell *matCellDef="let item">
                    <mat-form-field
                      appearance="outline"
                      subscriptSizing="dynamic"
                      class="campo-edicao"
                    >
                      <input
                        matInput
                        [formControlName]="'g' + item.id"
                        inputmode="decimal"
                        (input)="marcarAlteracoesLocais()"
                      />
                    </mat-form-field>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="colunasGeneralidades"></tr>
                <tr mat-row *matRowDef="let row; columns: colunasGeneralidades"></tr>
              </table>
              <p class="ajuda">
                As edições aqui valem apenas para o cálculo desta tela e não são
                gravadas; a edição permanente é feita em Configurações.
              </p>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <mat-tab label="Histórico">
        <div class="tab-content">
          <mat-card class="historico">
            <mat-card-content>
              <div class="historico-topo">
                <h2>Histórico de cotações</h2>
                <form [formGroup]="filtrosForm" class="filtros" (ngSubmit)="buscarHistorico()">
                  <mat-form-field appearance="outline" class="filtro-campo">
                    <mat-label>Cliente</mat-label>
                    <input matInput formControlName="cliente" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="filtro-campo">
                    <mat-label>Rota</mat-label>
                    <mat-select formControlName="rota_id">
                      <mat-option [value]="null">Todas</mat-option>
                      <mat-option *ngFor="let rota of rotas" [value]="rota.id">
                        {{ rota.nome }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit">Filtrar</button>
                  <button mat-button type="button" (click)="limparFiltros()">Limpar</button>
                </form>
              </div>

              <mat-progress-bar
                *ngIf="carregandoHistorico"
                mode="indeterminate"
              ></mat-progress-bar>

              <table mat-table [dataSource]="historico" class="mat-elevation-z0">
                <ng-container matColumnDef="criado_em">
                  <th mat-header-cell *matHeaderCellDef>Data</th>
                  <td mat-cell *matCellDef="let item">
                    {{ formatarData(item.criado_em) }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="cliente_texto">
                  <th mat-header-cell *matHeaderCellDef>Cliente</th>
                  <td mat-cell *matCellDef="let item">
                    {{ item.cliente_texto || '-' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="rota_nome">
                  <th mat-header-cell *matHeaderCellDef>Rota</th>
                  <td mat-cell *matCellDef="let item">{{ item.rota_nome }}</td>
                </ng-container>

                <ng-container matColumnDef="peso_definido">
                  <th mat-header-cell *matHeaderCellDef>Peso definido</th>
                  <td mat-cell *matCellDef="let item">
                    {{ decimal(item.peso_definido) }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="frete_escolhido">
                  <th mat-header-cell *matHeaderCellDef>Frete escolhido</th>
                  <td mat-cell *matCellDef="let item">
                    {{ item.frete_escolhido }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="valor_total">
                  <th mat-header-cell *matHeaderCellDef>Valor total</th>
                  <td mat-cell *matCellDef="let item">
                    {{ moeda(item.valor_total) }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="cotado_por_nome">
                  <th mat-header-cell *matHeaderCellDef>Usuário</th>
                  <td mat-cell *matCellDef="let item">
                    {{ item.cotado_por_nome || '-' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="acoes">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let item" class="acoes-cell">
                    <button
                      mat-icon-button
                      matTooltip="Ver detalhe"
                      (click)="abrirDetalhe(item)"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="colunasHistorico"></tr>
                <tr mat-row *matRowDef="let row; columns: colunasHistorico"></tr>
              </table>

              <p *ngIf="!carregandoHistorico && historico.length === 0" class="empty">
                Nenhuma cotação registrada.
              </p>

              <mat-paginator
                [length]="historicoTotal"
                [pageSize]="historicoLimite"
                [pageIndex]="historicoPagina - 1"
                [pageSizeOptions]="[5, 10, 25, 50]"
                (page)="paginar($event)"
              ></mat-paginator>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: `
    .header h1 {
      margin-top: 0;
    }
    .aviso-local {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(255, 193, 7, 0.16);
      color: rgba(0, 0, 0, 0.8);
      font-size: 13px;
    }
    .aviso-local span {
      flex: 1;
    }
    .campo-edicao {
      width: 150px;
    }
    .tab-content {
      padding-top: 16px;
      display: grid;
      gap: 16px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 16px;
    }
    .acoes {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
    .resultado h2 {
      margin: 0 0 16px;
      font-size: 18px;
    }
    .contexto {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 32px;
      color: rgba(0, 0, 0, 0.75);
      font-size: 14px;
    }
    .grupo {
      margin-top: 16px;
    }
    .grupo hr {
      margin: 16px 0;
      border: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }
    .grupo h3 {
      margin: 0 0 8px;
      font-size: 15px;
      font-weight: 600;
    }
    .itens {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px 24px;
    }
    .item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding-bottom: 6px;
    }
    .item .rotulo {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    .item .valor {
      font-weight: 500;
    }
    .historico-topo {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      justify-content: space-between;
    }
    .historico-topo h2 {
      margin: 0;
      font-size: 18px;
    }
    .filtros {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .filtro-campo {
      min-width: 180px;
    }
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
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
    .ajuda {
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
      padding: 8px 0 0;
    }
  `,
})
export class CotacaoComponent implements OnInit {
  private readonly cotacaoService = inject(CotacaoService);
  private readonly clientesService = inject(ClientesService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.group({
    cliente_texto: [''],
    rota_id: [null as number | null, Validators.required],
    largura: [''],
    altura: [''],
    comprimento: [''],
    valor_nf: ['', Validators.required],
    peso: ['', Validators.required],
  });

  readonly filtrosForm = this.fb.group({
    cliente: [''],
    rota_id: [null as number | null],
  });

  rotas: RotaCotacao[] = [];
  generalidades: GeneralidadeCotacao[] = [];
  clientesFiltrados: Cliente[] = [];

  readonly generalidadesForm = this.fb.group({});
  readonly rotasForm: FormArray<FormGroup> = this.fb.array<FormGroup>([]);
  alteracoesLocais = false;

  resultado: CotacaoCalculo | null = null;
  grupos: GrupoResultado[] = [];
  clienteResultado = '';
  calculando = false;
  salvando = false;

  historico: CotacaoHistoricoItem[] = [];
  historicoTotal = 0;
  historicoPagina = 1;
  historicoLimite = 10;
  carregandoHistorico = false;

  readonly colunasRotas = ['nome', 'icms', 'frete_minimo'];
  readonly colunasGeneralidades = ['tipo_generalidade', 'valor_generalidade'];
  readonly colunasHistorico = [
    'criado_em',
    'cliente_texto',
    'rota_nome',
    'peso_definido',
    'frete_escolhido',
    'valor_total',
    'cotado_por_nome',
    'acoes',
  ];

  private clienteSelecionado: Cliente | null = null;

  ngOnInit(): void {
    this.carregarRotas();
    this.carregarGeneralidades();
    this.carregarHistorico();
  }

  moeda(valor: number | null | undefined): string {
    return formatarMoeda(valor);
  }

  decimal(valor: number | null | undefined): string {
    return formatarDecimal(valor);
  }

  formatarData(valor?: string | null): string {
    return formatarData(valor);
  }

  percentual(valor: number): string {
    return `${formatarDecimal(valor * 100, 2)}%`;
  }

  rotuloGeneralidade(tipo: string): string {
    return ROTULOS_GENERALIDADES[tipo] ?? tipo;
  }

  grupoRota(index: number): FormGroup {
    return this.rotasForm.at(index) as FormGroup;
  }

  marcarAlteracoesLocais(): void {
    this.alteracoesLocais = true;
  }

  restaurarValores(): void {
    this.alteracoesLocais = false;
    this.carregarRotas();
    this.carregarGeneralidades();
  }

  aoDigitarCliente(): void {
    const termo = String(this.formulario.get('cliente_texto')?.value ?? '');
    if (this.clienteSelecionado && this.clienteSelecionado.nome !== termo) {
      this.clienteSelecionado = null;
    }
    if (termo.trim().length < 2) {
      this.clientesFiltrados = [];
      this.cdr.markForCheck();
      return;
    }
    this.clientesService.listar({ busca: termo, limite: 8 }).subscribe({
      next: (res) => {
        this.clientesFiltrados = res.dados;
        this.cdr.markForCheck();
      },
      error: () => {
        this.clientesFiltrados = [];
        this.cdr.markForCheck();
      },
    });
  }

  selecionarCliente(cliente: Cliente): void {
    this.clienteSelecionado = cliente;
    this.formulario.get('cliente_texto')?.setValue(cliente.nome, { emitEvent: false });
  }

  calcular(): void {
    const entrada = this.montarEntrada();
    if (!entrada) {
      return;
    }
    this.calculando = true;
    this.cotacaoService.calcular(entrada).subscribe({
      next: (res) => {
        this.aplicarResultado(res, entrada);
        this.calculando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.calculando = false;
        this.cdr.markForCheck();
      },
    });
  }

  salvar(): void {
    const entrada = this.montarEntrada();
    if (!entrada) {
      return;
    }
    this.salvando = true;
    this.cotacaoService.salvar(entrada).subscribe({
      next: () => {
        this.salvando = false;
        this.snackBar.open('Cotação salva.', 'Fechar', { duration: 3000 });
        this.historicoPagina = 1;
        this.carregarHistorico();
        this.cdr.markForCheck();
      },
      error: () => {
        this.salvando = false;
        this.cdr.markForCheck();
      },
    });
  }

  buscarHistorico(): void {
    this.historicoPagina = 1;
    this.carregarHistorico();
  }

  limparFiltros(): void {
    this.filtrosForm.reset({ cliente: '', rota_id: null });
    this.buscarHistorico();
  }

  paginar(evento: PageEvent): void {
    this.historicoPagina = evento.pageIndex + 1;
    this.historicoLimite = evento.pageSize;
    this.carregarHistorico();
  }

  abrirDetalhe(item: CotacaoHistoricoItem): void {
    this.cotacaoService.obter(item.id).subscribe({
      next: (cotacao) => {
        this.dialog.open(CotacaoDetalheDialogComponent, {
          width: '640px',
          data: { cotacao },
        });
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private montarEntrada(): CotacaoEntrada | null {
    const valorFormulario = this.formulario.getRawValue();
    if (!valorFormulario.rota_id) {
      this.snackBar.open('Selecione uma rota para calcular.', 'Fechar', { duration: 3000 });
      return null;
    }

    const valorNf = lerDecimal(valorFormulario.valor_nf);
    if (!Number.isFinite(valorNf) || valorNf <= 0) {
      this.snackBar.open('Informe um Valor NF válido.', 'Fechar', { duration: 3000 });
      return null;
    }

    const peso = lerDecimal(valorFormulario.peso);
    if (!Number.isFinite(peso) || peso < 0) {
      this.snackBar.open('Informe um Peso válido.', 'Fechar', { duration: 3000 });
      return null;
    }

    const dimensoes = [
      this.numeroOpcional(valorFormulario.largura),
      this.numeroOpcional(valorFormulario.altura),
      this.numeroOpcional(valorFormulario.comprimento),
    ];
    if (dimensoes.some((valor) => !Number.isFinite(valor))) {
      this.snackBar.open('Informe dimensões válidas.', 'Fechar', { duration: 3000 });
      return null;
    }

    const indiceRota = this.rotas.findIndex(
      (rota) => rota.id === Number(valorFormulario.rota_id)
    );
    let rotaOverride: CotacaoRotaOverride | undefined;
    if (indiceRota >= 0) {
      const grupo = this.rotasForm.at(indiceRota) as FormGroup;
      const icms = lerDecimal(grupo.get('icms')?.value);
      if (!Number.isFinite(icms) || icms < 0 || icms > 1) {
        this.snackBar.open(
          'ICMS editado inválido (decimal entre 0 e 1).',
          'Fechar',
          { duration: 3000 }
        );
        return null;
      }
      const freteMinimo = lerDecimal(grupo.get('frete_minimo')?.value);
      if (!Number.isFinite(freteMinimo) || freteMinimo < 0) {
        this.snackBar.open('Frete mínimo editado inválido.', 'Fechar', { duration: 3000 });
        return null;
      }
      rotaOverride = { icms, frete_minimo: freteMinimo };
    }

    let parametros: Record<string, number> | undefined;
    if (this.generalidades.length > 0) {
      const valores = this.generalidadesForm.getRawValue() as Record<string, unknown>;
      const montados: Record<string, number> = {};
      for (const item of this.generalidades) {
        const valor = lerDecimal(valores[`g${item.id}`]);
        if (!Number.isFinite(valor) || valor < 0) {
          this.snackBar.open(
            `Valor editado inválido: ${this.rotuloGeneralidade(item.tipo_generalidade)}.`,
            'Fechar',
            { duration: 3000 }
          );
          return null;
        }
        montados[item.tipo_generalidade] = valor;
      }
      parametros = montados;
    }

    return {
      cliente_texto: String(valorFormulario.cliente_texto ?? '').trim() || null,
      cliente_id: this.clienteSelecionado?.id ?? null,
      rota_id: Number(valorFormulario.rota_id),
      largura: dimensoes[0],
      altura: dimensoes[1],
      comprimento: dimensoes[2],
      valor_nf: valorNf,
      peso,
      rota: rotaOverride,
      parametros,
    };
  }

  private textoEdicao(valor: number): string {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
      return '';
    }
    return String(numero).replace('.', ',');
  }

  private numeroOpcional(valor: unknown): number {
    if (valor === null || valor === undefined || valor === '') {
      return 0;
    }
    return lerDecimal(valor);
  }

  private aplicarResultado(resultado: CotacaoCalculo, entrada: CotacaoEntrada): void {
    this.resultado = resultado;
    this.clienteResultado = entrada.cliente_texto?.trim() || 'Não informado';
    const parametros = resultado.parametros ?? {};
    this.grupos = [
      {
        titulo: 'Pesos',
        itens: [
          {
            rotulo: 'Peso cubado',
            valor: formatarDecimal(resultado.peso_cubado),
            ajuda: `${formatarDecimal(entrada.largura)} × ${formatarDecimal(
              entrada.altura
            )} × ${formatarDecimal(entrada.comprimento)}`,
          },
          {
            rotulo: 'Peso informado',
            valor: formatarDecimal(entrada.peso),
          },
          {
            rotulo: 'Peso definido',
            valor: formatarDecimal(resultado.peso_definido),
            ajuda: `maior entre (cubado × 300 = ${formatarDecimal(
              resultado.peso_cubado_multiplicado
            )}) e peso (${formatarDecimal(entrada.peso)})`,
          },
        ],
      },
      {
        titulo: 'Generalidades',
        itens: [
          {
            rotulo: 'Seguro',
            valor: formatarMoeda(resultado.seguro_valor),
            ajuda: `${formatarDecimal(parametros['seguro'])} × ${formatarMoeda(
              entrada.valor_nf
            )}`,
          },
          {
            rotulo: 'GRIS',
            valor: formatarMoeda(resultado.gris_valor),
            ajuda: `${formatarDecimal(parametros['gris'])} × ${formatarMoeda(entrada.valor_nf)}`,
          },
          {
            rotulo: 'Pedágio',
            valor: formatarMoeda(resultado.pedagio_valor),
            ajuda: `${formatarDecimal(parametros['pedagio'])} × peso definido (${formatarDecimal(
              resultado.peso_definido
            )})`,
          },
          {
            rotulo: 'SEC/CAT',
            valor: formatarMoeda(resultado.sec_cat_valor),
            ajuda: `Valor fixo de SEC/CAT: ${formatarMoeda(parametros['sec_cat'])}`,
          },
        ],
      },
      {
        titulo: 'Tipos de frete',
        itens: [
          {
            rotulo: 'Frete peso',
            valor: formatarMoeda(resultado.frete_peso),
            ajuda: `Peso definido (${formatarDecimal(
              resultado.peso_definido
            )}) × valor_quilo (${formatarMoeda(parametros['valor_quilo'])})`,
          },
          {
            rotulo: 'Frete mínimo',
            valor: formatarMoeda(resultado.frete_minimo_valor),
            ajuda: `Frete mínimo da rota ${resultado.rota.nome}`,
          },
          {
            rotulo: 'Frete percentual',
            valor: formatarMoeda(resultado.frete_percentual_valor),
            ajuda: `${formatarMoeda(entrada.valor_nf)} × ${formatarDecimal(
              parametros['frete_percentual']
            )}`,
          },
        ],
      },
      {
        titulo: 'Resultado definido',
        itens: [
          { rotulo: 'Frete escolhido', valor: resultado.frete_escolhido },
          {
            rotulo: 'Valor frete escolhido',
            valor: formatarMoeda(resultado.valor_frete),
          },
          {
            rotulo: 'ICMS',
            valor: formatarMoeda(resultado.icms_valor),
            ajuda: `${formatarMoeda(resultado.valor_frete)} × ${formatarDecimal(
              resultado.rota.icms
            )}`,
          },
          {
            rotulo: 'Valor generalidade',
            valor: formatarMoeda(resultado.valor_generalidade),
          },
          {
            rotulo: 'Valor total',
            valor: formatarMoeda(resultado.valor_total),
            ajuda: `${formatarMoeda(resultado.valor_frete)} + ${formatarMoeda(
              resultado.icms_valor
            )} + ${formatarMoeda(resultado.valor_generalidade)}`,
          },
        ],
      },
    ];
  }

  private carregarRotas(): void {
    this.cotacaoService.listarRotas().subscribe({
      next: (rotas) => {
        this.rotas = rotas;
        this.rotasForm.clear();
        rotas.forEach((rota) => {
          this.rotasForm.push(
            this.fb.group({
              icms: [this.textoEdicao(rota.icms)],
              frete_minimo: [this.textoEdicao(rota.frete_minimo)],
            })
          );
        });
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private carregarGeneralidades(): void {
    this.cotacaoService.listarGeneralidades().subscribe({
      next: (generalidades) => {
        this.generalidades = generalidades;
        (Object.keys(this.generalidadesForm.controls) as string[]).forEach((chave) =>
          this.generalidadesForm.removeControl(chave)
        );
        generalidades.forEach((item) =>
          this.generalidadesForm.addControl(
            `g${item.id}`,
            this.fb.control(this.textoEdicao(item.valor_generalidade))
          )
        );
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private carregarHistorico(): void {
    this.carregandoHistorico = true;
    const filtros = this.filtrosForm.getRawValue();
    this.cotacaoService
      .listarHistorico({
        cliente: filtros.cliente || undefined,
        rota_id: filtros.rota_id ?? undefined,
        pagina: this.historicoPagina,
        limite: this.historicoLimite,
      })
      .subscribe({
        next: (res) => {
          this.historico = res.dados;
          this.historicoTotal = res.total;
          this.carregandoHistorico = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregandoHistorico = false;
          this.cdr.markForCheck();
        },
      });
  }
}
