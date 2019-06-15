# Polymorpher
A module for Foundry VTT that lets you polymorph characters into any other character!
Just drag any Actor (NPC or Character) ontop of another Actor to change the later into the prior. Support droping both from Compendium or the sidebar.

Installation:
1. Download the [polymorpher.zip](https://github.com/syl3r86/polymorpher/raw/master/polymorpher.zip)
2. Unzip it into FoundryVTT/resources/app/public/modules
3. Restart Foundry if it was running.

Requires the dnd5e system. Supports the default character sheet, the better NPC sheet and tentativly Mörills adnd5e sheet, though be cautious with the later one, sinc that hasn't been tested as thorough.

You're good to go!

[-> Preview <-](https://streamable.com/msm48)

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
- Change Actor Type (requires reopening of the sheet)
  - if you want to use a simpler npc sheet for the polymorphed characters, you can. though beware that the sheet may appear broken directly after polymorphing or reverting back to original. But this is only a visual glitch that is fixed by closing and reopening the actor.

---

As well as the character sheet, this module also changes token settings to match the polymorph actor. It will update art, visibility options for name/bar, vision settings (optionally disableable) and token bar settings. This change affects any token owned by the polymorphed actor on the active scene. Same for reverting back to the original. Any token created after polymorphing on the active scene, will also revert to the characters default token setup. The place in the combat order and initiative is also preserved.

---

Big thanks to FrisGuardian#8347 (from the Foundry discord) for extensive bugtesting.

If you feel like supporting my work, feel free to leave a tip at my paypal felix.mueller.86@web.de
