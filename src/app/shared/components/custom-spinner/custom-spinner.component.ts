import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-custom-spinner',
  templateUrl: './custom-spinner.component.html',
  styleUrls: ['./custom-spinner.component.scss']
})
export class CustomSpinnerComponent {

  @Input() isLoading: boolean = true; 
  @Input() message: string = "Cargando..."; 

  squares = Array(4);

}
