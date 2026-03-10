import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-woodworking',
  templateUrl: './woodworking.component.html',
  styleUrls: ['./woodworking.component.scss']
})
export class WoodworkingComponent implements OnInit {
  
  projectTemplate = {
    name: "",
    description: "",
    image: "",
    woodtype: ""
  }

  llcarousel = 3;
  lcarousel = 4;
  carouselIndex = 0;
  rcarousel = 1;
  rrcarousel = 2;

  // What is a better datatype for this? Something would make it faster

  projects = [
    "beespoon.png",
    "treeman.png",
    "worldmug.png",
    "bench.png",
    "bird2.png",
    "pointysanta.png",
    "santa1.png",
    "eagle.png",
    "espressospoon.JPG",
    "flower.png",
    "loversknot.png",
    "mallet.png",
    "mug1.png",
    "snake.png",
    "bird1.png",
    "crookedspoon.png",
  ]

  constructor() {
    this.llcarousel = this.projects.length - 2;
    this.lcarousel = this.projects.length - 1;
    this.carouselIndex = 0;
    this.rcarousel = 1;
    this.rrcarousel = 2;
  }

  ngOnInit(): void {
  }

  incrementCarousel() {
    this.llcarousel = this.incrementCarouselValue(this.llcarousel);
    this.lcarousel = this.incrementCarouselValue(this.lcarousel);
    this.carouselIndex = this.incrementCarouselValue(this.carouselIndex);
    this.rcarousel = this.incrementCarouselValue(this.rcarousel);
    this.rrcarousel = this.incrementCarouselValue(this.rrcarousel);
  }

  decrementCarousel() {
    this.llcarousel = this.decrementCarouselValue(this.llcarousel);
    this.lcarousel = this.decrementCarouselValue(this.lcarousel);
    this.carouselIndex = this.decrementCarouselValue(this.carouselIndex);
    this.rcarousel = this.decrementCarouselValue(this.rcarousel);
    this.rrcarousel = this.decrementCarouselValue(this.rrcarousel);
  }

  incrementCarouselValue(value: any) {
    if (value == this.projects.length - 1) {
      return 0;
    } else {
      return value + 1;
    }
  }

  decrementCarouselValue(value: any) {
    if (value == 0) {
      return this.projects.length - 1;
    } else {
      return value - 1;
    }
  }

}
