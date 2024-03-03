var FabulaUltimator =
  FabulaUltimator ||
  (function () {
    const FABULA = {
      api: '!fabula',
      script: 'FabulaUltimator',
      version: 0.1,
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
      name: 'character_name',
      companionlvl: 'companion_skill_level',
      companionpclvl: 'pc_level',
      createdBy: 'createdby',
      description: 'description',
      lvl: 'level',
      multipart: 'multipart',
      phases: 'phases',
      rank: 'rank',
      species: 'species',
      traits: 'traits',
      villain: 'villain',
      id: 'import_id',
      uid: 'import_uid',
      attributes: {
        dexterity: { name: 'dexterity', max: true },
        might: { name: 'might', max: true },
        will: { name: 'willpower', max: true },
        insight: { name: 'insight', max: true },
      },
      affinities: {
        physical: 'physical',
        wind: 'air',
        air: 'air',
        bolt: 'bolt',
        dark: 'dark',
        earth: 'earth',
        fire: 'fire',
        ice: 'ice',
        light: 'light',
        poison: 'poison',
      },
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
      attacks: {
        name: 'repeating_basic-attacks_-UUID_attack_name',
        attr1: 'repeating_basic-attacks_-UUID_attack_attr1',
        attr2: 'repeating_basic-attacks_-UUID_attack_attr2',
        range: 'repeating_basic-attacks_-UUID_attack_distance',
        special: 'repeating_basic-attacks_-UUID_attack_special',
        extraDamage: 'repeating_basic-attacks_-UUID_attack_extra_damage',
        type: 'repeating_basic-attacks_-UUID_attack_damage_type',
      },
      weaponattacks: {
        weapon: {
          category: 'repeating_weapons_-UUID_weapon_category',
          name: 'repeating_weapons_-UUID_weapon_name',
          att1: 'repeating_weapons_-UUID_weapon_attr1',
          att2: 'repeating_weapons_-UUID_weapon_attr2',
          cost: 'repeating_weapons_-UUID_weapon_cost',
          damage: 'repeating_weapons_-UUID_weapon_damage',
          hands: 'repeating_weapons_-UUID_weapon_hands',
          prec: 'repeating_weapons_-UUID_weapon_accuracy',
          range: 'repeating_weapons_-UUID_weapon_range',
          type: 'repeating_weapons_-UUID_weapon_type',
        },
        name: 'repeating_weapons_-UUID_weapon_attack_name',
        special: 'repeating_weapons_-UUID_weapon_special',
        extraDamage: 'repeating_weapons_-UUID_weapon_extra_damage',
        flathit: 'repeating_weapons_-UUID_weapon_attack_accuracy',
        flatdmg: 'repeating_weapons_-UUID_weapon_attack_damage',
      },
      spells: {
        name: 'repeating_spells_-UUID_spell_name',
        attr1: 'repeating_spells_-UUID_spell_attr1',
        attr2: 'repeating_spells_-UUID_spell_attr2',
        // type: 'repeating_spells_-UUID_spell_type',
        duration: 'repeating_spells_-UUID_spell_duration',
        range: 'repeating_spells_-UUID_spell_range',
        mp: 'repeating_spells_-UUID_spell_mp',
        target: 'repeating_spells_-UUID_spell_target',
        special: 'repeating_spells_-UUID_spell_special',
        effect: 'repeating_spells_-UUID_spell_effect',
      },
      notes: {
        name: 'repeating_notes_-UUID_note_name',
        effect: 'repeating_notes_-UUID_note_effect',
      },
      raregear: {
        name: 'repeating_rare-gears_-UUID_raregear_effect',
        effect: 'repeating_rare-gears_-UUID_raregear_name',
      },
      actions: {
        name: 'repeating_other-actions_-UUID_action_name',
        effect: 'repeating_other-actions_-UUID_action_effect',
      },
      special: {
        name: 'repeating_special-rules_-UUID_special_name',
        effect: 'repeating_special-rules_-UUID_special_effect',
      },
    };

    const DEBUG = false;
    const checkInstall = () => {
      if (DEBUG) {
        delete state.fabula;
        // delete all on load when true
        let sheets = findObjs({ _type: 'character' }, { caseInsensitive: true });
        for (let i = 0; i < sheets.length; i++) {
          sheets[i].remove();
        }
      }

      if (!Object.hasOwn(state, 'fabula') || state.fabula.version !== FABULA.version) {
        log(`Update schema to【v${FABULA.version}】`);
        switch (state.fabula && state.fabula.version) {
          case 'Update Schema Version': {
            state.fabula.version = FABULA.version;
            break;
          }

          default: {
            state.fabula = {
              version: FABULA.version,
              cache: { lastsaved: 0 },
              config: {
                overwrite: false,
                inplayerjournals: 'all',
                controlledby: 'all',
              },
            };
          }
        }
      }

      checkGlobalConfig();
      setPlayerDefaults();
    };

    const checkGlobalConfig = () => {
      const s = state.fabula;
      const g = globalconfig && (globalconfig.FabulaUltimator || globalconfig.fabulaultimator);
      if (g && g.lastsaved && g.lastsaved > s.cache.lastsaved) {
        log(`Update from Global Config【${new Date(g.lastsaved * 1000)}】`);

        // Overwrite existing sheets on import
        switch (g.overwrite) {
          case 'off':
            s.config.overwrite = false;
            break;

          case 'on':
          default:
            s.config.overwrite = true;
        }

        // Set default value for In Player Journals
        // Set default value for Controlled By

        state.fabula.cache = globalconfig.fabulaultimator;
      }
    };

    const setPlayerDefaults = (playerid = null) => {
      if (playerid) {
        state.fabula[playerid] = _.clone(state.fabula.config);
      } else {
        findObjs({ _type: 'player' }).forEach((player) => {
          state.fabula[player.id] = _.clone(state.fabula.config);
        });
      }
    };

    const registerEventHandlers = () => {
      on('chat:message', eventHandler);
    };

    const eventHandler = async (message) => {
      if (message.type !== 'api') return;

      // parse message into command and arguments(s)
      const args = message.content
        .split(/--(help|import|export|config|reset)?/g)
        .map((c) => c.trim());
      const command = args.shift();
      const player = getObj('player', message.playerid);

      if (command != FABULA.api) return;
      if (args.length === 0) {
        sendHelpMenu(player);
        return;
      }

      const [flag, params] = args;
      // log({ this: 'eventHandler', message: message.content, flag, params, command });
      switch (flag) {
        case 'import': {
          if (params) {
            importJSON(player, params);
          } else {
            sendHelpMenu(player);
          }

          break;
        }

        // case 'export': {
        //   if (params) {
        //     await exportSheet(player, params);
        //     return;
        //   }

        //   listSheetsForExport(player);

        //   break;
        // }

        case 'config': {
          if (params) {
            updateConfig(player, params);
          }

          sendConfigMenu(player);
          break;
        }

        case 'reset': {
          state.fabula[player.id] = {};
          setPlayerDefaults(player.id);
          sendConfigMenu(player);
          break;
        }

        case 'help':
        default:
          sendHelpMenu(player);
      }
    };

    const whisper = (player, message) => {
      const whisperTo = player ? `/w ${player.get('displayname')} ` : '';
      sendChat(FABULA.script, `${whisperTo}${message}`, null, {
        noarchive: true,
      });
    };

    const sendHelpMenu = (player) => {
      const blueprint = {
        header: makeHeader({
          text: `FabulaUltimator ${FABULA.version}`,
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

          // TODO --export
          // `<div style="margin-bottom: 8px;">`,
          // makeLink({ text: '!fabula --export [sheetname]', href: '!fabula --export' }),
          // makeSpan({ text: 'List sheets to export to JSON, export sheet if provided <sheetname>' }),
          // `</div>`,

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

      // TBA GM specific commands
      // if (player && playerIsGM(player.id)) {}

      whisper(player, fabulaContainer(blueprint), null, { noarchive: true });
    };

    const makeConfigButtons = (setting, value, options, playerid) => {
      return options.map((v) => {
        const text = typeof v === 'boolean' ? (v ? 'yes' : 'no') : v;
        return value === v || (v === 'self' && value === playerid)
          ? makeSpan({ text, style: STYLE_CONFIG_ACTIVE })
          : makeLink({
              text: text,
              href: `!fabula --config ${setting}|${v}`,
              style: STYLE_CONFIG_LINK,
            });
      });
    };

    const sendConfigMenu = (player) => {
      const c = state.fabula[player.id] ?? state.fabula.config;
      const overwriteSettings = makeConfigButtons(
        'overwrite',
        c.overwrite,
        [true, false],
        player.id
      );
      const inJournalSettings = makeConfigButtons(
        'inplayerjournals',
        c.inplayerjournals,
        ['all', 'self', 'none'],
        player.id
      );
      const controlledBySettings = makeConfigButtons(
        'controlledby',
        c.controlledby,
        ['all', 'self', 'none'],
        player.id
      );

      const config = [
        [makeSpan({ text: 'Overwrite Existing Sheets' }), ...overwriteSettings],
        [makeSpan({ text: 'Assign In Player Journals' }), ...inJournalSettings],
        [makeSpan({ text: 'Assign Controlled By' }), ...controlledBySettings],
      ];

      const blueprint = {
        header: makeHeader({
          text: `FabulaUltimator Config`,
        }),
        body: makeConfigOptions(config),
      };

      whisper(player, fabulaContainer(blueprint), { noarchive: true }, { noarchive: true });
    };

    const updateConfig = (player, params) => {
      let [config, value] = params.split('|');
      if (['false', 'true'].includes(value)) value = value === 'true';
      else if (value === 'self') value = player.id;
      state.fabula[player.id][config] = value;
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

          sheet.set({
            inplayerjournals: state.fabula[player.id].inplayerjournals,
            controlledby: state.fabula[player.id].controlledby,
          });
        }
      }

      // create new sheet if one does not exist
      if (!sheet) {
        sheet = createObj('character', {
          name: json.name,
          inplayerjournals: state.fabula[player.id].inplayerjournals,
          controlledby: state.fabula[player.id].controlledby,
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

        const success = addAttributeToSheet(sheet.id, key, flatJson[key], repeatingUUIDs[prefix]);
      });

      createObj('attribute', {
        characterid: sheet.id,
        name: 'sheet_type',
        current: 'bestiary',
      });

      sendImportComplete(player, sheet);
    };

    const addAttributeToSheet = (id, path, value, uuid) => {
      const attr = crosswalkImportToRoll20(path);

      if (!attr) {
        return false;
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

      if (value === 'will') {
        value = 'willpower';
      }

      if (path === 'species') {
        value = value.toLowerCase();
      }

      createObj('attribute', {
        characterid: id,
        name: name,
        current: value,
        max,
      });

      return true;
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

      if (!sheet) {
        whisper(player, makeError({ error: `**${search}** is not a valid sheet.` }));
        return;
      }

      whisper(
        player,
        fabulaContainer({
          header: makeHeader({ text: 'Sheet Export' }),
          body: [`Exporting **${sheet.get('name')}**...`],
        })
      );

      const attributes = await getAllAttributes(sheet);

      // TODO export json in Fultimator format

      whisper(
        player,
        fabulaContainer({
          header: makeHeader({ text: 'Sheet Export' }),
          body: [`<pre>${JSON.stringify(attributes)}</pre>`],
        })
      );
    };

    const getAllAttributes = async (sheet) => {
      const exported = [];
      const attributes = findObjs({ _type: 'attribute', _characterid: sheet.id });
      for (let i = 0; i < attributes.length; i++) {
        const attr = {};
        ['name', 'current', 'max'].forEach((field) => {
          const value = attributes[i].get(field);
          if (value) attr[field] = value;
        });
        exported.push(attr);
      }

      // add name, bio, gminfo
      exported.push({ name: 'character_name', current: sheet.get('name') });

      const bio = await new Promise((resolve, reject) => {
        sheet.get('bio', resolve);
      });
      exported.push({ name: 'bio', current: bio });
      const gmnotes = await new Promise((resolve, reject) => {
        sheet.get('gmnotes', resolve);
      });
      exported.push({ name: 'gmnotes', current: gmnotes });

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

    const getAsset = (asset) => FABULA.assetUrl + FABULA.assets[asset];

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

    const FABULA_DEFAULT_BASE = `#30669c`;
    const FABULA_DEFAULT_ACCENT = `#4575a3`;
    const FABULA_ERROR = `#d1232a`;
    const COLOR_BLACK = `#1d1d1d`;

    const STYLE_HEADER = [
      `display: block;`,
      FONT_TITLE,
      `font-size: 1.5rem;`,
      `font-weight: bold;`,
      `line-height: 120%;`,
      `text-transform: uppercase;`,
      `padding: 8px;`,
      `padding-left: 16px;`,
      `color: white;`,
      `background: ${FABULA_DEFAULT_BASE};`,
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
      `color: ${COLOR_BLACK};`,
    ].join('');

    const STYLE_SPAN = [`display: block;`, FONT_BODY, `color: ${COLOR_BLACK};`].join('');
    const makeSpan = ({ text, tag = 'span', style = STYLE_SPAN }) => {
      return `<${tag} style="${style}">${text}</${tag}>`;
    };

    const STYLE_LINK = [
      `display: block;`,
      FONT_MONOSPACE,
      `background: ${FABULA_DEFAULT_ACCENT};`,
      `padding: 4px;`,
      `color: white;`,
      `border: none;`,
    ].join('');

    const STYLE_CONFIG_LINK = [
      `display: block;`,
      FONT_BODY,
      `background: transparent;`,
      `border-radius: 0;`,
      `border: 1px solid black;`,
      `border-bottom: 2px solid black;`,
      `color: ${COLOR_BLACK};`,
      `padding: 0px 4px;`,
      `text-align: center;`,
    ].join('');
    const STYLE_CONFIG_ACTIVE = [
      `display: block;`,
      FONT_BODY,
      `background: ${FABULA_DEFAULT_ACCENT};`,
      `border-radius: 0px;`,
      `border: 1px solid black;`,
      `border-bottom: 2px solid black;`,
      `color: white;`,
      `padding: 0px 4px;`,
      `text-align: center;`,
    ].join('');
    const makeLink = ({ text, href = text, style = STYLE_LINK, title = text }) => {
      return `<a style="${style}" href="${href}" title="${title}">${text}</a>`;
    };

    const STYLE_JOURNAL_LINK = [
      `display: block;`,
      FONT_BODY,
      `background: transparent;`,
      `padding :4px;`,
      `color: ${COLOR_BLACK};`,
      `border: none;`,
    ].join('');
    const STYLE_JOURNAL_IMAGE = [
      `border: 1px solid black;`,
      `border-radius: 4px;`,
      `color: ${COLOR_BLACK};`,
    ].join('');
    const STYLE_JOURNAL_TEXT = [
      FONT_TITLE,
      `text-transform: uppercase;`,
      `padding: 8px;`,
      `color: ${COLOR_BLACK};`,
    ].join('');
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
        href: FABULA.journalUrl + sheet.get('id'),
        style: STYLE_JOURNAL_LINK,
        title: `Open ${sheetName}`,
      });
    };

    const makeConfigOptions = (settings = []) => {
      const blueprint = [`<table style="width: 100%; padding: 4px 0; border-collapse: collapse;">`];
      settings.forEach((setting) => {
        blueprint.push(`<tr style="padding: 8px 0px;">`);
        setting.forEach((row) => {
          blueprint.push(`<td style="padding: 4px;">`, ...row, `</td>`);
        });
        blueprint.push(`</tr>`);
      });

      blueprint.push(`</table>`);
      return blueprint;
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
      `color: white;`,
      `background:${FABULA_ERROR};`,
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
      log(`FabulaUltimator ${FABULA.version}`);
      sendChat(FABULA.script, '!fabula', null, { noarchive: true });
    });

    return {
      checkInstall,
      registerEventHandlers,
    };
  })();
