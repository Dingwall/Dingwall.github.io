import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-wood-project-card',
  templateUrl: './wood-project-card.component.html',
  styleUrls: ['./wood-project-card.component.scss']
})
export class WoodProjectCardComponent implements OnInit {

  @Input() project: any;

  constructor() { }

  ngOnInit(): void {
  }

}
