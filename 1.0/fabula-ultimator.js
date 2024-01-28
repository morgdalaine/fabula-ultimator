var FabulaUltimator =
  FabulaUltimator ||
  (function () {
    const G_CONSTANTS = {
      api: '!fabula',
      script: 'FabulaUltimator',
      version: '0.0',
      commands: {
        help: `!fabula --help`,
        import: `!fabula --import`,
        export: `!fabula --export`,
        config: `!fabula --config`,
        reset: `!fabula --reset`,
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
        case 'help':
        default:
          sendHelpMenu(player);
      }
    };

    const sendHelpMenu = (player) => {
      const helpBlueprint = {
        header: makeHeader({
          text: `FabulaUltimator ${G_CONSTANTS.version}.${Date.now()}`,
        }),
        body: [
          makeSpan({
            text: 'use the following commands or click links below:',
            style: STYLE_SUBTITLE,
          }),

          // --import
          makeLink({ text: '!fabula --import json' }),
          makeSpan({ text: 'Import JSON to sheet' }),

          // --export
          makeLink({ text: '!fabula --export [sheetname]' }),
          makeSpan({ text: 'List sheets to export to JSON, export sheet if provided <sheetname>' }),

          // --config
          makeLink({ text: '!fabula --config' }),
          makeSpan({ text: 'View sheet import options' }),

          // --reset
          makeLink({ text: '!fabula --reset' }),
          makeSpan({ text: 'Reset player options to defaults' }),

          // --help
          makeLink({ text: '!fabula --help' }),
          makeSpan({ text: 'Show this menu' }),
        ],
      };

      // GM specific commands
      if (player && playerIsGM(player.id)) {
        // TBA
      }

      log(helpBlueprint);
      sendChat(G_CONSTANTS.script, fabulaContainer(helpBlueprint), null, {
        noarchive: true,
      });
    };

    const fabulaContainer = (blueprint) => {
      return [
        `<div style="background: white; border-radius: 4px;">`,
        `<div>`,
        blueprint.header,
        `</div>`,
        `<div style="padding: 8px;">`,
        ...blueprint.body,
        `</div>`,
        `</div>`,
      ].join('');
    };

    const FONT_TITLE = `font-family: 'Antonio', sans-serif;`;
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
    ].join(' ');
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

    const STYLE_LINK = [`display: block;`, FONT_MONOSPACE, `background: rgb(110, 70, 141);`].join(
      ''
    );
    const makeLink = ({ text, href = text, style = STYLE_LINK }) => {
      return `<a style="${style}" href="${href}">${text}</a>`;
    };

    on('ready', () => {
      FabulaUltimator.checkInstall();
      FabulaUltimator.registerEventHandlers();
      log(`FabulaUltimator ${G_CONSTANTS.version}.${Date.now()}`);
      sendChat('System', '!fabula --help');
    });

    return {
      checkInstall,
      registerEventHandlers,
    };
  })();
