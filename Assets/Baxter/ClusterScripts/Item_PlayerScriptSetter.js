// 入室したユーザーにPlayerScriptを適用するスクリプト。
// creator guideに掲載のスクリプトを改造しています。
// https://creator.cluster.mu/2024/07/08/playerscript-2/
const attachInverval = 1.0;

$.onStart(() => {
  $.state.players = [];
  $.state.time = 0;
});

$.onUpdate((deltaTime) => {
  $.state.time += deltaTime;
  if ($.state.time > attachInverval) {
    $.state.time = 0;
    updateAttachedPlayers();
  }
});

const updateAttachedPlayers = () => { 
  // 適用済みプレイヤーの一覧。居なくなったプレイヤーをfilterで除外
  let attachedPlayers = $.state.players.filter(player => player.exists());

  // ワールド内の全プレイヤーのうち、適用済み一覧に入っていないプレイヤーを取得
  let players = $.getPlayersNear($.getPosition(), Infinity);
  let playersToAttach = players.filter(player => !attachedPlayers.some(attachedPlayer => attachedPlayer.id === player.id));

  // 適用済みプレイヤーに追加
  playersToAttach.forEach(player => {
    $.setPlayerScript(player);
    attachedPlayers.push(player);
  });
  $.state.players = attachedPlayers;
};
