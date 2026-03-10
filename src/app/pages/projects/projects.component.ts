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
      type: "game", // game, code
      img: "./assets/images/wildwestbean.png",
      imgAlt: "Bean Battle in the Saloon",
      description: [
        `A first-person shooter set in the Wild West where players face off against evil bean outlaws across two distinct modes: a narrative-driven Story mode and a high-stakes Survival mode. Built entirely from scratch in Unity over two months as a capstone project at the University of Michigan.`,
        `Led development as a team of four using Agile methodology where we were running sprints, incorporating stakeholder feedback, and pair programming to ship a polished, playable game under a tight deadline. The project covered the full software lifecycle from initial design through playtesting and iteration, with an emphasis on clean architecture and collaborative workflows.`,
      ],
      link: "https://winter-interactive.itch.io/wild-west-beans-refried-reloaded",
    },
    {
      title: "Project Wyvern",
      subtitle: "Accessible VR",
      type: "game", // game, code
      img: "./assets/images/maze.gif",
      imgAlt: "Gif showing user leading ball around using VR accessiblity tools",
      description: [
        `A four-month independent research and development project exploring accessibility in VR gaming for players with limited mobility, specifically those with no use of their hands. Motivated by a personal connection to disability, the project investigated the state of accessible gaming across 30+ academic papers before narrowing focus to VR, an immersive medium with enormous potential for disabled players that remains largely out of reach.`, 
        `The result is a playable VR puzzle game controlled entirely through head movement and gaze, with no hands or controllers required. Core systems built from scratch in Unity include a gaze-based telekinesis system (pull, push, and hold), snap turning via head orientation, a seated mode with perspective locking, and a radial gaze UI with real-time feedback. Five levels were shipped, ranging from object-sorting puzzles to a pirate ship cannon battle.`,
      ],
      link: "https://dingwall.itch.io/projectwyvern",
    },
  ]

  constructor() { }

  ngOnInit(): void {
  }


}
