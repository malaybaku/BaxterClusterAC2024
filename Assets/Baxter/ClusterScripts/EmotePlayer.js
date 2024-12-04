// Player Local UIで、複数のエモートを選択して再生できるようにする例です。
// VRでも動作するスクリプトですが、VRでは「ボタンを押してアバターモーションを行う」という操作の体験は必ずしも最適ではないため、
// VRでは何もしないスクリプトにも出来るようになっています。

// === モーション内容に応じてカスタムする部分 ===

// VRでUI表示をスキップするかどうか。trueにすると、VRではUIを表示しなくなる
const skipOnVr = false;

// エモートの数. 1~10のあいだの値を指定する。
// - ここで指定した個数だけ、HumanoidAnimationListに"Motion0", "Motion1", ... という名前でモーションを指定する
// - emoteDurationの要素数もemoteCountと合わせる
const emoteCount = 6;

// エモートの再生時間を順に指定する。emoteCountで指定した数だけ数値を数値する
// - マイナスを指定すると再生時間が無限になる
// - ゼロを指定すると、アニメーション自体の長さが使われる
// - プラスの値を指定すると、その時間だけ再生する。アニメーションより長いぶんの時間はループ再生になる
const emoteDurations = [
  4.6,
  -1,
  -1,
  5.0,
  -1,
  -1
];

// エモートの再生時間がモーションの再生時間より長いとき、終端状態の姿勢をキープするかどうかを指定する。
// emoteCountで指定した数だけ数値を数値する。
// 写真の撮影用ポーズとかではtrueにし、ダンスや日常的な動作ではfalse
const emoteHoldEnd = [
  false,
  false,
  false,
  false,
  true, 
  true
];

// === ここから下は編集しないでも動く想定 ===

const emoteMaxCount = 10;
const motionFadeDuration = 0.5;

let isOpen = false;

let currentMotionIndex = -1;
let currentMotion = null;
let currentMotionHoldEnd = false;
let currentMotionTime = 0;

const onStart = () => { 
  // この機能を使わない場合、初期状態で Player Local UI 以下の各要素が非表示なのをそのままにしておく
  if (skipOnVr && _.isVr) { 
    return;
  }

  _.playerLocalObject("EmoteOpenCloseButton").setEnabled(true);

  const rootObj = _.playerLocalObject("EmoteAreaRoot");

  for (let i = 0; i < emoteMaxCount; i++) {

    let buttonObj = rootObj.findObject(`EmoteButton${i}`);

    if (i >= emoteCount) {
      // UI上に余裕を持って配置してあるがエモートが割り当らないボタン: 隠しておく
      buttonObj.setEnabled(false);
      continue;
    }

    buttonObj
      .getUnityComponent("Button")
      .onClick(isDown => {
        if (!isDown) return;

        currentMotionIndex = i;
        currentMotion = _.humanoidAnimation(`Motion${i}`);
        currentMotionTime = 0;
        currentMotionHoldEnd = emoteHoldEnd[i];
      });

    // 終了状態でキープするモーション or ループモーション or 通常モーション、で補足アイコンを出し分ける
    if (emoteHoldEnd[i]) { 
      buttonObj.findObject("HoldEndIcon").setEnabled(true);  
      buttonObj.findObject("LoopIcon").setEnabled(false);
    } else if (emoteDurations[i] < 0) {       
      buttonObj.findObject("HoldEndIcon").setEnabled(false); 
      buttonObj.findObject("LoopIcon").setEnabled(true);  
    } else {
      buttonObj.findObject("HoldEndIcon").setEnabled(false); 
      buttonObj.findObject("LoopIcon").setEnabled(false);  
    }
  }  
};


onStart();

_.playerLocalObject("EmoteOpenCloseButton").getUnityComponent("Button").onClick((isDown) => { 
  if (isDown) {
    isOpen = !isOpen;
    _.playerLocalObject("EmoteAreaRoot").setEnabled(isOpen);
    _.playerLocalObject("EmoteStopButton").setEnabled(isOpen);
  }
});

_.playerLocalObject("EmoteStopButton").getUnityComponent("Button").onClick((isDown) => { 
  if (isDown) { 
    currentMotionIndex = -1;
    currentMotion = null;
    currentMotionHoldEnd = false;
    currentMotionTime = 0;
  }
});

_.onFrame((deltaTime) => { 
  if (currentMotion == null) { 
    return;
  }
  
  currentMotionTime += deltaTime;

  let len = currentMotion.getLength();
  let duration = emoteDurations[currentMotionIndex];
  if (duration == 0) {
    duration = len;
  }

  // 再生が終わった = モーション再生しない状態に戻る
  if (duration > 0 && currentMotionTime > duration) { 
    currentMotion = null;
    return;
  }

  // 開始/終了ではモーションがフェードする。
  // ただし、ループモーションの終了は検知しにくいのでフェード対象から外す
  let weight = 1;
  if (currentMotionTime < motionFadeDuration) {
   weight = currentMotionTime / motionFadeDuration;
  } else if (duration > 0 && currentMotionTime > duration - motionFadeDuration) { 
    weight = (duration - currentMotionTime) / motionFadeDuration;
  }

  let motionTime = 
  currentMotionTime;
  if (currentMotionHoldEnd && motionTime > len) {
    motionTime = len;
  } else {
    motionTime = motionTime % len;
  }

  let pose = currentMotion.getSample(motionTime);
  _.setHumanoidPoseOnFrame(pose, weight);
});
