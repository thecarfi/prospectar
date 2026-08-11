import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgFor } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { SegmentosService } from '../core/services/segmentos.service';
import { Segmento } from '../core/models';

@Component({
  selector: 'app-seletor-segmentos',
  imports: [
    NgFor,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatAutocompleteModule,
    MatChipsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Segmentos</mat-label>
      <mat-chip-grid #chipGrid>
        <mat-chip-row
          *ngFor="let segmento of selecionados(); trackBy: rastrear"
          (removed)="remover(segmento)"
        >
          <button matChipRemove [attr.aria-label]="'Remover ' + segmento.nome">
            <mat-icon>close</mat-icon>
          </button>
          {{ segmento.nome }}
        </mat-chip-row>
      </mat-chip-grid>
      <input
        [formControl]="buscaControl"
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        placeholder="Busque e selecione segmentos"
      />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="aoSelecionar($event.option.value)">
        <mat-option *ngFor="let segmento of opcoes; trackBy: rastrear" [value]="segmento">
          {{ segmento.nome }}
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: `
    :host {
      display: block;
    }
    :host mat-form-field {
      width: 100%;
    }
    :host mat-chip-row .mdc-evolution-chip__cell--trailing {
      order: -1;
    }
  `,
})
export class SeletorSegmentosComponent implements OnInit {
  private readonly segmentosService = inject(SegmentosService);

  @Input() control!: FormControl<Segmento[] | null>;

  readonly buscaControl = new FormControl('');
  private readonly termo = toSignal(this.buscaControl.valueChanges, {
    initialValue: '',
  });

  private readonly segmentos = signal<Segmento[]>([]);
  readonly selecionados = signal<Segmento[]>([]);

  ngOnInit(): void {
    this.selecionados.set(this.control.value ?? []);
    this.control.valueChanges.subscribe((valor) =>
      this.selecionados.set(valor ?? [])
    );
    this.carregar();
  }

  get opcoes(): Segmento[] {
    const termo = (this.termo() ?? '').toLowerCase().trim();
    const atuais = this.selecionados();
    return this.segmentos().filter(
      (s) =>
        !atuais.some((x) => x.id === s.id) &&
        (!termo || s.nome.toLowerCase().includes(termo))
    );
  }

  private carregar(): void {
    this.segmentosService.listar().subscribe({
      next: (lista) => this.segmentos.set(lista),
    });
  }

  aoSelecionar(segmento: Segmento): void {
    const atual = this.control.value ?? [];
    if (atual.some((s) => s.id === segmento.id)) {
      return;
    }
    this.control.setValue([...atual, segmento]);
    this.buscaControl.setValue('');
  }

  remover(segmento: Segmento): void {
    const atual = this.control.value ?? [];
    this.control.setValue(atual.filter((s) => s.id !== segmento.id));
  }

  rastrear(_: number, segmento: Segmento): number {
    return segmento.id;
  }
}
