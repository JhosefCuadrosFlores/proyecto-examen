import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ComedorConfig {
  nombreComedor: string;
  horario: string;
  direccion: string;
  logoUrl: string;
}

const STORAGE_KEY = 'comedor_upeu_config';

const DEFAULT_CONFIG: ComedorConfig = {
  nombreComedor: 'Comedor UPeU',
  horario: '07:00 - 20:00',
  direccion: 'Universidad Peruana Unión, Carretera Central km. 18.5',
  logoUrl: ''
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private configSubject = new BehaviorSubject<ComedorConfig>(this.load());
  config$ = this.configSubject.asObservable();

  getConfig(): ComedorConfig {
    return { ...this.configSubject.value };
  }

  saveConfig(config: ComedorConfig): void {
    const normalized: ComedorConfig = {
      nombreComedor: config.nombreComedor?.trim() || DEFAULT_CONFIG.nombreComedor,
      horario: config.horario?.trim() || DEFAULT_CONFIG.horario,
      direccion: config.direccion?.trim() || DEFAULT_CONFIG.direccion,
      logoUrl: config.logoUrl || ''
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    this.configSubject.next(normalized);
  }

  private load(): ComedorConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      const parsed = JSON.parse(raw) as Partial<ComedorConfig>;
      return {
        ...DEFAULT_CONFIG,
        ...parsed
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }
}
