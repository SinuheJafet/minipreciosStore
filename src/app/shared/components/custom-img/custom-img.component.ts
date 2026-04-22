import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'custom-img',
  templateUrl: './custom-img.component.html',
  styleUrls: ['./custom-img.component.scss'],
})
export class CustomImgComponent implements OnInit {
  @Input() src: string;
  @Input() commonSourceUrl: string;

  completeSrc : string;
  loading: boolean;

  constructor() {
  }
  
  ngOnInit() {
    if (this.src && this.src != '')
      this.loading = true;
    if (this.commonSourceUrl)
      this.completeSrc = `${this.commonSourceUrl}${this.src}`;
    else
      this.completeSrc = this.src;
  }

  onLoad(){
    this.loading = false;
  }

}
