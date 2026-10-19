import { Component, Inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CotacaoSalva } from '../../core/models';
import { formatarData, formatarDecimal, formatarMoeda } from '../../core/utils/formato';

interface ItemDetalhe {
  rotulo: string;
  valor: string;
}

interface GrupoDetalhe {
  titulo: string;
  itens: ItemDetalhe[];
}

export interface CotacaoDetalheData {
  cotacao: CotacaoSalva;
}

@Component({
  selector: 'app-cotacao-detalhe-dialog',
  imports: [
    NgFor,
    NgIf,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Detalhe da cotação #{{ data.cotacao.id }}</h2>
    <mat-dialog-content>
      <dl class="resumo">
        <div>
          <dt>Cliente</dt>
          <dd>{{ data.cotacao.cliente_texto || 'Não informado' }}</dd>
        </div>
        <div>
          <dt>Rota</dt>
          <dd>{{ data.cotacao.rota_nome }}</dd>
        </div>
        <div>
          <dt>Cotado por</dt>
          <dd>{{ data.cotacao.cotado_por_nome || '-' }}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{{ formatarData(data.cotacao.criado_em) }}</dd>
        </div>
      </dl>

      <section *ngFor="let grupo of grupos; let primeiro = first" class="grupo">
        <hr *ngIf="!primeiro" />
        <h3>{{ grupo.titulo }}</h3>
        <div class="itens">
          <div *ngFor="let item of grupo.itens" class="item">
            <span class="rotulo">{{ item.rotulo }}</span>
            <span class="valor">{{ item.valor }}</span>
          </div>
        </div>
      </section>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .resumo {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px 24px;
      margin: 0 0 8px;
    }
    .resumo dt {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    .resumo dd {
      margin: 2px 0 0;
      font-weight: 500;
    }
    .grupo {
      margin-top: 20px;
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
      gap: 10px 24px;
    }
    .item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .item .rotulo {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    .item .valor {
      font-weight: 500;
    }
  `,
})
export class CotacaoDetalheDialogComponent {
  readonly grupos: GrupoDetalhe[];

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: CotacaoDetalheData) {
    this.grupos = this.montarGrupos(data.cotacao);
  }

  formatarData(valor?: string | null): string {
    return formatarData(valor);
  }

  private montarGrupos(cotacao: CotacaoSalva): GrupoDetalhe[] {
    return [
      {
        titulo: 'Encomenda',
        itens: [
          {
            rotulo: 'Comprimento (m)',
            valor: formatarDecimal(cotacao.comprimento),
          },
          { rotulo: 'Largura (m)', valor: formatarDecimal(cotacao.largura) },
          { rotulo: 'Altura (m)', valor: formatarDecimal(cotacao.altura) },
          { rotulo: 'Valor NF', valor: formatarMoeda(cotacao.valor_nf) },
        ],
      },
      {
        titulo: 'Pesos',
        itens: [
          { rotulo: 'Peso cubado', valor: formatarDecimal(cotacao.peso_cubado) },
          {
            rotulo: 'Peso informado',
            valor: formatarDecimal(cotacao.peso),
          },
          {
            rotulo: 'Peso definido',
            valor: formatarDecimal(cotacao.peso_definido),
          },
        ],
      },
      {
        titulo: 'Generalidades',
        itens: [
          {
            rotulo: 'Seguro',
            valor: formatarMoeda(cotacao.seguro_valor),
          },
          { rotulo: 'GRIS', valor: formatarMoeda(cotacao.gris_valor) },
          {
            rotulo: 'Pedágio',
            valor: formatarMoeda(cotacao.pedagio_valor),
          },
          {
            rotulo: 'SEC/CAT',
            valor: formatarMoeda(cotacao.sec_cat_valor),
          },
        ],
      },
      {
        titulo: 'Tipos de frete',
        itens: [
          { rotulo: 'Frete peso', valor: formatarMoeda(cotacao.frete_peso) },
          {
            rotulo: 'Frete mínimo',
            valor: formatarMoeda(cotacao.frete_minimo_valor),
          },
          {
            rotulo: 'Frete percentual',
            valor: formatarMoeda(cotacao.frete_percentual_valor),
          },
        ],
      },
      {
        titulo: 'Resultado definido',
        itens: [
          { rotulo: 'Frete escolhido', valor: cotacao.frete_escolhido },
          {
            rotulo: 'Valor frete escolhido',
            valor: formatarMoeda(cotacao.valor_frete),
          },
          { rotulo: 'ICMS', valor: formatarMoeda(cotacao.icms_valor) },
          {
            rotulo: 'Valor generalidade',
            valor: formatarMoeda(cotacao.valor_generalidade),
          },
          {
            rotulo: 'Valor total',
            valor: formatarMoeda(cotacao.valor_total),
          },
        ],
      },
    ];
  }
}
