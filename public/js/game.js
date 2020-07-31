
var config = {
  type: Phaser.AUTO,
  parent: 'space-buddies',
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  render: {
    pixelArt: true
  },
  input: {keyboard: true},
};
 
var game = new Phaser.Game(config);
var scene;
var keys;
var input = {};
 
function preload() {
  scene = this;
  scene.load.image('ship1', 'assets/ship1.png');
  scene.load.image('ship2', 'assets/ship2.png');
  scene.load.image('ship3', 'assets/ship3.png');
  scene.load.image('ship4', 'assets/ship4.png');
}
 
function create() {
  scene.socket = io();
  scene.playerGroup = scene.add.group();

  // Called when joining. Displays all current players.
  scene.socket.on('currentPlayers', function(players) {
    Object.keys(players).forEach((id) => {
      const playerInfo = players[id];
      displayPlayer(playerInfo);
    });
  });

  // When new player joins, display it.
  scene.socket.on('newPlayer', function(playerInfo) {
    displayPlayer(playerInfo);
  });

  scene.socket.on('disconnect', function(socketId) {
    scene.playerGroup.getChildren().forEach(function(player) {
      if (socketId === player.socketId) {
        player.destroy();
      }
    });
  });

  scene.socket.on('playerUpdates', function(playerUpdates) {
    scene.playerGroup.getChildren().forEach((player) => {
      const playerData = playerUpdates[player.socketId];
      if (playerData) {
        player.setRotation(playerData.rotation);
        player.setPosition(playerData.x, playerData.y);
      }
    });
  });

  keys = scene.input.keyboard.addKeys('W,A,S,D,up,down,left,right');
}
 
function update() {
  const newInput = {
    up: keys.up.isDown || keys.W.isDown,
    down: keys.down.isDown || keys.S.isDown,
    left: keys.left.isDown || keys.A.isDown,
    right: keys.right.isDown || keys.D.isDown,
  }

  let inputChangedThisFrame = false;
  Object.keys(newInput).forEach(key => {
    if (input[key] !== newInput[key]) {
      inputChangedThisFrame = true;
    }
  });

  // Only send input to the server when there's a change.
  if (inputChangedThisFrame) {
    input = newInput;
    scene.socket.emit('playerInput', input);
  }
}

function displayPlayer(playerInfo) {
  const player = scene.add.sprite(playerInfo.x, playerInfo.y, playerInfo.sprite).setOrigin(0.4, 0.5).setDisplaySize(48, 48);
  player.socketId = playerInfo.socketId;
  scene.playerGroup.add(player); //Add newly created player object to playergroup
}