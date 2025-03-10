---
layout: post
title:  "First Week of Prototyping"
date:   2021-02-10 20:00:00 -0500
---
Hi everyone!

This week I spent my time testing a very simple dynamic difficulty system I created. I developed a simple game in Unity3D to start, and then began working on the dynamic difficutly.
Obviously something like this could take years to develop a truly responsive AI, but I started by making a list of some simple factors that I believe affect a games difficulty.

<ul>
    <li>Number of enemies</li>
    <li>Enemies health (resiliance to damage)</li>
    <li>Enemy damage to player</li>
    <li>Enemy weapons/types</li>
    <li>Reduce player damage output</li>
    <li>Reduce quality of items available to player</li>
    <li>Enemies reactions to player</li>
</ul>

Enemies reactions to the player can be a number of things, but I am focusing on:

<ul>
    <li>How smart they are/what strategy they follow</li>
    <li>How quick they move and react</li>
    <li>How they attack (moves and level of aggression)</li>
    <li>How they defend (moves and healing or escape strategies)</li>
</ul>

These things seemed like a good start. I began by focusing on adjusting how many enemies spawned as well as how much health they have. The better the player is doing, more enemies will begin to spawn with more health. As the player does worse less enemies will spawn with less health. The hard parts are balancing so there is a cap of difficulty (the game isn't unbeatable) and making sure the system isn't obviously adjusting to how the player is doing.

Since I already knew I was facing a difficult task, I am still confident I can find a good subject to focus my efforts on. I enjoyed working on the dynamic difficulty and feel like with more time I can expand it into a much more complex system. I currently had a simple spawning system for enemies, and very simple level progression system, and a way to track statistics of the player from life to life. For example, I track how many enemies the player killed for the current life, and compare it to the number killed in the last life when they die. I do the same thing for the number of enemy spawners they completed, where the spawner is completed when all enemies spawned from it are dead. With these stats and a few others I was able to establish a rough idea of how well the player was doing, and able to lower the difficulty (the attack frequency and health of enemies) so that the player wouldn't constantly be stuck on the same spot.

I used Unity3D and C# in my development. My plan for the coming week is to improve the dynamic difficulty system to see how much further I can go with it. I think a simple but effective system for self adjusting could do big things for accessibility in modern gaming. I could also see developing different features which I could enable to improve accessibility of the simple game I have created so far.

Thanks for reading!

-Andrew
