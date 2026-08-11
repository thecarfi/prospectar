import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { LocalizacaoService } from '../core/services/localizacao.service';
import { Municipio } from '../core/models';

@Component({
  selector: 'app-seletor-municipio',
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Estado</mat-label>
      <mat-select [formControl]="estadoControl" (selectionChange)="aoTrocarEstado()">
        <mat-option *ngIf="permitirVazio" [value]="''">Todos</mat-option>
        <mat-option *ngFor="let e of estados()" [value]="e.sigla">
          {{ e.sigla }} - {{ e.nome }}
        </mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Município</mat-label>
      <input
        matInput
        [matAutocomplete]="auto"
        [formControl]="buscaControl"
        placeholder="Busque pelo nome"
        [disabled]="!estadoControl.value"
      />
      <mat-icon matPrefix>search</mat-icon>
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="aoSelecionar($event.option.value)">
        <mat-option *ngIf="permitirVazio" [value]="0">Todos</mat-option>
        <mat-option *ngFor="let m of municipiosFiltrados" [value]="m.id">
          {{ m.nome }}
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class SeletorMunicipioComponent implements OnInit {
  readonly localizacao = inject(LocalizacaoService);

  @Input() estadoControl!: FormControl<string>;
  @Input() municipioControl!: FormControl<number | null>;
  @Input() permitirVazio = false;

  readonly buscaControl = new FormControl('');
  private readonly destroyRef = inject(DestroyRef);
  private readonly municipioIdSignal = signal<number | null | undefined>(
    undefined
  );

  private readonly efeito = effect(() => {
    this.localizacao.municipios();
    const id = this.municipioIdSignal();
    const municipio = this.localizacao.obterMunicipio(id);
    if (municipio && this.buscaControl.value !== municipio.nome) {
      this.buscaControl.setValue(municipio.nome);
    }
  });

  readonly estados = computed(() => this.localizacao.estados());

  private cacheLista = '';
  private cacheMunicipios: Municipio[] = [];

  get municipiosFiltrados(): Municipio[] {
    const uf = this.estadoControl.value;
    const termo = (this.buscaControl.value || '').toLowerCase();
    const chave = `${uf}|${termo}`;
    if (chave === this.cacheLista) {
      return this.cacheMunicipios;
    }
    this.cacheLista = chave;
    this.cacheMunicipios = this.localizacao
      .municipiosPorUf(uf)
      .filter((m) => (termo ? m.nome.toLowerCase().includes(termo) : true));
    return this.cacheMunicipios;
  }

  ngOnInit(): void {
    this.localizacao.carregar();
    this.municipioIdSignal.set(this.municipioControl.value);
    this.municipioControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.municipioIdSignal.set(valor));
  }

  aoSelecionar(id: number): void {
    if (id === 0) {
      this.municipioControl.setValue(null);
      this.buscaControl.setValue('');
      return;
    }
    const municipio = this.localizacao.obterMunicipio(id);
    this.municipioControl.setValue(id);
    this.buscaControl.setValue(municipio ? municipio.nome : '');
  }

  aoTrocarEstado(): void {
    this.municipioControl.setValue(null);
    this.buscaControl.setValue('');
  }

  municipioNome(m: Municipio): string {
    return m.nome;
  }
}
