---
layout: post
title:  "First Week of Prototyping"
date:   2021-02-10 20:00:00 -0500
---
Hi everyone!

Create a dev blog entry describing the basic technical work you’ve accomplished. Additionally, describe…
    What this technical experiment proves about your research idea (does this experiment boost your confidence? Reduce your confidence? Why?).
        Data from your results (this may take many forms, from screenshots to spreadsheets, etc).
            The technologies you used in your experiment (Unity, C#, SDL, EC2 Server, TensorFlow, etc).
                Next steps (possible future experiments, new features to implement, new ideas to pursue, etc).

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

<img src="/assets/pics/threeenemy.png/">
<img src="/assets/pics/threeenemydead.png/">
<img src="/assets/pics/fiveenemy.png/">

Since I already knew I was facing a difficult task, I am still confident I can find a good subject to focus my efforts on. I enjoyed working on the dynamic difficulty and feel like with more time I can expand it into a much more complex system.

-Andrew