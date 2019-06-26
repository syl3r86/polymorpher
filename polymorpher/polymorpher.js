
class Polymorpher extends Application {

    constructor() {
        super();

        // default sheets
        Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => this.enablePolymorphing(app, html, data));
        Hooks.on(`renderActorSheet5eNPC`, (app, html, data) => this.enablePolymorphing(app, html, data));

        // better npc sheet
        Hooks.on(`renderBetterNPCActor5eSheet`, (app, html, data) => this.enablePolymorphing(app, html, data));

        // adnd5e sheets
        Hooks.on(`renderActorSheetA5eCharacter`, (app, html, data) => this.enablePolymorphing(app, html, data));
        Hooks.on(`renderActorSheetA5eNPC`, (app, html, data) => this.enablePolymorphing(app, html, data));


        Hooks.on('ready', () => {
            game.settings.register("Polymorpher", "store", {
                name: "Polymorpher backup character store",
                hint: "stores polymorphed targets",
                default: {},
                type: Object,
                scope: 'world',
                onChange: backup => {
                    this.backupCharacterStore = backup;
                    this.render(false);
                }
            });
            this.backupCharacterStore = game.settings.get('Polymorpher', 'store');



            let options = {
                keepPhysical: { label: 'Keep Physical Ablitiescores (Str, Dex, Con)', value: false },
                keepMental: { label: 'Keep Mental Ablitiescores (Wis, Int, Cha)', value: false },
                keepSaves: { label: 'Keep Savingthrow Proficiency of the Character', value: false },
                keepSkills: { label: 'Keep Skill Proficiency of the Character', value: false },
                mergeSaves: { label: 'Merge Savingthrow Proficiencys (take both)', value: false },
                mergeSkills: { label: 'Merge Skill Proficiency (take both)', value: false },
                keepFeats: { label: 'Keep Features', value: false },
                keepSpells: { label: 'Keep Spells', value: false },
                keepItems: { label: 'Keep Equipment', value: false },
                keepBio: { label: 'Keep Biography', value: false },
                keepVision: { label: 'Keep Vision (Character and Token)', value: false },
                changeActorType: { label: 'Change Actor Type (requires reopening of the sheet)', value: false },
            }
            game.settings.register("Polymorpher", "defaultSettings", {
                name: "default settings for polymorpher",
                default: options,
                type: Object,
                scope: 'world',
                onChange: backup => {
                    this.backupCharacterStore = backup;
                    this.render(false);
                }
            });

            let button = $(`<button id="polymorpherBackupSystem"><i class="fas fa-address-book"></i> Polymorpher Backups</button>`);
            button.click(ev => {
                this.render(true);
            });
            $('#manage-modules').after(button);
        });
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = options.classes.concat('polymorpher');
        options.template = "public/modules/polymorpher/template/app.html";
        options.width = 600;
        options.title = 'Polymorpher Backup Store';
        return options;
    }

    getData() {
        let data = {};
        data.backupCharacterStore = this.backupCharacterStore;
        data.empty = (Object.keys(this.backupCharacterStore).length === 0);
        return data;
    }

    activateListeners(html) {
        $(html.find('.export')).click(ev => {
            let combinedId = $(ev.target).parents('li').attr('data-combinedId');
            this.exportFromStorage(combinedId);
        });

        $(html.find('.restore')).click(ev => {
            let combinedId = $(ev.target).parents('li').attr('data-combinedId');
            this.restoreFromStorage(combinedId);
        });

        $(html.find('.delete')).click(ev => {
            let combinedId = $(ev.target).parents('li').attr('data-combinedId');
            this.removeFromStorage(combinedId);
            this.render(false);
        });
    }

    enablePolymorphing(app, html, data) {
        // its important to store the original _onDrop since we need it for item drops
        // but a sheetupdate calls this again without resetting the sheets _onDrop function,
        // so it would overwrite the original with the newOnDrop, so we only store it if we don't have it already
        if (this.originalOnDrop === undefined) {
            this.originalOnDrop = app._onDrop;
        }
        app._onItemDrop = this.originalOnDrop;
        app._onDrop = this.newOnDrop;

        this.enableRestoration(app, html, data);
    }

    async newOnDrop(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let dropData;
        try {
            dropData = JSON.parse(ev.dataTransfer.getData('text/plain'));
        }
        catch (err) {
            return false;
        }

        if (dropData.type === 'Actor') {
            let originalActor = this.object;
            let targetActor = {};
            if (dropData.pack !== undefined) {
                // load data from compendium
                let pack = game.packs.find(p => p.collection === dropData.pack);
                targetActor = await pack.getEntity(dropData.id);
                targetActor = targetActor.data;
            } else {
                // load data from database
                targetActor = game.actors.get(dropData.id).data;
            }

            let options = await game.settings.get('Polymorpher', 'defaultSettings');
            let dialogContent = ''
            for (let option in options) {
                dialogContent += `<div><input type="checkbox" name="${option}" ${options[option].value?"checked":""}> <label for="${option}">${options[option].label}</div>`;
            }
            let d = new Dialog({
                title: "Polymorphing - choose your options",
                content: dialogContent,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Accept",
                        callback: async html => {
                            let inputs = html.find('input');
                            for (let input of inputs) {
                                options[input.name].value = input.checked;
                            }
                            await polymorpher.createBackup(originalActor);
                            game.settings.set('Polymorpher', 'defaultSettings', options);
                            polymorpher.exchangeActor(originalActor, targetActor, options);
                        }
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancle"
                    }
                },
                default: "one",
            });
            d.render(true);


        } else {
            this._onItemDrop(ev);
        }
    }

    async createBackup(actor) {
        if (actor.data.flags.polymorpher === undefined || actor.data.flags.polymorpher.data.isPolymorphed === false) {
            // create relevant information    
            let actorId = actor.data._id;
            let dateId = Date.now();
            let name = actor.data.name;
            let date = new Date();
            let displayDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',','');
            let combinedId = `${actorId}.${dateId}`;

            // store backup in settings    
            game.settings.register("Polymorpher", combinedId, {
                name: "Polymorpher backup character store",
                hint: "stores polymorphed targets",
                default: '',
                type: String,
                scope: 'world',
                onChange: backup => {
                    console.log('Polymorpher | Backup created');
                }
            });
            game.settings.set('Polymorpher', combinedId, JSON.stringify(actor.data));

            // create refrence in backupStore
            let storeData = {
                id: actorId,
                name: name,
                displayDate: displayDate
            }

            this.backupCharacterStore[combinedId] = storeData;
            game.settings.set('Polymorpher', 'store', this.backupCharacterStore);
        }
    }
    
    exchangeActor(originalActor, newActor, options = false) {
        ui.notifications.info(`Polymorphing ${originalActor.name} into a ${newActor.name}`);
        // creating a copy of the data of newActor to prevent any modification of the droped actor 
        let newActorRawData = JSON.parse(JSON.stringify(newActor));
        let newActorData = {
            data: newActorRawData.data,
            items: newActorRawData.items,
            token: newActorRawData.token,
            img: newActorRawData.img,
            flags: newActorRawData.flags
        }
        newActorData.token.actorId = originalActor.data.token.actorId;
        newActorData.token.actorLink = originalActor.data.token.actorLink;
        newActorData.token.name = originalActor.data.token.name;

        // make sure custom language/damage type get overwritten properly
        for (let trait in newActorData.data.traits) {
            let specialTraits = ['languages', 'di', 'dr', 'dv', 'ci'];
            if (specialTraits.indexOf(trait) !== -1) {
                if (newActorData.data.traits[trait].custom === undefined) {
                    newActorData.data.traits[trait].custom = '';
                }
            }
        }

        // we don't care about the polymorph status of the token we use to poly
        if (newActorData.flags.polymorpher !== undefined) {
            newActorData.flags.polymorpher = undefined;
        }

        // if we can, we want to preserve exhaustion and inspiration
        if (newActorData.type === 'character') {
            newActorData.data.attributes.exhaustion.value = originalActor.data.data.attributes.exhaustion.value;
            newActorData.data.attributes.inspiration.value = originalActor.data.data.attributes.inspiration.value;
        }

        // keep original values for some, as defined in options
        if (options !== false) {
            if (options.keepPhysical.value) {
                newActorData.data.abilities.str.value = originalActor.data.data.abilities.str.value;
                newActorData.data.abilities.dex.value = originalActor.data.data.abilities.dex.value;
                newActorData.data.abilities.con.value = originalActor.data.data.abilities.con.value;
            }
            if (options.keepMental.value) {
                newActorData.data.abilities.int.value = originalActor.data.data.abilities.int.value;
                newActorData.data.abilities.wis.value = originalActor.data.data.abilities.wis.value;
                newActorData.data.abilities.cha.value = originalActor.data.data.abilities.cha.value;
                newActorData.data.traits.perception.value = originalActor.data.data.traits.perception.value;
            }
            if (options.keepSaves.value) {
                newActorData.data.abilities.str.proficient = originalActor.data.data.abilities.str.proficient;
                newActorData.data.abilities.dex.proficient = originalActor.data.data.abilities.dex.proficient;
                newActorData.data.abilities.con.proficient = originalActor.data.data.abilities.con.proficient;
                newActorData.data.abilities.int.proficient = originalActor.data.data.abilities.int.proficient;
                newActorData.data.abilities.wis.proficient = originalActor.data.data.abilities.wis.proficient;
                newActorData.data.abilities.cha.proficient = originalActor.data.data.abilities.cha.proficient;
            }
            if (options.keepSkills.value) {
                newActorData.data.skills = originalActor.data.data.skills;
            }
            if (options.mergeSaves.value) {
                for (let ability in newActorData.data.abilities) {
                    if (originalActor.data.data.abilities[ability].proficient > newActorData.data.abilities[ability].proficient)
                        newActorData.data.abilities[ability].proficient = originalActor.data.data.abilities[ability].proficient;
                }
            }
            if (options.mergeSkills.value) {
                for (let skill in newActorData.data.skills) {
                    if (originalActor.data.data.skills[skill].value > newActorData.data.skills[skill].value)
                        newActorData.data.skills[skill].value = originalActor.data.data.skills[skill].value;
                }
            }
            if (options.keepFeats.value) {
                for (let item of originalActor.data.items) {
                    if (item.type === 'feat') {
                        newActorData.items.push(item);
                    }
                }
            }
            if (options.keepSpells.value) {
                for (let item of originalActor.data.items) {
                    if (item.type === 'spell') {
                        newActorData.items.push(item);
                    }
                }
            }
            if (options.keepItems.value) {
                for (let item of originalActor.data.items) {
                    if (item.type !== 'feat' && item.type !== 'spell' && item.type !== 'class') {
                        newActorData.items.push(item);
                    }
                }
            }
            if (options.keepBio.value) {
                newActorData.data.details.biography = originalActor.data.data.details.biography;
            }
            if (options.keepVision.value) {
                newActorData.data.traits.senses = originalActor.data.data.traits.senses;
                newActorData.token.dimSight = originalActor.data.token.dimSight;
                newActorData.token.brightSight = originalActor.data.token.brightSight;
                newActorData.token.dimLight = originalActor.data.token.dimLight;
                newActorData.token.brightLight = originalActor.data.token.brightLight;
            }
            if (options.changeActorType.value) {
                newActorData.type = newActorRawData.type;
            }
        }

        // editing tokens owned by the polymorphed character    
        let tokens = canvas.tokens.ownedTokens.filter(element => element.data.actorId === originalActor.data._id);
        for (let token of tokens) {
            let newRawTokenData = JSON.parse(JSON.stringify(newActorData.token));
            let oldRawTokenData = JSON.parse(JSON.stringify(token.data));

            // we only want to store the original actor data. If the target is already polymorphed and polymorphs again, we DONT want to set the current data as the original
            if (originalActor.data.flags.polymorpher === undefined || originalActor.data.flags.polymorpher.data.isPolymorphed === false) {
                newRawTokenData.flags.polymorpher = { originalTokenData: oldRawTokenData };
            }
            // do not change x/y coordinates
            delete newRawTokenData.x;
            delete newRawTokenData.y;

            // do not change display settings for name/bars
            delete newRawTokenData.displayName;
            delete newRawTokenData.displayBars;

            token.update(canvas.scene._id, newRawTokenData);
        }

        // we only want to store the original actor data. If the target is already polymorphed and polymorphs again, we DONT want to set the current data as the original
        if (originalActor.data.flags.polymorpher === undefined || originalActor.data.flags.polymorpher.data.isPolymorphed === false) {
            let flag = {
                data: {
                    isPolymorphed: true,
                    originalData: JSON.stringify(originalActor.data)
                }
            }
            newActorData.flags.polymorpher = flag;
        }

        //easter egg
        if (newActorRawData.name === 'Tyrannosaurus Rex') {
            game.socket.emit('module.polymorpher', { rawr: 'RAWR' });

            AudioHelper.play({
                src: 'modules/polymorpher/template/sound.mp3',
                volume: 0.20
            });
        }

        originalActor.update(newActorData);
    }

    enableRestoration(app, html, data) {
        let actor = app.object;
        let updateMode = false;
        let flag = actor.getFlag('polymorpher', 'data');
        // only do stuff if the actor has the apropiate flags
        if (flag === undefined) {
            return;
        }

        let appId = html[0].id;
        if (appId == '') {
            updateMode = true; // this applies if the sheet is rerendered after an update rather then opened
            appId = $(html).parents('.app')[0].id;
        }

        //if (data.actor.data.details.source !== undefined && data.actor.data.details.source.polymorpher !== undefined && data.actor.data.details.source.polymorpher.isPolymorphed) {
        if (flag !== undefined && flag.isPolymorphed) {
            let restoreBtn = $(`<a class="restore-actor"><i class="fas fa-backward"> Restore</a>`);
            restoreBtn.click(ev => {
                this.restoreActor(actor, flag.originalData);
            });

            $(`#${appId} .restore-actor`).remove();
            $(`#${appId} .configure-sheet`).before(restoreBtn);
        }

        if (updateMode && flag.isPolymorphed === false) {
            $(`#${appId} .restore-actor`).remove();
        }
    }

    exportFromStorage(combinedId) {
        game.settings.register("Polymorpher", combinedId, {
            name: "Polymorpher backup character store",
            hint: "stores polymorphed targets",
            default: '',
            type: String,
            scope: 'world',
            onChange: backup => {
            }
        });
        let originalDataJSON = game.settings.get('Polymorpher', combinedId)
        saveDataToFile(originalDataJSON, "text/json", `charackterBackup_${this.backupCharacterStore[combinedId].name}.json`);
    }

    restoreFromStorage(combinedId) {
        game.settings.register("Polymorpher", combinedId, {
            name: "Polymorpher backup character store",
            hint: "stores polymorphed targets",
            default: '',
            type: String,
            scope: 'world',
            onChange: backup => {
            }
        });
        let originalDataJSON = game.settings.get('Polymorpher', combinedId)
        let actorId = combinedId.split('.')[0]
        let actor = game.actors.get(actorId);

        this.restoreActor(actor, originalDataJSON);
    }

    removeFromStorage(combinedId) {
        new Dialog({
            title: "Delete Actor Backup",
            content: "<p>Are you sure?</p>",
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Yes",
                    callback: () => {
                        game.settings.register("Polymorpher", combinedId, {
                            name: "Polymorpher backup character store",
                            hint: "stores polymorphed targets",
                            default: '',
                            type: String,
                            scope: 'world',
                            onChange: backup => {
                            }
                        });
                        game.settings.set('Polymorpher', combinedId, '');
                        delete this.backupCharacterStore[combinedId];
                        game.settings.set('Polymorpher', 'store', this.backupCharacterStore);
                    }
                },
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "No",
                    callback: () => { }
                }
            },
            default: "no",
            close: () => { }
        }).render(true);
    }
    
    restoreActor(actor, originalDataJSON) {
        ui.notifications.info(`Restoring ${actor.name} to their former glory!`);
        let originalData = JSON.parse(originalDataJSON);
        let newFlag = {
            data: {
                isPolymorphed: false,
                originalData: ''
            }
        }

        // restoring token to original state
        let tokens = canvas.tokens.ownedTokens.filter(element => element.data.actorId === originalData._id);
        for (let token of tokens) {
            let originalTokenData = '';

            // we try to get the original token data that was saved for each token since they might not be the same as the prototype
            if (token.data.flags.polymorpher !== undefined && token.data.flags.polymorpher.originalTokenData !== undefined) {
                originalTokenData = token.data.flags.polymorpher.originalTokenData;
            } else {
                // using prototype token data as a fallback
                originalTokenData = originalData.token;
            }
            // do not fall back on x/y coordinates
            delete originalTokenData.x;
            delete originalTokenData.y;
            token.update(canvas.scene._id, originalTokenData);
        }
        if (actor.data.type === 'character') {
            originalData.data.attributes.exhaustion.value = actor.data.data.attributes.exhaustion.value;
            originalData.data.attributes.inspiration.value = actor.data.data.attributes.inspiration.value;
        }

        originalData.flags.polymorpher = newFlag;
        //actor.data.data = originalData.data; <- doesnt work after reloading

        for (let category in originalData.data) {
            for (let attr in originalData.data[category]) {
                if (originalData.data[category][attr].value === undefined) {
                    originalData.data[category][attr].value = '';
                }
                let specialTraits = ['languages', 'di', 'dr', 'dv', 'ci'];
                if (specialTraits.indexOf(attr) !== -1) {
                    if (originalData.data[category][attr].custom === undefined) {
                        originalData.data[category][attr].custom = '';
                    }
                }
            }
        }
        actor.update(originalData);

        // removing backup in the settings 
        /*
        this.backupCharacterStore[actor.data._id] = undefined;
        game.settings.set('Polymorpher', 'backup', this.backupCharacterStore);*/
    }
}

const polymorpher = new Polymorpher();

Hooks.on('ready', () => {
    game.socket.on('module.polymorpher', data => {
        AudioHelper.play({
            src: 'modules/polymorpher/template/sound.mp3',
            volume: 0.20
        });
    });
});