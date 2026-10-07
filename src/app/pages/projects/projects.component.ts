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
      title: "Chicago Marathon Map Assistant",
      subtitle: "Help spectators get around on marathon day",
      type: "code", // game, code
      img: "./assets/images/chicagomarathonmapsc.png",
      imgAlt: "",
      description: [
        `A simple map to help users view the route of the Chicago Marathon course and nearby CTA train train stations. This map loads the route from a GPX file and draws it on a map with mile markers along the course. Nearby station data is loaded and filtered to stops within one mile of the route, and each station can show the lines that serve it and the nearest race points.`,
        `The app can also track runner profiles and estimate when a runner will reach a point on the course based on saved split data and start times. It requests the user location and updates the map with nearby station and route information while the page is open.`,
      ],
      link: "https://adingwall.com/#/chicagomarathon",
    },
    {
      title: "Fellowship",
      subtitle: "Share with friends over long distances",
      type: "code", // game, code
      img: "./assets/images/fellowshipsc.png",
      imgAlt: "",
      description: [
        `Fellowship is a social app for share games, puzzles, movies, books, or any other physical item with friends over a long distance. Create a group, have friends join, and it helps assist you in tracking who owns what items, where they currently are, and who you are shipping your item to next.`,
        `Based off the concept of me and some friends wanting to share Lego sets, it is meant to make it easier for the organizer to assign who hasn't had each set yet, and who to send it to next.`,
        `The app lets signed-in users create groups, join groups, and manage shared item ownership across a network of friends. The group dashboard loads members, item records, and ownership history so it can show who currently has an item and who it needs to go to next.`,
        `The code also includes group settings for passwords, locking a group to new members, and hiding member contact details unless the viewer is already part of that group. On the item side, the app supports shipping confirmation and receipt confirmation flows for group assignments.`,
      ],
      link: "https://adingwall.com/#/fellowship",
    },
    {
      title: "Interval",
      subtitle: "Track athletes splits across multiple locations with precision",
      type: "code", // game, code
      img: "./assets/images/intervalsc.png",
      imgAlt: "",
      description: [
        `Timing app to help track athletes across multiple locations on a course. When 1 coach starts an event, another coach can lap the shared timer from a totally different location.`,
        `Interval manages a shared timing event by event code and keeps the timer state in the database so multiple coaches can act from different locations. It loads public events, can start and stop the timer, and exposes athlete split records that update as new split data arrives.`,
        `The interface includes athlete tracking, event search, and per-athlete elapsed time calculations based on the shared start time. The app is built around realtime split updates rather than only a local clock.`,
        ],
      link: "https://adingwall.com/#/interval",
    },
    {
      title: "College Capstone: Wild West Beans: Refried and Reloaded",
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
      title: "College Research Project: Project Wyvern",
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
