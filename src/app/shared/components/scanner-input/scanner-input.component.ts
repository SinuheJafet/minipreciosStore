import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-scanner-input',
  templateUrl: './scanner-input.component.html',
  styleUrls: ['./scanner-input.component.scss'],
})
export class ScannerInputComponent {
  @Input() value = '';
  @Input() placeholder = 'Escanea o busca...';
  @Input() error = '';
  @Input() compact = false;
  @Input() hint = 'Conecta un lector USB y escanea directamente aqui';

  @Output() valueChange = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<void>();
  @Output() focusInput = new EventEmitter<void>();
  @Output() blurInput = new EventEmitter<void>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }

  clear(): void {
    this.valueChange.emit('');
  }
}
