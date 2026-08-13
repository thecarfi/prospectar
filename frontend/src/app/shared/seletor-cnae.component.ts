import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { CnaeService } from '../core/services/cnae.service';
import { Cnae, ClienteCnae } from '../core/models';

@Component({
  selector: 'app-seletor-cnae',
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatTableModule,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cnae-section">
      <div class="section-title">CNAE</div>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Buscar CNAE para adicionar</mat-label>
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
          <mat-option
            *ngFor="let cnae of opcoes; trackBy: rastrear"
            [value]="cnae"
          >
            {{ cnae.subclasse }} - {{ cnae.descricao_subclasse }}
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>

      <table
        mat-table
        [dataSource]="selecionados()"
        class="mat-elevation-z0 cnae-table"
        *ngIf="selecionados().length > 0"
      >
        <ng-container matColumnDef="secao">
          <th mat-header-cell *matHeaderCellDef>Seção</th>
          <td mat-cell *matCellDef="let cnae">{{ cnae.secao }}</td>
        </ng-container>
        <ng-container matColumnDef="divisao">
          <th mat-header-cell *matHeaderCellDef>Divisão</th>
          <td mat-cell *matCellDef="let cnae">{{ cnae.divisao }}</td>
        </ng-container>
        <ng-container matColumnDef="grupo">
          <th mat-header-cell *matHeaderCellDef>Grupo</th>
          <td mat-cell *matCellDef="let cnae">{{ cnae.grupo }}</td>
        </ng-container>
        <ng-container matColumnDef="classe">
          <th mat-header-cell *matHeaderCellDef>Classe</th>
          <td mat-cell *matCellDef="let cnae">{{ cnae.classe }}</td>
        </ng-container>
        <ng-container matColumnDef="subclasse">
          <th mat-header-cell *matHeaderCellDef>Subclasse</th>
          <td mat-cell *matCellDef="let cnae">{{ cnae.subclasse }}</td>
        </ng-container>
        <ng-container matColumnDef="descricao_subclasse">
          <th mat-header-cell *matHeaderCellDef>Descrição da subclasse</th>
          <td mat-cell *matCellDef="let cnae">{{ cnae.descricao_subclasse }}</td>
        </ng-container>
        <ng-container matColumnDef="principal">
          <th mat-header-cell *matHeaderCellDef>Principal</th>
          <td mat-cell *matCellDef="let cnae">
            <button
              mat-icon-button
              [matTooltip]="cnae.principal ? 'Principal' : 'Marcar como principal'"
              (click)="definirPrincipal(cnae)"
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
            <button
              mat-icon-button
              color="warn"
              matTooltip="Remover CNAE"
              (click)="remover(cnae)"
            >
              <mat-icon>close</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="colunas"></tr>
        <tr mat-row *matRowDef="let row; columns: colunas"></tr>
      </table>
      <p *ngIf="selecionados().length === 0" class="cnae-empty">
        Nenhum CNAE vinculado.
      </p>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .cnae-section {
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      padding-top: 8px;
      margin-top: 8px;
    }
    .section-title {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin: 8px 0 4px;
    }
    .full {
      width: 100%;
    }
    .cnae-table {
      width: 100%;
      margin-top: 8px;
    }
    .principal-icon {
      color: #f9a825;
    }
    .acoes-cell {
      width: 48px;
      text-align: right;
    }
    .cnae-empty {
      color: rgba(0, 0, 0, 0.6);
      font-size: 13px;
      margin: 8px 0 0;
    }
  `,
})
export class SeletorCnaeComponent implements OnInit {
  private readonly cnaeService = inject(CnaeService);

  @Input() control!: FormControl<ClienteCnae[] | null>;

  readonly colunas = [
    'secao',
    'divisao',
    'grupo',
    'classe',
    'subclasse',
    'descricao_subclasse',
    'principal',
    'acoes',
  ];

  readonly buscaControl = new FormControl('');
  private readonly termo = toSignal(this.buscaControl.valueChanges, {
    initialValue: '',
  });

  private readonly catalogo = signal<Cnae[]>([]);
  readonly selecionados = signal<ClienteCnae[]>([]);

  ngOnInit(): void {
    this.selecionados.set(this.control.value ?? []);
    this.control.valueChanges.subscribe((valor) =>
      this.selecionados.set(valor ?? [])
    );
    this.carregar();
  }

  get opcoes(): Cnae[] {
    const termo = (this.termo() ?? '').toLowerCase().trim();
    const atuais = this.selecionados();
    const resultado = this.catalogo().filter((c) => {
      if (atuais.some((x) => x.subclasse === c.subclasse)) {
        return false;
      }
      if (!termo) {
        return true;
      }
      return [
        c.subclasse,
        c.descricao_subclasse,
        c.classe,
        c.descricao_classe,
      ].some((v) => v.toLowerCase().includes(termo));
    });
    return resultado.slice(0, 50);
  }

  private carregar(): void {
    this.cnaeService.listar().subscribe({
      next: (lista) => this.catalogo.set(lista),
    });
  }

  aoSelecionar(cnae: Cnae): void {
    const atual = this.control.value ?? [];
    if (atual.some((c) => c.subclasse === cnae.subclasse)) {
      return;
    }
    this.control.setValue([
      ...atual,
      { ...cnae, principal: atual.length === 0 },
    ]);
    this.buscaControl.setValue('');
  }

  definirPrincipal(cnae: ClienteCnae): void {
    const atual = this.control.value ?? [];
    if (atual.some((c) => c.subclasse === cnae.subclasse && c.principal)) {
      return;
    }
    this.control.setValue(
      atual.map((c) => ({ ...c, principal: c.subclasse === cnae.subclasse }))
    );
  }

  remover(cnae: ClienteCnae): void {
    const atual = this.control.value ?? [];
    const restante = atual.filter((c) => c.subclasse !== cnae.subclasse);
    if (restante.length > 0 && cnae.principal && !restante.some((c) => c.principal)) {
      restante[0] = { ...restante[0], principal: true };
    }
    this.control.setValue(restante);
  }

  rastrear(_: number, cnae: Cnae): string {
    return cnae.subclasse;
  }
}
