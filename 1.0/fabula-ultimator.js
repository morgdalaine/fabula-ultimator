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

    const defaultState = {
      overwrite: false,
      journal: 'all',
      controllers: 'all',
    };

    const checkInstall = () => {
      // delete all on load when true
      const debug = false;
      if (debug) {
        delete state.fabula;
        let objects = findObjs({ _type: 'character' }, { caseInsensitive: true });
        for (let i = 0; i < objects.length; i++) {
          objects[i].remove();
        }
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
      log({ this: 'eventHandler', message: message.content, flag, params, command, player });
      switch (flag) {
        case 'export':
          if (params) {
            exportSheet(player, params);
            return;
          }

          listSheetsForExport(player);

          break;

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

      log(sheet);
      const attributes = getAllAttributes(sheet);
      log('exportSheet => ');
      log(attributes);

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
      const attributes = findObjs({ _type: 'attribute', _characterid: sheet.id });
      log('getAllAttribute => ');
      log(attributes);

      const exported = [];
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

    on('ready', () => {
      FabulaUltimator.checkInstall();
      FabulaUltimator.registerEventHandlers();
      log(`FabulaUltimator ${G_CONSTANTS.version}`);
      sendChat('System', '!fabula');
    });

    return {
      checkInstall,
      registerEventHandlers,
    };
  })();
