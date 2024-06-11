import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-woodworking',
  templateUrl: './woodworking.component.html',
  styleUrls: ['./woodworking.component.scss']
})
export class WoodworkingComponent implements OnInit {

  toolList = [
    "Auger",
    "Axe",
    "Chisel",
    "Coping Saw",
    "Detail Knife",
    "Drill",
    "Gouge",
    "Hook Knife",
    "Kanna",
    "Pocket Knife",
    "Ryoba",
    "Sandpaper",
    "Sloyd Knife",
    "V-Gouge"
  ]

  finishList = [
    "Walnut Oil",
    "Half & Half",
    "Half & Half Dark",
    "None",
    "Milk Paint",
    "Acrylic Paint",
    "Town Talk Wax"
  ]
  // fill from what is used in projects
  woodtype = [] 

  projectTemplate = {
    name: "",
    tools: [],
    description: "",
    image: "",
    woodtype: "",
    finish: [],
    source: ""
  }

  llcarousel = 3;
  lcarousel = 4;
  carouselIndex = 0;
  rcarousel = 1;
  rrcarousel = 2;

  projects = [
    {
      name: "testing 1",
      tools: [
        "Pocket Knife",
        "Ryoba",
        "Sandpaper",
        "Sloyd Knife",
        "V-Gouge"
      ],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis.",
      image: "./assets/woodworking/1.jfif",
      woodtype: "Basswood",
      finish: ["Acrylic Paint", "Walnut Oil", "Half & Half"],
      source: "Maplewood Park"
    },
    {
      name: "testing 2",
      tools: [
        "Auger",
        "Axe",
        "Chisel",
        "Coping Saw",
      ],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/2.jfif",
      woodtype: "Basswood",
      finish: ["Half & Half Dark"],
      source: "Cedar Grove"
    },
    {
      name: "testing 3",
      tools: [
        "Hook Knife",
      ],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/3.jfif",
      woodtype: "Unknown",
      finish: ["Milk Paint", "Town Talk Wax"],
      source: "Oak Ridge"
    },
    {
      name: "testing no tools",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/4.jfif",
      woodtype: "Basswood",
      finish: ["Acrylic Paint", "Half & Half Dark"],
      source: ""
    },
    {
      name: "testing overlap tools",
      tools: [
        "Auger",
        "Axe",
        "Chisel",
      ],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/5.jfif",
      woodtype: "Basswood",
      finish:   ["None", "Half & Half Dark", "Milk Paint"],
      source: "Pine Valley"
    },
    {
      name: "", // no name test
      tools: ["Gouge"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/6.jfif",
      woodtype: "Pine",
      finish: ["Town Talk Wax", "Half & Half Dark", "Walnut Oil"],
      source: "Birchwood Forest"
    },
    {
      name: "testing long description",
      tools: ["Ryoba", "Detail Knife", "Sloyd Knife", "Sandpaper"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis. Aliquam convallis lectus id felis cursus, a congue lacus malesuada. Integer eget ligula fermentum, consequat lorem eget, ultrices felis. Donec nec nisi ut elit laoreet blandit. Sed at convallis dolor, non tincidunt quam. Vestibulum at lacus ac dolor vestibulum lobortis. Donec luctus vel nisi at fringilla. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis. Aliquam convallis lectus id felis cursus, a congue lacus malesuada. Integer eget ligula fermentum, consequat lorem eget, ultrices felis. Donec nec nisi ut elit laoreet blandit. Sed at convallis dolor, non tincidunt quam. Vestibulum at lacus ac dolor vestibulum lobortis. Donec luctus vel nisi at fringilla.",
      image: "./assets/woodworking/7.jfif",
      woodtype: "Spruce",
      finish: ["Acrylic Paint"],
      source: ""
    },
    {
      name: "testing no description",
      tools: ["Axe", "Gouge", "Drill", "Pocket Knife"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/8.jfif",
      woodtype: "Green",
      finish: ["None", "Milk Paint"],
      source: "Elmwood Park"
    },
    {
      name: "testing no images",
      tools: ["Gouge", "Hook Knife", "Kanna"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "",
      woodtype: "Cinnamon",
      finish: ["Walnut Oil", "Town Talk Wax"],
      source: "Willow Creek"
    },
    {
      name: "testing no woodtype",
      tools: ["Ryoba", "Pocket Knife", "Drill", "Detail Knife", "V-Gouge", "Sloyd Knife"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/10.jfif",
      woodtype: "Purple",
      finish: ["Town Talk Wax", "None", "Half & Half Dark"],
      source: "Aspen Hollow"
    },
    {
      name: "testing no source",
      tools: ["Coping Saw", "Sloyd Knife", "Drill"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/11.jfif",
      woodtype: "White",
      finish: ["Acrylic Paint", "Half & Half Dark", "Town Talk Wax"],
      source: ""
    },
    {
      name: "testing no finish",
      tools: ["Chisel", "V-Gouge", "Hook Knife", "Sandpaper", "Axe"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/5.jfif",
      woodtype: "White",
      finish: [],
      source: "Magnolia Gardens"
    },
    {
      name: "testing 1 finish",
      tools: ["Kanna", "Drill", "Chisel"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/9.jfif",
      woodtype: "White",
      finish: ["Walnut Oil",
      "Half & Half",
      "Half & Half Dark",
      "None",
      "Milk Paint",
      "Acrylic Paint",
      "Town Talk Wax"],
      source: "Chestnut Hill"
    },
    {
      name: "testing long source",
      tools: ["Hook Knife", "Detail Knife", "Sloyd Knife", "Axe", "Pocket Knife", "Coping Saw"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/6.jfif",
      woodtype: "White",
      finish: ["Acrylic Paint", "Half & Half Dark", "Town Talk Wax"],
      source: "Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree "
    },
    {
      name: "testing long wood type",
      tools: ["Drill", "Sandpaper", "Sloyd Knife"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      image: "./assets/woodworking/9.jfif",
      woodtype: "Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree ",
      finish: ["Acrylic Paint", "Half & Half Dark", "Town Talk Wax"],
      source: "Folkstone Dr"
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
