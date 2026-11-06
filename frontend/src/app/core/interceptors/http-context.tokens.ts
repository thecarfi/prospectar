import { HttpContextToken } from '@angular/common/http';

export const SILENCIAR_ERRO_HTTP = new HttpContextToken<boolean>(() => false);
