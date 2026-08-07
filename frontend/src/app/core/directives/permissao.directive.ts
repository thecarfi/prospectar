import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appPermissao]',
  standalone: true,
})
export class PermissaoDirective implements OnInit {
  @Input('appPermissao') permissao = '';

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    if (!this.auth.temPermissao(this.permissao)) {
      this.element.nativeElement.style.display = 'none';
    }
  }
}
