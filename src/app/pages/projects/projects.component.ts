import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {

  projectTemplate = {
    title: "",
    subtitle: "",
    type: "", // game, code, open source contribution, blah blah
    img: "",
    imgAlt: "",
    description: "",
    link: "",
  }

  projects = [
    {
      title: "Wild West Beans: Refried and Reloaded",
      subtitle: "First Person Shooter",
      type: "game", // game, code, open source contribution, blah blah
      img: "./assets/images/wildwestbean.png",
      imgAlt: "Bean Battle in the Saloon",
      description: "Shoot up evil bean outlaws in the Wild West in Story or Survival mode in this exciting and action packed first person shooter!",
      link: "https://winter-interactive.itch.io/wild-west-beans-refried-reloaded",
    },
    {
      title: "Project Wyvern",
      subtitle: "Accessible VR",
      type: "game", // game, code, open source contribution, blah blah
      img: "./assets/images/maze.gif",
      imgAlt: "Gif showing user leading ball around using VR accessiblity tools",
      description: "A 4 month project focused on accessibility in video games and specifically accessibility for gamers in VR.",
      link: "https://dingwall.itch.io/projectwyvern",
    },
    
  ]

  constructor() { }

  ngOnInit(): void {
  }

  gotToLink(link: string) {
    window.open(link, "_blank");
  }

}
