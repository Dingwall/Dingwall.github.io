import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss']
})
export class ProjectCardComponent implements OnInit {

  @Input() project: any;

  constructor() {
    console.log(this.project)
  }

  ngOnInit(): void {
  }

  gotToLink(link: string) {
    window.open(link, "_blank");
  }

}
