var FabulaUltimator =
  FabulaUltimator ||
  (function () {
    const G_CONSTANTS = {
      api: '!fabula',
      script: 'FabulaUltimator',
      version: `0.0.${Date.now()}`,
      journalUrl: 'https://journal.roll20.net/character/',
      assetUrl: 'https://raw.githubusercontent.com/morgdalaine/fabula-ultimator/main/assets/',
      commands: {
        help: `!fabula --help`,
        import: `!fabula --import`,
        export: `!fabula --export`,
        config: `!fabula --config`,
        reset: `!fabula --reset`,
      },
      assets: {
        feather: 'feather.png',
      },
    };

    const IMPORT_TO_ROLL20_CROSSWALK = {
      lvl: 'level',
      armor: {
        mdef: 'armor_magic_defense',
        mdefbonus: 'armor_magic_defense_bonus',
        cost: 'armor_cost',
        init: 'armor_initiative',
        def: 'armor_defense',
        defbonus: 'armor_defense_bonus',
        name: 'armor_name',
      },
      shield: {
        mdef: 'shield_magic_defense',
        mdefbonus: 'shield_magic_defense_bonus',
        cost: 'shield_cost',
        init: 'shield_initiative',
        def: 'shield_defense',
        defbonus: 'shield_defense_bonus',
        name: 'shield_name',
      },
      extra: {
        init: 'initiative_bonus', // +4 initiative
        precision: 'accuracy_bonus', // +3 bonus to accuracy
        magic: 'magic_bonus', // +3 bonus to magic
        extrainit: 'initiative_extra',
        mp: 'mp_extra',
        hp: 'hp_extra',
        def: 'defense_extra',
        mDef: 'magic_defense_extra',
      },
      attributes: {
        dexterity: { name: 'dexterity', max: true },
        might: { name: 'might', max: true },
        will: { name: 'will', max: true },
        insight: { name: 'insight', max: true },
      },
      attacks: [
        {
          name: 'repeating_attacks_-UUID_attack_name',
          attr1: 'repeating_attacks_-UUID_attack_check_1',
          attr2: 'repeating_attacks_-UUID_attack_check_2',
          range: 'repeating_attacks_-UUID_attack_distance',
          special: 'repeating_attacks_-UUID_attack_special',
          extraDamage: 'repeating_attacks_-UUID_attack_extra_damage',
          type: 'repeating_attacks_-UUID_attack_damage_type',
        },
      ],
      spells: {
        name: 'repeating_spells_-UUID_spell_name',
        attr1: 'repeating_spells_-UUID_spell_check_1',
        attr2: 'repeating_spells_-UUID_spell_check_2',
        type: 'repeating_spells_-UUID_spell_type',
        duration: 'repeating_spells_-UUID_spell_duration',
        range: 'repeating_spells_-UUID_spell_range',
        mp: 'repeating_spells_-UUID_spell_mp',
        target: 'repeating_spells_-UUID_spell_target',
        special: 'repeating_spells_-UUID_spell_special',
        effect: 'repeating_spells_-UUID_spell_effect',
      },
      species: 'species',
      notes: {
        name: 'repeating_notes_-UUID_note_name',
        effect: 'repeating_notes_-UUID_note_effect',
      },
      raregear: {
        effect: 'repeating_raregear_-UUID_gear_name',
        name: 'repeating_raregear_-UUID_gear_effect',
      },
      actions: {
        name: 'repeating_actions_-UUID_action_name',
        effect: 'repeating_actions_-UUID_action_effect',
      },
      description: 'description',
      special: {
        effect: 'repeating_specials_-UUID_special_effect',
        name: 'repeating_specials_-UUID_special_name',
      },
      name: 'character_name',
      traits: 'traits',
      weaponattacks: {
        weapon: {
          category: 'repeating_weapons_-UUID_weapon_category',
          name: 'repeating_weapons_-UUID_weapon_name',
          att1: 'repeating_weapons_-UUID_weapon_check_1',
          att2: 'repeating_weapons_-UUID_weapon_check_2',
          cost: 'repeating_weapons_-UUID_weapon_cost',
          damage: 'repeating_weapons_-UUID_weapon_damage',
          hands: 'repeating_weapons_-UUID_weapon_hands',
          prec: 'repeating_weapons_-UUID_weapon_precision',
          range: 'repeating_weapons_-UUID_weapon_range',
          type: 'repeating_weapons_-UUID_weapon_type',
        },
        name: 'repeating_weapons_-UUID_weapon_attack_name',
        special: 'repeating_weapons_-UUID_weapon_special',
        extraDamage: 'repeating_weapons_-UUID_weapon_extra_damage',
        flathit: 'repeating_weapons_-UUID_weapon_attack_precision',
        flatdmg: 'repeating_weapons_-UUID_weapon_attack_damage',
      },
      rank: 'rank',
      affinities: {
        physical: 'physical',
        air: 'air',
        bolt: 'bolt',
        dark: 'dark',
        earth: 'earth',
        fire: 'fire',
        ice: 'ice',
        light: 'light',
        poison: 'poison',
      },
      createdBy: 'createdby',
      companionlvl: 'companion_skill_level',
      companionpclvl: 'pc_level',
    };

    const DEFAULT_STATE = {
      overwrite: true,
      inplayerjournals: 'all',
      controlledby: 'all',
    };

    const checkInstall = () => {
      const debug = true;
      if (debug) {
        delete state.fabula;
        // delete all on load when true
        // let sheets = findObjs({ _type: 'character' }, { caseInsensitive: true });
        // for (let i = 0; i < sheets.length; i++) {
        //   sheets[i].remove();
        // }
      }

      if (Object.hasOwn(state, 'fabula')) {
        state.fabula = state.fabula || {};
      }

      setDefaults();
    };

    const setDefaults = (playerid = null) => {
      if (!state.fabula) {
        state.fabula = {};
      }

      state.fabula = Object.assign({}, DEFAULT_STATE);

      if (playerid) {
        state.fabula[playerid] = Object.assign({}, DEFAULT_STATE);
      } else {
        findObjs({ _type: 'player' }).forEach((player) => {
          state.fabula[player.id] = Object.assign({}, DEFAULT_STATE);
        });
      }
    };

    const registerEventHandlers = () => {
      on('chat:message', eventHandler);
    };

    const eventHandler = (message) => {
      if (message.type !== 'api') return;

      // parse message into command and arguments(s)
      const args = message.content.split(/--(help|import|export|config)?/g).map((c) => c.trim());
      const command = args.shift();
      const player = getObj('player', message.playerid);

      if (command != G_CONSTANTS.api) return;
      if (args.length === 0) {
        sendHelpMenu(player);
        return;
      }

      const [flag, params] = args;
      // log({ this: 'eventHandler', message: message.content, flag, params, command, player });
      switch (flag) {
        case 'import': {
          if (params) {
            importJSON(player, params);
          } else {
            sendHelpMenu(player);
          }

          break;
        }

        case 'export': {
          if (params) {
            exportSheet(player, params);
            return;
          }

          listSheetsForExport(player);

          break;
        }

        case 'reset': {
          state.fabula[player.id] = {};
          setDefaults(player.id);
          break;
        }

        case 'help':
        default:
          sendHelpMenu(player);
      }
    };

    const sendHelpMenu = (player) => {
      const blueprint = {
        header: makeHeader({
          text: `FabulaUltimator ${G_CONSTANTS.version}`,
        }),
        body: [
          makeSpan({
            text: 'use the following commands or click links below:',
            style: STYLE_SUBTITLE,
          }),

          // --import
          `<div style="margin-bottom: 8px;">`,
          makeLink({ text: '!fabula --import json', href: '!fabula' }),
          makeSpan({ text: 'Import JSON to sheet' }),
          `</div>`,

          // --export
          `<div style="margin-bottom: 8px;">`,
          makeLink({ text: '!fabula --export [sheetname]', href: '!fabula --export' }),
          makeSpan({ text: 'List sheets to export to JSON, export sheet if provided <sheetname>' }),
          `</div>`,

          // --config
          `<div style="margin-bottom: 8px;">`,
          makeLink({ text: '!fabula --config' }),
          makeSpan({ text: 'View sheet import options' }),
          `</div>`,

          // --reset
          `<div style="margin-bottom: 8px;">`,
          makeLink({ text: '!fabula --reset' }),
          makeSpan({ text: 'Reset player options to defaults' }),
          `</div>`,

          // --help
          `<div style="">`,
          makeLink({ text: '!fabula --help' }),
          makeSpan({ text: 'Show this menu' }),
          `</div>`,
        ],
      };

      // GM specific commands
      if (player && playerIsGM(player.id)) {
        // TBA
      }

      sendChat(G_CONSTANTS.script, fabulaContainer(blueprint), null, { noarchive: true });
    };

    const importJSON = (player, raw) => {
      let json;
      try {
        json = JSON.parse(raw.replace('\\n', ' '));
      } catch (ex) {
        whisper(player, makeError({ error: ex }));
        return;
      }

      if (!json?.name?.length) {
        whisper(player, makeError({ error: 'Sheet name must be defined.' }));
        return;
      }

      let sheet;
      if (state.fabula[player.id].overwrite) {
        const sheets = findObjs({ _type: 'character', name: json.name }, { caseInsensitive: true });
        if (sheets.length) {
          sheet = sheets.shift();

          for (let i = 0; i < sheets.length; i++) {
            sheets[i].remove();
          }
        }
      }

      // create new sheet if one does not exist
      if (!sheet) {
        sheet = createObj('character', {
          name: json.name,
          inplayerjournals: 'all',
          controlledby: player.id,
        });
      }

      whisper(player, fabulaContainer({ body: [`Importing **${json.name}**...`] }));

      sheet.set({
        gmnotes: raw,
      });

      const repeatingUUIDs = {};
      const flatJson = flattenObject(json);
      Object.keys(flatJson).forEach((key) => {
        const prefix = key.match(/(\w+)\[(\w+)\]/g)?.shift();

        if (prefix && !Object.hasOwn(repeatingUUIDs, prefix)) {
          repeatingUUIDs[prefix] = generateRowID();
        }

        addAttributeToSheet(sheet.id, key, flatJson[key], repeatingUUIDs[prefix]);
      });

      sendImportComplete(player, sheet);
    };

    const sendImportComplete = (player, sheet) => {
      const blueprint = {
        header: makeHeader({ text: 'Import Successful!' }),
        body: [createSheetEntry(sheet)],
      };

      whisper(player, fabulaContainer(blueprint));
    };

    const flattenObject = (object) => {
      // The object which contains the final result
      let result = {};

      // loop through the object
      for (const i in object) {
        // We check the type of the i using
        // typeof() function and recursively
        // call the function again
        if (typeof object[i] === 'object') {
          if (!Array.isArray(object[i])) {
            const temp = flattenObject(object[i]);
            for (const j in temp) {
              // Store temp in result
              result[`${i}.${j}`] = temp[j];
            }
          } else {
            for (let j = 0; j < object[i].length; j++) {
              if (typeof object[i][j] === 'object') {
                const temp = flattenObject(object[i][j]);
                Object.keys(temp).forEach((key) => {
                  result[`${i}[${j}].${key}`] = temp[key];
                });
              } else {
                result[`${i}[${j}]`] = object[i][j];
              }
            }
          }
        }

        // Else store object[i] in result directly
        else {
          result[i] = object[i];
        }
      }
      return result;
    };

    const getObjectByPath = (object, path) => {
      // convert indexes to properties
      // strip any leading dot
      path = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
      const properties = path.split('.');
      for (let i = 0; i < properties.length; ++i) {
        const key = properties[i];
        if (key in object) {
          object = object[key];
        } else {
          return;
        }
      }
      return object;
    };

    const crosswalkImportToRoll20 = (path) => {
      // remove array indexes
      path = path.replace(/\[(\w+)\]/g, '');
      return getObjectByPath(IMPORT_TO_ROLL20_CROSSWALK, path);
    };

    const addAttributeToSheet = (id, path, value, uuid) => {
      const attr = crosswalkImportToRoll20(path);
      if (!attr) {
        return;
      }

      let name = attr;
      let max = '';

      if (typeof attr == 'object') {
        name = attr.name;
        max = attr.max ? value : '';
      }

      if (uuid) {
        name = name.replace('-UUID', uuid);
      }

      if (value === true || value === false) {
        value = value ? 'on' : '0';
      }

      createObj('attribute', {
        characterid: id,
        name: name,
        current: value,
        max,
      });
    };

    const generateUUID = (() => {
      let a = 0;
      let b = [];

      return () => {
        let c = new Date().getTime() + 0;
        let f = 7;
        let e = new Array(8);
        let d = c === a;
        a = c;
        for (; 0 <= f; f--) {
          e[f] = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'.charAt(c % 64);
          c = Math.floor(c / 64);
        }
        c = e.join('');
        if (d) {
          for (f = 11; 0 <= f && 63 === b[f]; f--) {
            b[f] = 0;
          }
          b[f]++;
        } else {
          for (f = 0; 12 > f; f++) {
            b[f] = Math.floor(64 * Math.random());
          }
        }
        for (f = 0; 12 > f; f++) {
          c += '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'.charAt(b[f]);
        }
        return c;
      };
    })();

    const generateRowID = () => generateUUID().replace(/_/g, 'Z');

    const listSheetsForExport = (player) => {
      const sheets = findObjs({
        _type: 'character',
      });

      const blueprint = {
        header: makeHeader({ text: 'Sheet Export' }),
        body: [
          makeSpan({
            text:
              'Click to download icon to export JSON<br />' + 'Click sheet name to open journal',
            style: STYLE_SUBTITLE,
          }),
        ],
      };

      // include in export list if
      // - playerIsGM
      // - controlledby = 'all'
      // - controlledby = player.id
      sheets.forEach((sheet) => {
        const controlledby = sheet.get('controlledby');
        if (
          playerIsGM(player?.id) ||
          controlledby.includes('all') ||
          controlledby.includes(player?.id)
        ) {
          blueprint.body.push(createSheetEntry(sheet));
        }
      });

      whisper(player, fabulaContainer(blueprint));
    };

    const exportSheet = async (player, search) => {
      let sheets = findObjs({ _type: 'character', _id: search });
      if (!sheets.length) {
        sheets = findObjs({ _type: 'character', name: search }, { caseInsensitive: true });
      }

      const sheet = sheets.shift();

      // TODO a prettier none sheet left grief
      if (!sheet) {
        whisper(player, `${search} is not a valid sheet.`);
        return;
      }

      const attributes = getAllAttributes(sheet);

      // add name, bio, gminfo
      attributes.push({ name: 'name', current: sheet.get('name'), max: '' });
      const bio = await new Promise((resolve, reject) => {
        sheet.get('bio', resolve);
      });
      attributes.push({ name: 'bio', current: bio, max: '' });
      const gmnotes = await new Promise((resolve, reject) => {
        sheet.get('gmnotes', resolve);
      });
      attributes.push({ name: 'gmnotes', current: gmnotes, max: '' });

      // whisper(player, fabulaContainer(blueprint));
    };

    const getAllAttributes = (sheet) => {
      const exported = [];
      const attributes = findObjs({ _type: 'attribute', _characterid: sheet.id });

      attributes.forEach((attr) => {
        exported.push({
          name: attr.name,
          value: attr.current,
          max: attr.max,
        });
      });
      return exported;
    };

    const STYLE_DOWNLOAD_LINK = [
      `position: relative;`,
      `background: transparent;`,
      `border: 1px solid transparent;`,
      `border-radius: 4px;`,
      `padding: 0px;`,
      `width: 40px;`,
      `height: 40px;`,
    ].join('');
    const createSheetEntry = (sheet) => {
      const sheetId = sheet.get('id');
      const sheetName = sheet.get('name');

      const journal = makeJournalLink(sheet);
      const feather = makeImage({
        src: getAsset('feather'),
        alt: `Download ${sheetName}`,
        style: STYLE_IMAGE,
        width: 20,
        height: 20,
      });
      const download = makeLink({
        text: feather,
        href: `!fabula --export ${sheetId}`,
        style: STYLE_DOWNLOAD_LINK,
        title: `Download ${sheetName}`,
      });

      const sheetEntry = [
        `<table style="width: 100%">`,
        `<tr>`,
        `<td>`,
        journal,
        `</td>`,
        `<td style="float: right;">`,
        download,
        `</td>`,
        `</tr>`,
        `</table>`,
      ];

      return sheetEntry.join('');
    };

    const whisper = (player, message) => {
      const whisperTo = player ? `/w ${player.get('displayname')} ` : '';
      sendChat(G_CONSTANTS.script, `${whisperTo}${message}`, null, {
        noarchive: true,
      });
    };

    const getAsset = (asset) => G_CONSTANTS.assetUrl + G_CONSTANTS.assets[asset];

    const STYLE_CONTAINER = [
      `background: white;`,
      `border-radius: 4px;`,
      `box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px;`,
    ].join('');
    const fabulaContainer = (blueprint) => {
      return [
        `<div style="${STYLE_CONTAINER}">`,
        blueprint.header ? `<div>${blueprint.header}</div>` : '',
        `<div style="padding: 8px;">`,
        `${blueprint.body.join('')}`,
        `</div>`,
        `</div>`,
      ].join('');
    };

    const FONT_TITLE = `font-family: Antonio, sans-serif;`;
    const FONT_BODY = `font-family: 'PT Sans Narrow', sans-serif;`;
    const FONT_MONOSPACE = `font-family: Consolas, monospace;`;

    const STYLE_HEADER = [
      `display: block;`,
      FONT_TITLE,
      `font-size: 1.5rem;`,
      `font-weight: bold;`,
      `line-height: 120%;`,
      `text-transform: uppercase;`,
      `padding: 8px;`,
      `padding-left: 16px;`,
      `color: rgb(255, 255, 255);`,
      `background: rgb(103, 65, 104);`,
      `border-radius: 4px 4px 0 0;`,
    ].join('');
    const makeHeader = ({ text, tag = 'h3', style = STYLE_HEADER }) => {
      return makeSpan({ tag, text, style });
    };

    const STYLE_SUBTITLE = [
      `display: block;`,
      FONT_BODY,
      `font-style: italic;`,
      `margin-bottom: 8px;`,
    ].join('');

    const STYLE_SPAN = [`display: block;`, FONT_BODY].join('');
    const makeSpan = ({ text, tag = 'span', style = STYLE_SPAN }) => {
      return `<${tag} style="${style}">${text}</${tag}>`;
    };

    const STYLE_LINK = [
      `display: block;`,
      FONT_MONOSPACE,
      `background: rgb(110, 70, 141);`,
      `padding: 4px;`,
      `color: white;`,
      `border: none;`,
    ].join('');
    const makeLink = ({ text, href = text, style = STYLE_LINK, title = text }) => {
      return `<a style="${style}" href="${href}" title="${title}">${text}</a>`;
    };

    const STYLE_JOURNAL_LINK = [
      `display: block;`,
      FONT_BODY,
      `background: transparent;`,
      `padding :4px;`,
      `color: black;`,
      `border: none;`,
    ].join('');
    const STYLE_JOURNAL_IMAGE = [`border: 1px solid #000000;`, `border-radius: 4px;`].join('');
    const STYLE_JOURNAL_TEXT = [FONT_TITLE, `text-transform: uppercase;`, `padding: 8px;`].join('');
    const makeJournalLink = (sheet) => {
      const sheetName = sheet.get('name');
      const avatar = sheet.get('avatar');
      const avatarBlocks = [
        `<td>`,
        makeImage({ src: avatar, style: STYLE_JOURNAL_IMAGE, alt: sheetName }),
        `</td>`,
      ].join('');

      const blueprint = [
        `<table>`,
        `<tr>`,
        avatar ? avatarBlocks : null,
        `<td>`,
        `<span style="${STYLE_JOURNAL_TEXT}">${sheetName}</span>`,
        `</td>`,
        `</tr>`,
        `</table>`,
      ];

      return makeLink({
        text: blueprint.join(''),
        href: G_CONSTANTS.journalUrl + sheet.get('id'),
        style: STYLE_JOURNAL_LINK,
        title: `Open ${sheetName}`,
      });
    };

    const STYLE_IMAGE = [`position: absolute;`, `top: 25%;`, `left: 25%;`].join('');
    const makeImage = ({ src, alt, width = 40, height = 40, style = STYLE_IMAGE }) => {
      return [
        `<img `,
        `style="${style}"`,
        `src="${src}"`,
        `alt="${alt}"`,
        `width="${width}"`,
        `height="${height}"`,
        `>`,
      ].join('');
    };

    const STYLE_ERROR = [
      `display: block;`,
      FONT_TITLE,
      `font-size: 1.5rem;`,
      `font-weight: bold;`,
      `line-height: 120%;`,
      `text-transform: uppercase;`,
      `padding: 8px;`,
      `padding-left: 16px;`,
      `color: rgb(255, 255, 255);`,
      `background: rgb(209, 35, 42);`,
      `border-radius: 4px 4px 0 0;`,
    ].join('');
    const makeError = ({ error, header = 'An Error Occurred!' }) => {
      const blueprint = {
        header: makeHeader({ text: header, style: STYLE_ERROR }),
        body: [makeSpan({ text: error })],
      };
      return fabulaContainer(blueprint);
    };

    on('ready', () => {
      FabulaUltimator.checkInstall();
      FabulaUltimator.registerEventHandlers();
      log(`FabulaUltimator ${G_CONSTANTS.version}`);
      sendChat(G_CONSTANTS.script, '!fabula', null, { noarchive: true });
    });

    return {
      checkInstall,
      registerEventHandlers,
    };
  })();
