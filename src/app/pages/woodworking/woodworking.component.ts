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
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
    images: [],
    woodtype: "",
    finish: [],
    source: ""
  }

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
      images: [],
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
      images: [],
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
      images: [],
      woodtype: "Unknown",
      finish: ["Milk Paint", "Town Talk Wax"],
      source: "Oak Ridge"
    },
    {
      name: "testing no tools",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
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
      images: [],
      woodtype: "Basswood",
      finish:   ["None", "Half & Half Dark", "Milk Paint"],
      source: "Pine Valley"
    },
    {
      name: "", // no name test
      tools: ["Gouge"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "Pine",
      finish: ["Town Talk Wax", "Half & Half Dark", "Walnut Oil"],
      source: "Birchwood Forest"
    },
    {
      name: "testing long description",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis. Aliquam convallis lectus id felis cursus, a congue lacus malesuada. Integer eget ligula fermentum, consequat lorem eget, ultrices felis. Donec nec nisi ut elit laoreet blandit. Sed at convallis dolor, non tincidunt quam. Vestibulum at lacus ac dolor vestibulum lobortis. Donec luctus vel nisi at fringilla. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue. Nulla facilisi. Mauris eu magna tincidunt, laoreet nulla nec, hendrerit nisl. Nullam at semper turpis. Aliquam convallis lectus id felis cursus, a congue lacus malesuada. Integer eget ligula fermentum, consequat lorem eget, ultrices felis. Donec nec nisi ut elit laoreet blandit. Sed at convallis dolor, non tincidunt quam. Vestibulum at lacus ac dolor vestibulum lobortis. Donec luctus vel nisi at fringilla.",
      images: [],
      woodtype: "Spruce",
      finish: ["Acrylic Paint"],
      source: ""
    },
    {
      name: "testing no description",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "Green",
      finish: ["None", "Milk Paint"],
      source: "Elmwood Park"
    },
    {
      name: "testing no images",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "Cinnamon",
      finish: ["Walnut Oil", "Town Talk Wax"],
      source: "Willow Creek"
    },
    {
      name: "testing 2 images",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "Unknown",
      finish: ["Milk Paint", "None", "Acrylic Paint"],
      source: "Sycamore Grove"
    },
    {
      name: "testing 3+ images",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "Green",
      finish: ["Half & Half Dark", "Acrylic Paint"],
      source: "Redwood Heights"
    },
    {
      name: "testing no woodtype",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "Purple",
      finish: ["Town Talk Wax", "None", "Half & Half Dark"],
      source: "Aspen Hollow"
    },
    {
      name: "testing no source",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "White",
      finish: ["Acrylic Paint", "Half & Half Dark", "Town Talk Wax"],
      source: ""
    },
    {
      name: "testing no finish",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "White",
      finish: [],
      source: "Magnolia Gardens"
    },
    {
      name: "testing 1 finish",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
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
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "White",
      finish: ["Acrylic Paint", "Half & Half Dark", "Town Talk Wax"],
      source: "Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree "
    },
    {
      name: "testing long wood type",
      tools: [],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec justo vel felis suscipit ultricies. Phasellus vitae turpis eu tellus rhoncus congue.",
      images: [],
      woodtype: "Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree Sure, here are 15 random place names where you might find a tree ",
      finish: ["Acrylic Paint", "Half & Half Dark", "Town Talk Wax"],
      source: "Folkstone Dr"
    },
  ]

  constructor() { }

  ngOnInit(): void {
  }

}
