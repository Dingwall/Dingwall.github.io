import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-skump',
  templateUrl: './skump.component.html',
  styleUrls: ['./skump.component.scss']
})
export class SkumpComponent implements OnInit {

    url = "";

  constructor() { }

  ngOnInit(): void {
  }

  openLink() {
    const index = this.url.indexOf('?');
    this.url = index === -1 ? this.url : this.url.substring(0, index);
    if (this.url) {
        window.open(this.url, '_blank');
    }
  }

}
