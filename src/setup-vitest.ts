import '@analogjs/vite-plugin-angular/setup-vitest';
import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Inicializa o ecossistema de testes do Angular explicitamente para o Vitest
try {
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
  );
} catch {
  // Evita erros caso o ecossistema tente reinicializar em modo Watch
}

// O seu mock do BroadcastChannel que a tela de usuários precisa
globalThis.BroadcastChannel = class {
  postMessage() {}
  close() {}
  onmessage() {}
  onmessageerror() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
} as any;