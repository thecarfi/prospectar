import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CotacaoService } from '../../core/services/cotacao.service';
import { GeneralidadeCotacao, RotaCotacao } from '../../core/models';
import { formatarDecimal, formatarMoeda, lerDecimal } from '../../core/utils/formato';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import {
  RotaCotacaoFormDialogComponent,
  RotaCotacaoFormResult,
} from './rota-cotacao-form-dialog.component';

const ROTULOS_GENERALIDADES: Record<string, string> = {
  seguro: 'Seguro',
  gris: 'GRIS',
  pedagio: 'Pedágio',
  sec_cat: 'SEC/CAT',
  valor_quilo: 'Valor por quilo',
  frete_percentual: 'Frete percentual',
};

@Component({
  selector: 'app-cotacao-config',
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card>
      <mat-card-content class="table-wrap">
        <div class="secao-topo">
          <h2>Rotas</h2>
          <button mat-flat-button color="primary" (click)="novaRota()">
            <mat-icon>add</mat-icon>
            Nova rota
          </button>
        </div>

        <mat-progress-bar *ngIf="carregandoRotas" mode="indeterminate"></mat-progress-bar>

        <table mat-table [dataSource]="rotas" class="mat-elevation-z0">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Rota</th>
            <td mat-cell *matCellDef="let rota">{{ rota.nome }}</td>
          </ng-container>
          <ng-container matColumnDef="icms">
            <th mat-header-cell *matHeaderCellDef>ICMS</th>
            <td mat-cell *matCellDef="let rota">{{ formatarIcms(rota.icms) }}</td>
          </ng-container>
          <ng-container matColumnDef="frete_minimo">
            <th mat-header-cell *matHeaderCellDef>Frete mínimo</th>
            <td mat-cell *matCellDef="let rota">{{ formatarMoeda(rota.frete_minimo) }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let rota" class="acoes-cell">
              <button mat-icon-button matTooltip="Editar" (click)="editarRota(rota)">
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                matTooltip="Excluir"
                (click)="excluirRota(rota)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunasRotas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunasRotas"></tr>
        </table>
        <p *ngIf="!carregandoRotas && rotas.length === 0" class="empty">
          Nenhuma rota cadastrada.
        </p>
      </mat-card-content>
    </mat-card>

    <mat-card class="generalidades">
      <mat-card-content class="table-wrap">
        <h2>Generalidades</h2>
        <p class="ajuda">
          Os parâmetros são fixos; é possível apenas alterar os valores.
        </p>

        <mat-progress-bar
          *ngIf="carregandoGeneralidades"
          mode="indeterminate"
        ></mat-progress-bar>

        <form [formGroup]="formularioGeneralidades">
          <table mat-table [dataSource]="generalidades" class="mat-elevation-z0">
            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef>Generalidade</th>
              <td mat-cell *matCellDef="let item">
                {{ rotuloGeneralidade(item.tipo_generalidade) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="valor">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let item">
                <mat-form-field appearance="outline" class="campo-valor">
                  <input matInput [formControlName]="'g' + item.id" inputmode="decimal" />
                </mat-form-field>
              </td>
            </ng-container>
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let item" class="acoes-cell">
                <button
                  mat-flat-button
                  color="primary"
                  matTooltip="Salvar valor"
                  (click)="salvarGeneralidade(item)"
                >
                  Salvar
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="colunasGeneralidades"></tr>
            <tr mat-row *matRowDef="let row; columns: colunasGeneralidades"></tr>
          </table>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
    }
    .secao-topo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .secao-topo h2,
    .table-wrap h2 {
      margin: 0 0 8px;
      font-size: 18px;
    }
    .acoes-cell {
      text-align: right;
      white-space: nowrap;
    }
    .campo-valor {
      width: 160px;
      margin-top: 4px;
    }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
    .ajuda {
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
      margin: 0 0 8px;
    }
    .generalidades {
      margin-top: 16px;
    }
  `,
})
export class CotacaoConfigComponent implements OnInit {
  private readonly cotacaoService = inject(CotacaoService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  rotas: RotaCotacao[] = [];
  generalidades: GeneralidadeCotacao[] = [];
  carregandoRotas = false;
  carregandoGeneralidades = false;

  readonly colunasRotas = ['nome', 'icms', 'frete_minimo', 'acoes'];
  readonly colunasGeneralidades = ['tipo', 'valor', 'acoes'];

  readonly formularioGeneralidades = this.fb.group({});

  ngOnInit(): void {
    this.carregarRotas();
    this.carregarGeneralidades();
  }

  formatarMoeda(valor: number | null | undefined): string {
    return formatarMoeda(valor);
  }

  formatarIcms(valor: number): string {
    return `${formatarDecimal(valor * 100, 2)}%`;
  }

  rotuloGeneralidade(tipo: string): string {
    return ROTULOS_GENERALIDADES[tipo] ?? tipo;
  }

  novaRota(): void {
    const ref = this.dialog.open(RotaCotacaoFormDialogComponent, {
      width: '440px',
      data: {},
    });
    ref.afterClosed().subscribe((valor: RotaCotacaoFormResult | undefined) => {
      if (!valor) {
        return;
      }
      this.cotacaoService.criarRota(valor).subscribe({
        next: () => {
          this.snackBar.open('Rota criada.', 'Fechar', { duration: 3000 });
          this.carregarRotas();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  editarRota(rota: RotaCotacao): void {
    const ref = this.dialog.open(RotaCotacaoFormDialogComponent, {
      width: '440px',
      data: { rota },
    });
    ref.afterClosed().subscribe((valor: RotaCotacaoFormResult | undefined) => {
      if (!valor) {
        return;
      }
      this.cotacaoService.atualizarRota(rota.id, valor).subscribe({
        next: () => {
          this.snackBar.open('Rota atualizada.', 'Fechar', { duration: 3000 });
          this.carregarRotas();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  excluirRota(rota: RotaCotacao): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Excluir rota',
        mensagem: `Deseja realmente excluir a rota "${rota.nome}"? Essa ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
      },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }
      this.cotacaoService.excluirRota(rota.id).subscribe({
        next: () => {
          this.snackBar.open('Rota excluída.', 'Fechar', { duration: 3000 });
          this.carregarRotas();
        },
        error: () => this.cdr.markForCheck(),
      });
    });
  }

  salvarGeneralidade(item: GeneralidadeCotacao): void {
    const controle = this.formularioGeneralidades.get(`g${item.id}`);
    const valor = lerDecimal(controle?.value);
    if (!Number.isFinite(valor) || valor < 0) {
      this.snackBar.open('Informe um valor válido.', 'Fechar', { duration: 3000 });
      return;
    }
    this.cotacaoService.atualizarGeneralidade(item.id, valor).subscribe({
      next: () => {
        this.snackBar.open('Generalidade atualizada.', 'Fechar', { duration: 3000 });
        this.carregarGeneralidades();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private carregarRotas(): void {
    this.carregandoRotas = true;
    this.cotacaoService.listarRotas().subscribe({
      next: (rotas) => {
        this.rotas = rotas;
        this.carregandoRotas = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregandoRotas = false;
        this.cdr.markForCheck();
      },
    });
  }

  private carregarGeneralidades(): void {
    this.carregandoGeneralidades = true;
    this.cotacaoService.listarGeneralidades().subscribe({
      next: (generalidades) => {
        this.generalidades = generalidades;
        this.formularioGeneralidades.reset();
        generalidades.forEach((item) => {
          this.formularioGeneralidades.addControl(
            `g${item.id}`,
            this.fb.control(String(item.valor_generalidade).replace('.', ','))
          );
        });
        this.carregandoGeneralidades = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregandoGeneralidades = false;
        this.cdr.markForCheck();
      },
    });
  }
}
