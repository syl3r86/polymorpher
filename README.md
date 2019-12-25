# Polymorpher
A module for Foundry VTT that lets you polymorph characters into any other character!
Just drag any Actor (NPC or Character) ontop of another Actor to change the later into the prior. Support droping both from Compendium or the sidebar.

## Installation
1. Copy this link and use it in Foundrys Module Manager to install the Module

    > https://raw.githubusercontent.com/syl3r86/polymorpher/master/module.json
    
2. Enable the Module in your Worlds Module Settings

[-> Preview <-](https://streamable.com/msm48)

## Options
If you don't want to change every aspect of the character, you can choose to exclude a number of changes. These are all the options:


- Keep Physical Ablitiescores (Str, Dex, Con)
- Keep Mental Ablitiescores (Wis, Int, Cha)
- Keep Savingthrow Proficiency of the Character
- Keep Skill Proficiency of the Character
- Merge Savingthrow Proficiencys (take both)
  - this will keep proficiencys of the character intact and also grant any extra proficiencys from the draged on actor
- Merge Skill Proficiency (take both)
  - this will keep proficiencys of the character intact and also grant any extra proficiencys from the draged on actor
- Keep Features
- Keep Spells
- Keep Equipment
- Keep Biography
- Keep Vision (Character and Token)
  - if you want to preserve the exact way a token has vision on the map, this will do that. It will also not change the characters senses in the character sheet

---

As well as the character sheet, this module also changes token settings to match the polymorph actor. It will update art, visibility options for name/bar, vision settings (optionally disableable) and token bar settings. This change affects any token owned by the polymorphed actor on the active scene. Same for reverting back to the original. Any token created after polymorphing on the active scene, will also revert to the characters default token setup. The place in the combat order and initiative is also preserved.

---

## Contribution
Big thanks to FrisGuardian#8347 (from the Foundry discord) for extensive bugtesting.

If you feel like supporting my work, feel free to leave a tip at my paypal felix.mueller.86@web.de

## License
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">Polymorpher - a module for Foundry VTT -</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/syl3r86?tab=repositories" property="cc:attributionName" rel="cc:attributionURL">Felix Müller</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development v 0.1.6](http://foundryvtt.com/pages/license.html).
