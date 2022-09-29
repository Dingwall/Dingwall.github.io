import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-projectwyvern',
  templateUrl: './projectwyvern.component.html',
  styleUrls: ['./projectwyvern.component.scss']
})
export class ProjectwyvernComponent implements OnInit {

  posts = [
    "./assets/projectwyvern/blog/2021-01-27-intro.markdown",
    "./assets/projectwyvern/blog/2021-02-04-research.markdown",
    "./assets/projectwyvern/blog/2021-02-10-prototyping.markdown",
    "./assets/projectwyvern/blog/2021-02-17-week4.markdown",
    "./assets/projectwyvern/blog/2021-02-24-VR-research.markdown",
    "./assets/projectwyvern/blog/2021-03-03-VR-dev1.markdown",
    "./assets/projectwyvern/blog/2021-03-10-VR-dev2.markdown",
    "./assets/projectwyvern/blog/2021-03-17-VR-dev3.markdown",
    "./assets/projectwyvern/blog/2021-03-24-VR-dev4.markdown",
    "./assets/projectwyvern/blog/2021-03-31-VR-dev5.markdown",
    "./assets/projectwyvern/blog/2021-04-07-VR-dev6.markdown",
    "./assets/projectwyvern/blog/2021-04-14-VR-dev7.markdown",
    "./assets/projectwyvern/blog/2021-04-21-VR-final.markdown",
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
