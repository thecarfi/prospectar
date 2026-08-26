import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MonitoraRondoniaService,
} from '../../core/services/monitora-rondonia.service';
import { DocumentoEmitido } from '../../core/models';
import { PermissaoDirective } from '../../core/directives/permissao.directive';

@Component({
  selector: 'app-monitora-rondonia',
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    PermissaoDirective,
  ],
  template: `
    <div class="header">
      <h1>Monitora Rondônia</h1>
    </div>

    <mat-card class="filter-card">
      <mat-card-content>
        <form [formGroup]="filtros" (ngSubmit)="buscar()" class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Filial destino</mat-label>
            <mat-select formControlName="filial_destino">
              <mat-option [value]="null">Todas</mat-option>
              <mat-option *ngFor="let f of filiais" [value]="f">{{ f }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cidade destino</mat-label>
            <mat-select formControlName="cidade_destinatario">
              <mat-option [value]="null">Todas</mat-option>
              <mat-option *ngFor="let c of cidades" [value]="c">{{ c }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-doc">
            <mat-label>Documento</mat-label>
            <input matInput formControlName="documento" placeholder="Documento exato" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data manifesto</mat-label>
            <input matInput formControlName="data_manifesto" type="date" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>É Vaptlog</mat-label>
            <mat-select formControlName="eh_vaptlog">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option value="S">Sim</mat-option>
              <mat-option value="N">Não</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="filter-actions">
            <button mat-flat-button color="primary" type="submit">Filtrar</button>
            <button mat-button type="button" (click)="limpar()">Limpar</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content class="table-wrap">
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z0">
          <ng-container matColumnDef="filial_destino">
            <th mat-header-cell *matHeaderCellDef>Filial destino</th>
            <td mat-cell *matCellDef="let d">{{ d.filial_destino }}</td>
          </ng-container>
          <ng-container matColumnDef="cidade_destinatario">
            <th mat-header-cell *matHeaderCellDef>Cidade destino</th>
            <td mat-cell *matCellDef="let d">{{ d.cidade_destinatario }}</td>
          </ng-container>
          <ng-container matColumnDef="documento">
            <th mat-header-cell *matHeaderCellDef>Documento</th>
            <td mat-cell *matCellDef="let d">{{ d.documento }}</td>
          </ng-container>
          <ng-container matColumnDef="emissao_ultimo_manifesto">
            <th mat-header-cell *matHeaderCellDef>Data manifesto</th>
            <td mat-cell *matCellDef="let d">
              {{ d.emissao_ultimo_manifesto ? (d.emissao_ultimo_manifesto | date: 'dd/MM/yyyy') : '' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="data_entrega">
            <th mat-header-cell *matHeaderCellDef>Data entrega</th>
            <td mat-cell *matCellDef="let d">
              {{ d.data_entrega ? (d.data_entrega | date: 'dd/MM/yyyy') : '' }}
              <span *ngIf="d.eh_data_entrega_editada === 'S'"
                    class="status-pill"
                    style="background: #eceff1; color: #616161; margin-left: 6px;">
                Editado
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="eh_vaptlog">
            <th mat-header-cell *matHeaderCellDef>É Vaptlog</th>
            <td mat-cell *matCellDef="let d">
              {{ d.eh_vaptlog === 'S' ? 'Sim' : 'Não' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              <button mat-icon-button matTooltip="Editar data de entrega"
                      appPermissao="monitora-rondonia:editar"
                      (click)="abrirEdicao(d)">
                <mat-icon>edit</mat-icon>
              </button>
              <button *ngIf="d.vaptlog_entrega === 'S' && d.eh_vaptlog === 'S'"
                      mat-icon-button matTooltip="Tirar da Vaptlog"
                      appPermissao="monitora-rondonia:editar"
                      (click)="toggleVaptlog(d, 'remover')">
                <mat-icon>backspace</mat-icon>
              </button>
              <button *ngIf="d.vaptlog_entrega === 'S' && d.eh_vaptlog === 'N'"
                      mat-icon-button matTooltip="Adicionar para Vaptlog"
                      appPermissao="monitora-rondonia:editar"
                      (click)="toggleVaptlog(d, 'adicionar')">
                <mat-icon>add_box</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && dataSource.data.length === 0" class="empty">
          Nenhum documento encontrado.
        </p>
        <mat-paginator
          *ngIf="dataSource.data.length > 0"
          [length]="total"
          [pageSize]="limite"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="naPagina($event)"
          [showFirstLastButtons]="true"
        >
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
    }
    .filter-card {
      margin-bottom: 16px;
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: baseline;
    }
    .filter-doc {
      min-width: 180px;
    }
    .filter-actions {
      display: flex;
      gap: 8px;
    }
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
    }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
    .status-pill {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dialog-form .full-width {
      width: 100%;
    }
  `,
})
export class MonitoraRondoniaComponent implements OnInit {
  private readonly service = inject(MonitoraRondoniaService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly filtros = this.fb.nonNullable.group({
    filial_destino: [null as string | null],
    cidade_destinatario: [null as string | null],
    documento: [''],
    data_manifesto: [''],
    eh_vaptlog: [null as string | null],
  });

  readonly colunas = [
    'filial_destino',
    'cidade_destinatario',
    'documento',
    'emissao_ultimo_manifesto',
    'data_entrega',
    'eh_vaptlog',
    'acoes',
  ];

  filiais: string[] = [];
  cidades: string[] = [];
  dataSource = new MatTableDataSource<DocumentoEmitido>();
  carregando = false;

  total = 0;
  pagina = 1;
  limite = 10;

  ngOnInit(): void {
    this.service.obterFiltros().subscribe((meta) => {
      this.filiais = meta.filiais;
      this.cidades = meta.cidades;
      this.cdr.markForCheck();
    });
    this.carregar();
  }

  buscar(): void {
    this.pagina = 1;
    this.carregar();
  }

  limpar(): void {
    this.filtros.reset();
    this.buscar();
  }

  naPagina(evento: PageEvent): void {
    this.pagina = evento.pageIndex + 1;
    this.limite = evento.pageSize;
    this.carregar();
  }

  abrirEdicao(documento: DocumentoEmitido): void {
    const dialogRef = this.dialog.open(MonitoraRondoniaEditDialogComponent, {
      width: '480px',
      data: { documento },
    });

    dialogRef.afterClosed().subscribe((resultado: string | undefined) => {
      if (!resultado) return;
      this.service
        .salvarDataEntrega(documento.documento!, {
          data_entrega: resultado,
          eh_data_entrega_editada: documento.eh_data_entrega_editada || 'N',
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Data de entrega atualizada.', 'Fechar', {
              duration: 3000,
            });
            this.carregar();
          },
          error: (err) => {
            this.snackBar.open(
              err.error?.message || 'Erro ao salvar.',
              'Fechar',
              { duration: 5000 }
            );
          },
        });
    });
  }

  toggleVaptlog(documento: DocumentoEmitido, acao: 'adicionar' | 'remover'): void {
    this.service.toggleVaptlog(documento.documento!, acao).subscribe({
      next: () => {
        const msg = acao === 'adicionar'
          ? 'Adicionado à Vaptlog.'
          : 'Removido da Vaptlog.';
        this.snackBar.open(msg, 'Fechar', { duration: 3000 });
        this.carregar();
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Erro ao atualizar Vaptlog.',
          'Fechar',
          { duration: 5000 }
        );
      },
    });
  }

  private carregar(): void {
    this.carregando = true;
    const f = this.filtros.getRawValue();
    const filtroValor = {
      filial_destino: f.filial_destino ?? undefined,
      cidade_destinatario: f.cidade_destinatario ?? undefined,
      documento: f.documento || undefined,
      data_manifesto: f.data_manifesto || undefined,
      eh_vaptlog: f.eh_vaptlog ?? undefined,
    };
    this.service.listar(filtroValor, this.pagina, this.limite).subscribe({
      next: (res) => {
        this.dataSource.data = res.dados;
        this.total = res.total;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.dataSource.data = [];
        this.total = 0;
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }
}

@Component({
  selector: 'app-monitora-rondonia-edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar Data de Entrega</h2>
    <mat-dialog-content>
      <form [formGroup]="formulario" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Filial destino</mat-label>
          <input matInput formControlName="filial_destino" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cidade destino</mat-label>
          <input matInput formControlName="cidade_destinatario" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Documento</mat-label>
          <input matInput formControlName="documento" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Data manifesto</mat-label>
          <input matInput formControlName="emissao_ultimo_manifesto" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Data entrega</mat-label>
          <input matInput type="date" formControlName="data_entrega" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>É Vaptlog</mat-label>
          <input matInput formControlName="eh_vaptlog" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="formulario.get('data_entrega')!.invalid"
              (click)="salvar()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width { width: 100%; }
    .dialog-form { display: flex; flex-direction: column; gap: 4px; }
  `,
})
export class MonitoraRondoniaEditDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<MonitoraRondoniaEditDialogComponent>
  );
  private readonly fb = inject(FormBuilder);

  readonly formulario: FormGroup = this.fb.nonNullable.group({
    filial_destino: [''],
    cidade_destinatario: [''],
    documento: [''],
    emissao_ultimo_manifesto: [''],
    data_entrega: ['', Validators.required],
    eh_vaptlog: [''],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly data: { documento: DocumentoEmitido }
  ) {
    const d = data.documento;
    this.formulario.patchValue({
      filial_destino: d.filial_destino || '',
      cidade_destinatario: d.cidade_destinatario || '',
      documento: d.documento || '',
      emissao_ultimo_manifesto: d.emissao_ultimo_manifesto || '',
      data_entrega: d.data_entrega || '',
      eh_vaptlog: d.eh_vaptlog || '',
    });

    this.formulario.get('filial_destino')!.disable();
    this.formulario.get('cidade_destinatario')!.disable();
    this.formulario.get('documento')!.disable();
    this.formulario.get('emissao_ultimo_manifesto')!.disable();
    this.formulario.get('eh_vaptlog')!.disable();
  }

  salvar(): void {
    const raw = this.formulario.getRawValue();
    this.dialogRef.close(raw.data_entrega);
  }
}
