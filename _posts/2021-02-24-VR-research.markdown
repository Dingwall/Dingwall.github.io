---
layout: post
title:  "Expanding VR Research"
date:   2021-02-25 20:00:00 -0500
---
Hi all.

My research has progressed to now focus specifically on accessibility in VR. Virtual reality has the potential to transport users to different worlds in a more immersive way than was ever available before. However, it faces some massive accessibility issues. A few that I have identified that I spent my time researching this week were:
<ul>
    <li>Height difference-When the player's head is not positioned at the average standing height, whether they are sitting for shorter. This will affect their ability to interact with the envronment as things are positioned in the wrong place relative to the players view.</li>
    <li>Turning-Not all players can easily rotate 360 degrees while in game. Some have limitations that prevent them from spinning their body while playing.</li>
    <li>Maneuverability-Some players can't easily bend over of reach far from where they currently are, limiting what items, buttons, or other things they can reach in game.</li>
</ul>

In addition to these more VR specific issues, we have our typical accessibility issues in video games. A few big ones are:
<ul>
    <li>Menu narration</li>
    <li>Subtitles</li>
    <li>Larger text</li>
    <li>Colorblind filters</li>
    <li>Audio adjustment</li>
    <li>Difficulty</li>
</ul>

My plan is to start working on the specific VR issues first, as the gaming industry has began to work on integrating these other accessibility options into most games. My goal is to find a way to make virtual reality accessible to quadreplegic people, in the hope that it gives them an opportunity to experience other worlds just by putting on the headset.

Next week I will begin technical work to actually implement these tools. For this week I have spent my time researching existing VR games and tools that include accessibility settings. First is <em>Island 359</em> which features height adjustment settings as well as reach to grab settings. The reach to grab is especially interestings, providing a useful way for the player to reach toward an object on the ground that is out of reach and it will fly to their hand. 
<object data="https://www.youtube.com/watch?v=fpPhz35c2qc&feature=youtu.be"></object>
Games like <em>Hover Junkers, Space Pirate Trainer,</em> and <em>Job Simulator</em> offer options to raise view height for accessibility.
<image src="{{site.url}}/assets/jobSimSmallHuman.jpg" alt="small human switch"/>
Some games like <em>Unseen Diplomacy</em> offer different gameplay based off of players movement ability. Since <em>Unseen Diplomacy</em> is a game based on puzzles and players movement around them, the player can choose a seated mode that removes puzzles requiring the player to crouch or jump, which still offers the player a great experience without them even knowing it has been adjusted to be accessible to their playstyle. Another important thing to avoid to improve accessibility in VR is large amounts of crouching or bending over, since older players or those seated will not be able to complete the action. Controls like the <em>Island 359</em> option of reach to grab help limit this to specifically a movement issue.

I intend to focus on a seated mode for VR, which would include height adjustment, reach to grab, and alternative turning methods (like bumper turning). Additionally I hope to create a new system for viewing the VR world that requires only the use of the players head. When looking far enough right or left, the camera could slowly pan so that a seated player does not need to spin. Similarly a joystick could be positioned below the players chin or controlled with their mouth to add movement in all 4 directions. By holding down on the joystick long enough the player could automatically spin 180 degrees. Control adjustments like these could make VR much more accessible for so many people. As far as input goes, I have mentioned a sip-n-puff device being used in the past. While I may not have access, theoretically two button presses could be mapped to sip-n-puff input (one for sip, one for puff). I will begin working from this angle and see where my research takes me.

-Andrew