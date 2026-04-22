import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';

@Component({
  selector: 'side-container',
  templateUrl: './side-container.component.html',
  styleUrls: ['./side-container.component.scss'],
  animations: fuseAnimations
})
export class SideContainerComponent implements OnInit, AfterViewInit {

  @ViewChild('sideContent') sideContent;
  @Input() showHeader: boolean = true;
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() tooltip:string = 'Regresar';

  @Output() backEvent: EventEmitter<any> = new EventEmitter();

  showBackButton: boolean = false;

  shows = {
    sideContent: false
  };

  constructor(
    private cdRef:ChangeDetectorRef
  ) { }


  ngOnInit() {
    this.showBackButton = this.backEvent.observers.length > 0;
  }

  ngAfterViewInit(): void {
    this.shows.sideContent = this.sideContent && this.sideContent.nativeElement && this.sideContent.nativeElement.children.length > 0;
    this.cdRef.detectChanges();
  }

  back(){
    this.backEvent.emit();
  }
}
