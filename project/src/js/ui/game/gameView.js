/** @jsx m */
var session = require('../../session');
var roundView = require('../round/view/roundView');
var gameApi = require('../../lichess/game');
var gamesMenu = require('../gamesMenu');
var loginModal = require('../loginModal');
var layout = require('../layout');
var menu = require('../menu');
var settings = require('../../settings');
var utils = require('../../utils');
var helper = require('../helper');
var widgets = require('../widget/common');
var popupWidget = require('../widget/popup');
var i18n = require('../../i18n');

function gameInfos(gameData) {
  const mode = gameData.game.rated ? i18n('rated') : i18n('casual');
  return (
    <div className="gameInfos">
      <p className="explanation small">{`${i18n('variant')}: ${gameData.game.variant.name}`}</p>
      <p className="time small" data-icon="p">{gameApi.time(gameData)}</p>
      <p className="mode small">{`${i18n('mode')}: ${mode}`}</p>
    </div>
  );
}

function joinOverlay(ctrl) {
  var data = ctrl.getData();
  var opp = data.opponent.user;
  var joinDom;
  if (data.game.rated && !session.isConnected()) {
    joinDom = m('div.error', [
      i18n('thisGameIsRated'), m('br'), m('br'), i18n('mustSignInToJoin'),
      m('div.go_or_cancel', [
        m('button.binary_choice[data-icon=E]', {
          config: helper.ontouchend(loginModal.open)
        }, i18n('signIn')),
        m('button.binary_choice[data-icon=L]', {
          config: helper.ontouchend(utils.backHistory)
        }, i18n('cancel'))
      ])
    ]);
  } else {
    joinDom = m('div.go_or_cancel', [
      m('button.binary_choice[data-icon=E]', {
          config: helper.ontouchend(utils.f(ctrl.joinChallenge, data.game.id))
      }, i18n('join')),
      m('button.binary_choice[data-icon=L]', {
        config: helper.ontouchend(utils.backHistory)
      }, i18n('cancel'))
    ]);
  }

  return function() {
    return popupWidget(
      'join_url_challenge',
      opp ? opp.username : 'Anonymous',
      m('div.infos', [
        gameInfos(data),
        m('br'),
        joinDom
      ]),
      true
    );
  };
}

function awaitInviteOverlay(ctrl) {
  var data = ctrl.getData();

  return function() {
    return popupWidget(
      'await_url_challenge',
      null,
      m('div.infos', [
        m('p.explanation', i18n('toInviteSomeoneToPlayGiveThisUrl')),
        m('input.lichess_game_url', {
          value: gameApi.publicUrl(data),
          readonly: true
        }),
        m('p.explanation.small', i18n('theFirstPersonToComeOnThisUrlWillPlayWithYou')),
        m('div.go_or_cancel.clearfix', [
          m('button.binary_choice[data-icon=E]', {
            config: helper.ontouchend(function() {
              window.plugins.socialsharing.share(null, null, null, gameApi.publicUrl(data));
            })
          }, i18n('shareGameURL')),
          m('button.binary_choice[data-icon=L]', {
            config: helper.ontouchend(ctrl.cancelChallenge)
          }, i18n('cancel'))
        ]),
        m('br'),
        gameInfos(data)
      ]),
      true
    );
  };
}

function awaitChallengeOverlay(ctrl) {
  const popupContent = (
    <div className="infos">
      <div className="user">{m.route.param('userId')}</div>
      <br />
      <div className="loader"><span data-icon="U" /></div>
      <br />
      <p>{i18n('waitingForOpponent')}</p>
      <button data-icon="L" config={helper.ontouchend(ctrl.cancelChallenge)}>
        {i18n('cancel')}
      </button>
      <br />
      {gameInfos(ctrl.getData())}
    </div>
  );

  return function() {
    return popupWidget('await_url_challenge', i18n('challengeToPlay'), popupContent, true);
  };
}

module.exports = function(ctrl) {
  if (ctrl.getRound()) return roundView(ctrl.getRound());

  var theme = settings.general.theme;
  var pov = gamesMenu.lastJoined;
  var header, board, overlay;

  if (pov) {
    header = widgets.connectingHeader;
    board = utils.partialf(widgets.boardArgs, pov.fen, pov.lastMove, pov.color,
      pov.variant.key, theme.board(), theme.piece());
  } else {
    header = utils.partialf(widgets.header, 'lichess.org');
    board = widgets.board;
  }

  if (ctrl.isJoinable()) overlay = joinOverlay(ctrl);
  else if (ctrl.isAwaitingInvite()) overlay = awaitInviteOverlay(ctrl);
  else if (ctrl.isAwaitingChallenge()) overlay = awaitChallengeOverlay(ctrl);

  return layout.board(header, board, widgets.empty, menu.view, overlay,
    pov ? pov.color : null);
};
