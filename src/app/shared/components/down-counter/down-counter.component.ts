import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';


@Component({
  selector: 'app-down-counter',
  templateUrl: './down-counter.component.html',
  styleUrls: ['./down-counter.component.scss']
})
export class DownCounterComponent implements OnInit, OnChanges {

  @Input() intervalTime: number = 60000;
  @Input() resetKey: number = 0;

  @Output('downCounterFn') downCounterFn: EventEmitter<void> = new EventEmitter();

  intervalId: any;
  downCounter: any;

  constructor() { }


  ngOnInit(): void {
    this.startCounter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetKey'] && !changes['resetKey'].firstChange) {
      this.restartCounter();
    }
  }

  startCounter() {
    this.downCounter = Math.ceil(this.intervalTime / 1000);
    this.clearCounter();
    this.intervalId = setInterval(() => {
      if (this.downCounter > 0) {
        this.downCounter--;
      } else {
        this.downCounter = Math.ceil(this.intervalTime / 1000);
        this.downCounterFn.emit();
      }
    }, 1000);
  }

  restartCounter() {
    this.startCounter();
  }

  clearCounter() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ngOnDestroy(): void {
    this.clearCounter();
  }

}
