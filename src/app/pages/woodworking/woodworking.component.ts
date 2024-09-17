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
    {
      name: "Bee Spoon",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis.",
      image: "./assets/woodworking/beespoon.png",
      woodtype: "Basswood",
    },
    {
      name: "Low Roman Workbench",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/bench.png",
      woodtype: "Basswood"
    },
    {
      name: "Comfort Bird 1",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/bird1.png",
      woodtype: "Unknown"
    },
    {
      name: "Comfort Bird 3",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/bird2.png",
      woodtype: "Basswood"
    },
    {
      name: "Crooked Spoon",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/crookedspoon.png",
      woodtype: "Basswood"
    },
    {
      name: "Eagle", // no name test
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/eagle.png",
      woodtype: "Pine"
    },
    {
      name: "Espresso Spoon",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis. Aliquam convallis lectus id felis cursus, a congue lacus malesuada. Integer eget ligula fermentum, consequat lorem eget, ultrices felis. Donec nec nisi ut elit laoreet blandit. Sed at convallis dolor, non tincidunt quam. Vestibulum at lacus ac dolor vestibulum lobortis. Donec luctus vel nisi at fringilla. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis. Aliquam convallis lectus id felis cursus, a congue lacus malesuada. Integer eget ligula fermentum, consequat lorem eget, ultrices felis. Donec nec nisi ut elit laoreet blandit. Sed at convallis dolor, non tincidunt quam. Vestibulum at lacus ac dolor vestibulum lobortis. Donec luctus vel nisi at fringilla.",
      image: "./assets/woodworking/espressospoon.JPG",
      woodtype: "Spruce"
    },
    {
      name: "Rose",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/flower.png",
      woodtype: "Green"
    },
    {
      name: "testing no images",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "",
      woodtype: "Cinnamon"
    },
    {
      name: "Lovers Knot",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/loversknot.png",
      woodtype: "Purple"
    },
    {
      name: "Mallet",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/mallet.png",
      woodtype: "White"
    },
    {
      name: "Mug 1",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/mug1.png",
      woodtype: "White"
    },
    {
      name: "Pointy Santa",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/pointysanta.png",
      woodtype: "White"
    },
    {
      name: "Round Santa",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/santa1.png",
      woodtype: "White"
    },
    {
      name: "Jormungandr",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/snake.png",
      woodtype: "Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree ",
    },
    {
      name: "Wood Spirit",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/treeman.png",
      woodtype: "White"
    },
    {
      name: "Mug of Endless Draught",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/worldmug.png",
      woodtype: "White"
    },
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
