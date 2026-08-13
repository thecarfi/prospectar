import { Component, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CnaeService } from '../../core/services/cnae.service';
import { Cnae } from '../../core/models';

@Component({
  selector: 'app-cnae-consulta',
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
  ],
  template: `
    <mat-card class="toolbar-card">
      <mat-card-content>
        <form [formGroup]="formulario" (ngSubmit)="buscar()" class="toolbar">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Subclasse</mat-label>
            <input matInput formControlName="subclasse" placeholder="Código da subclasse" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field grow">
            <mat-label>Descrição da subclasse</mat-label>
            <input matInput formControlName="descricao_subclasse" placeholder="Descrição da subclasse" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Seção</mat-label>
            <input matInput formControlName="secao" placeholder="Letra da seção" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field grow">
            <mat-label>Descrição da seção</mat-label>
            <input matInput formControlName="descricao_secao" placeholder="Descrição da seção" />
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit">Filtrar</button>
          <button mat-button type="button" (click)="limpar()">Limpar</button>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card>
      <mat-card-content class="table-wrap">
        <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>
        <table mat-table [dataSource]="cnaes" class="mat-elevation-z0">
          <ng-container matColumnDef="secao">
            <th mat-header-cell *matHeaderCellDef>Seção</th>
            <td mat-cell *matCellDef="let cnae">{{ cnae.secao }}</td>
          </ng-container>
          <ng-container matColumnDef="descricao_secao">
            <th mat-header-cell *matHeaderCellDef>Descrição da seção</th>
            <td mat-cell *matCellDef="let cnae">{{ cnae.descricao_secao }}</td>
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

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <p *ngIf="!carregando && cnaes.length === 0" class="empty">Nenhum CNAE encontrado.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .toolbar-card {
      margin-bottom: 16px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .filter-field {
      min-width: 160px;
    }
    .filter-field.grow {
      flex: 1;
    }
    .table-wrap {
      padding: 8px 16px 16px;
      position: relative;
      overflow-x: auto;
    }
    .empty {
      color: rgba(0, 0, 0, 0.5);
      text-align: center;
      padding: 24px;
    }
  `,
})
export class CnaeConsultaComponent implements OnInit {
  private readonly cnaeService = inject(CnaeService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formulario = this.fb.nonNullable.group({
    subclasse: [''],
    descricao_subclasse: [''],
    secao: [''],
    descricao_secao: [''],
  });

  cnaes: Cnae[] = [];
  carregando = false;
  readonly colunas = [
    'secao',
    'descricao_secao',
    'divisao',
    'grupo',
    'classe',
    'subclasse',
    'descricao_subclasse',
  ];

  ngOnInit(): void {
    this.carregar();
  }

  buscar(): void {
    this.carregar();
  }

  limpar(): void {
    this.formulario.reset();
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    const { subclasse, descricao_subclasse, secao, descricao_secao } =
      this.formulario.getRawValue();
    this.cnaeService
      .listar({
        subclasse: subclasse || undefined,
        descricao_subclasse: descricao_subclasse || undefined,
        secao: secao || undefined,
        descricao_secao: descricao_secao || undefined,
      })
      .subscribe({
        next: (res) => {
          this.cnaes = res;
          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregando = false;
          this.cdr.markForCheck();
        },
      });
  }
}
