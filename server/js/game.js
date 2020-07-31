const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  autoFocus: false,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const players = {};

var scene;

function preload() {
  scene = this;
  scene.load.image('ship1', 'assets/ship1.png');
  scene.load.image('ship2', 'assets/ship2.png');
  scene.load.image('ship3', 'assets/ship3.png');
  scene.load.image('ship4', 'assets/ship4.png');
}

function create() {
  scene.playerGroup = scene.physics.add.group();

  io.on('connection', function(socket) {
    console.log(`A user connected at socket ${socket.id}`);
    // create a new player and add it to our players object
    const team = Math.floor(Math.random() * 4);
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
      },
      socketId: socket.id,
      sprite: `ship${team + 1}`,
      team: team,
    };
    // add player to server
    addPlayer(scene, players[socket.id]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('disconnect', function() {
      console.log('A user disconnected');
      // remove player from server
      removePlayer(scene, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });

    socket.on('playerInput', function(input) {
      handlePlayerInput(socket.id, input);
    });
  });
}

function update() {
  scene.playerGroup.getChildren().forEach((player) => {
    const playerData = players[player.socketId];
    if (playerData) {
      const input = playerData.input;
      if (input.left) {
        player.setAngularVelocity(-300);
      }
      else if (input.right) {
        player.setAngularVelocity(300);
      }
      else {
        player.setAngularVelocity(0);
      }

      if (input.up) {
        scene.physics.velocityFromRotation(player.rotation, 800, player.body.acceleration);
      }
      else {
        player.setAcceleration(0);
      }

      playerData.x = player.x;
      playerData.y = player.y;
      playerData.rotation = player.rotation;
      players[player.socketId] = playerData;
    }
  });

  io.emit('playerUpdates', players);
}


// PLAYER FUNCTIONS ===============================================================================
function addPlayer(scene, playerInfo) {
  const player = scene.physics.add.image(playerInfo.x, playerInfo.y, playerInfo.sprite).setOrigin(0.4, 0.5).setDisplaySize(48, 48);
  scene.playerGroup.add(player);
  player.setDrag(25);
  // player.setDamping(true);
  player.setMaxVelocity(200);
  player.socketId = playerInfo.socketId;
}

function removePlayer(socketId) {
  scene.playerGroup.getChildren().forEach((player) => {
    if (socketId === player.socketId) {
      player.destroy();
    }
  });
}

function handlePlayerInput(socketId, input) {
  players[socketId].input = input;
}

const game = new Phaser.Game(config);
window.gameLoaded();