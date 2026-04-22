import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-keyword-filter',
  templateUrl: './keyword-filter.component.html',
  styleUrls: ['./keyword-filter.component.scss']
})
export class KeywordFilterComponent implements OnInit {
  @Input() control: UntypedFormControl;  

  constructor() { }

  ngOnInit() {
    if (!this.control){
      this.control = new UntypedFormControl();
    }
  }

  keywordClear(){
    this.control.setValue('');
  }

  onlyNubersAndLetters(e) {
    var key = e.keyCode || e.which,
      tecla = String.fromCharCode(key).toLowerCase(),
      letras = " áéíóúabcdefghijklmnñopqrstuvwxyz1234567890",
      especiales = [8, 39, 46],
      tecla_especial = false;

    for (var i in especiales) {
      if (key == especiales[i]) {
        tecla_especial = true;
        break;
      }
    }

    if (letras.indexOf(tecla) == -1 && !tecla_especial) {
      return false;
    }
  }

}
