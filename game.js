// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 256,
    height: 240,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        zoom: 3
    }
};

const game = new Phaser.Game(config);

// Game state
let player;
let cursors;
let currentScreen = { x: 0, y: 0 };
let isTransitioning = false;
let playerSpeed = 80;
let walls;
let tileSize = 16;
let enemies;
let sword;
let attackKey;
let hearts = [];
let canTakeDamage = true;
let items;
let inventory = { keys: 0, rupees: 0, bombs: 0, bosskeys: 0 };
let inventoryText;
let obstacles;
let useKeyText;
let audioContext;
let sounds = {};
let boss = null;
let bossDefeated = false;
let victoryText = null;

function preload() {
    // Load tileset spritesheet (9 tiles per row, not 8)
    this.load.spritesheet('tileset', 'tile_ground.png', {
        frameWidth: 16,
        frameHeight: 16
    });

    // Create other sprites programmatically
    createSprites(this);

    // Initialize audio (try/catch in case it fails)
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Audio not available:', e);
    }
}

function create() {
    // Create initial map
    createMap(this, 0, 0);

    // Create player
    player = this.physics.add.sprite(128, 120, 'player_down');
    player.setCollideWorldBounds(false);
    player.setDepth(10);
    player.health = 6;
    player.direction = 'down';

    // Create sword (hidden initially)
    sword = this.physics.add.sprite(0, 0, 'sword');
    sword.setVisible(false);
    sword.setActive(false);
    sword.setDepth(11);

    // Create enemies
    enemies = this.physics.add.group();
    spawnEnemies(this, currentScreen.x, currentScreen.y);

    // Create items
    items = this.physics.add.group();
    spawnItems(this, currentScreen.x, currentScreen.y);

    // Create obstacles
    obstacles = this.physics.add.group();
    spawnObstacles(this, currentScreen.x, currentScreen.y);

    // Create health display
    createHealthDisplay(this);

    // Create inventory display
    createInventoryDisplay(this);

    // Create use key prompt
    useKeyText = this.add.text(128, 200, '', {
        fontSize: '10px',
        fill: '#fff',
        fontFamily: 'monospace',
        backgroundColor: '#000',
        padding: { x: 4, y: 2 }
    });
    useKeyText.setOrigin(0.5);
    useKeyText.setDepth(100);
    useKeyText.setVisible(false);

    // Collision
    this.physics.add.collider(player, walls);
    this.physics.add.collider(enemies, walls);
    this.physics.add.collider(player, obstacles, null, collideWithObstacle, this);
    this.physics.add.collider(enemies, obstacles);
    this.physics.add.overlap(sword, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, playerHitByEnemy, null, this);
    this.physics.add.overlap(player, items, collectItem, null, this);

    // Input
    cursors = this.input.keyboard.createCursorKeys();
    attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

function update() {
    if (isTransitioning) return;

    // Player movement
    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-playerSpeed);
        player.direction = 'left';
        player.setTexture('player_left');
    } else if (cursors.right.isDown) {
        player.setVelocityX(playerSpeed);
        player.direction = 'right';
        player.setTexture('player_right');
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-playerSpeed);
        player.direction = 'up';
        player.setTexture('player_up');
    } else if (cursors.down.isDown) {
        player.setVelocityY(playerSpeed);
        player.direction = 'down';
        player.setTexture('player_down');
    }

    // Attack
    if (Phaser.Input.Keyboard.JustDown(attackKey) && !sword.visible) {
        attackWithSword(this);
    }

    // Update enemies
    updateEnemies(this);

    // Check for door interaction
    checkDoorInteraction(this);

    // Check for screen transitions
    checkScreenTransition(this);
}

function createSprites(scene) {
    // Player sprite facing down
    const playerDown = scene.make.graphics({x: 0, y: 0, add: false});
    playerDown.fillStyle(0x00ff00);
    playerDown.fillRect(0, 0, 16, 16);
    playerDown.fillStyle(0x003300);
    playerDown.fillRect(4, 10, 3, 4);
    playerDown.fillRect(9, 10, 3, 4);
    playerDown.generateTexture('player_down', 16, 16);
    playerDown.destroy();

    // Player sprite facing up
    const playerUp = scene.make.graphics({x: 0, y: 0, add: false});
    playerUp.fillStyle(0x00ff00);
    playerUp.fillRect(0, 0, 16, 16);
    playerUp.fillStyle(0x003300);
    playerUp.fillRect(4, 2, 3, 4);
    playerUp.fillRect(9, 2, 3, 4);
    playerUp.generateTexture('player_up', 16, 16);
    playerUp.destroy();

    // Player sprite facing left
    const playerLeft = scene.make.graphics({x: 0, y: 0, add: false});
    playerLeft.fillStyle(0x00ff00);
    playerLeft.fillRect(0, 0, 16, 16);
    playerLeft.fillStyle(0x003300);
    playerLeft.fillRect(2, 4, 4, 3);
    playerLeft.fillRect(2, 9, 4, 3);
    playerLeft.generateTexture('player_left', 16, 16);
    playerLeft.destroy();

    // Player sprite facing right
    const playerRight = scene.make.graphics({x: 0, y: 0, add: false});
    playerRight.fillStyle(0x00ff00);
    playerRight.fillRect(0, 0, 16, 16);
    playerRight.fillStyle(0x003300);
    playerRight.fillRect(10, 4, 4, 3);
    playerRight.fillRect(10, 9, 4, 3);
    playerRight.generateTexture('player_right', 16, 16);
    playerRight.destroy();

    // Grass, wall, and water tiles are now loaded from tileset in preload()

    // Enemy sprite
    const enemy = scene.make.graphics({x: 0, y: 0, add: false});
    enemy.fillStyle(0xff0000);
    enemy.fillRect(0, 0, 16, 16);
    enemy.generateTexture('enemy', 16, 16);
    enemy.destroy();

    // Sword sprite
    const swordGraphics = scene.make.graphics({x: 0, y: 0, add: false});
    swordGraphics.fillStyle(0xc0c0c0);
    swordGraphics.fillRect(0, 0, 16, 8);
    swordGraphics.generateTexture('sword', 16, 8);
    swordGraphics.destroy();

    // Heart sprite
    const heart = scene.make.graphics({x: 0, y: 0, add: false});
    heart.fillStyle(0xff0000);
    heart.fillRect(0, 3, 3, 2);
    heart.fillRect(5, 3, 3, 2);
    heart.fillRect(0, 5, 8, 3);
    heart.fillTriangle(0, 8, 8, 8, 4, 10);
    heart.generateTexture('heart', 8, 11);
    heart.destroy();

    // Key sprite
    const key = scene.make.graphics({x: 0, y: 0, add: false});
    key.fillStyle(0xffd700);
    key.fillRect(2, 2, 12, 4);
    key.fillRect(12, 0, 4, 8);
    key.generateTexture('key', 16, 8);
    key.destroy();

    // Rupee sprite
    const rupee = scene.make.graphics({x: 0, y: 0, add: false});
    rupee.fillStyle(0x00ff00);
    rupee.fillRect(4, 0, 8, 4);
    rupee.fillRect(2, 4, 12, 4);
    rupee.fillRect(4, 8, 8, 4);
    rupee.generateTexture('rupee', 16, 12);
    rupee.destroy();

    // Rock sprite
    const rock = scene.make.graphics({x: 0, y: 0, add: false});
    rock.fillStyle(0x808080);
    rock.fillRect(0, 0, 16, 16);
    rock.generateTexture('rock', 16, 16);
    rock.destroy();

    // Door sprite (32x16 - double width)
    const door = scene.make.graphics({x: 0, y: 0, add: false});
    door.fillStyle(0x8b4513);
    door.fillRect(0, 0, 32, 16);
    door.fillStyle(0x000000);
    door.fillRect(6, 6, 4, 4);
    door.fillRect(22, 6, 4, 4);
    door.generateTexture('door', 32, 16);
    door.destroy();

    // Health potion sprite
    const potion = scene.make.graphics({x: 0, y: 0, add: false});
    potion.fillStyle(0xff1493);
    potion.fillRect(4, 4, 8, 8);
    potion.fillStyle(0xffffff);
    potion.fillRect(5, 5, 6, 3);
    potion.generateTexture('potion', 16, 12);
    potion.destroy();

    // Bomb sprite
    const bomb = scene.make.graphics({x: 0, y: 0, add: false});
    bomb.fillStyle(0x000000);
    bomb.fillCircle(8, 8, 6);
    bomb.fillStyle(0xff0000);
    bomb.fillCircle(8, 8, 3);
    bomb.generateTexture('bomb', 16, 16);
    bomb.destroy();

    // Boss sprite (larger red/black enemy)
    const boss = scene.make.graphics({x: 0, y: 0, add: false});
    boss.fillStyle(0x8b0000);
    boss.fillRect(0, 0, 32, 32);
    boss.fillStyle(0x000000);
    boss.fillRect(4, 4, 24, 24);
    boss.fillStyle(0xff0000);
    boss.fillRect(8, 8, 16, 16);
    boss.generateTexture('boss', 32, 32);
    boss.destroy();

    // Boss key sprite (red key)
    const bossKey = scene.make.graphics({x: 0, y: 0, add: false});
    bossKey.fillStyle(0xff0000);
    bossKey.fillRect(2, 2, 12, 4);
    bossKey.fillRect(12, 0, 4, 8);
    bossKey.generateTexture('bosskey', 16, 8);
    bossKey.destroy();
}

function playSound(frequency, duration, type = 'sine') {
    try {
        if (!audioContext) return;

        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Silently fail if audio doesn't work
        console.log('Audio error:', e);
    }
}

function playSwordSound() {
    playSound(200, 0.1, 'square');
}

function playHitSound() {
    playSound(150, 0.15, 'sawtooth');
}

function playItemSound() {
    playSound(800, 0.2, 'sine');
}

function playDamageSound() {
    playSound(100, 0.3, 'triangle');
}

function playDoorSound() {
    playSound(400, 0.3, 'square');
}

function createMap(scene, screenX, screenY) {
    walls = scene.physics.add.staticGroup();

    // Map layouts (16x15 tiles)
    const maps = getMapLayout(screenX, screenY);

    // If room doesn't exist, don't create it
    if (!maps) {
        console.error(`Cannot create map for non-existent room ${screenX},${screenY}`);
        return;
    }

    // Array of grass tile variations
    const grassTiles = [67, 68, 69, 76, 77, 78];

    for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 16; x++) {
            const tile = maps[y][x];
            const px = x * tileSize + 8;
            const py = y * tileSize + 8;

            if (tile === 0) {
                // Grass tile - randomly select from grass variety tiles
                const randomGrassFrame = Phaser.Math.RND.pick(grassTiles);
                const grassTile = scene.add.image(px, py, 'tileset', randomGrassFrame);
                grassTile.setDepth(0);
            } else if (tile === 1) {
                // Wall/rock tile - frame 27
                const wallTile = scene.add.image(px, py, 'tileset', 27);
                wallTile.setDepth(1);
                walls.add(wallTile);
            } else if (tile === 2) {
                // Water tile - frame 13
                const waterTile = scene.add.image(px, py, 'tileset', 13);
                waterTile.setDepth(0);
                walls.add(waterTile);
            }
        }
    }
}

function getMapLayout(screenX, screenY) {
    // Define 9x9 world boundaries (0 to 8 in both directions)
    const minX = 0, maxX = 8;
    const minY = 0, maxY = 8;

    // Check if this room is within world bounds
    if (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY) {
        return null; // Outside world bounds
    }

    // Check if neighboring rooms exist (within bounds)
    const hasLeft = screenX > minX;
    const hasRight = screenX < maxX;
    const hasUp = screenY > minY;
    const hasDown = screenY < maxY;

    // 0=grass, 1=wall, 2=water
    const mapData = {
        '8,8': [
            // BOSS ROOM - far corner
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1]
        ],
        '0,0': [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,2,2,2,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,2,2,2,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,2,2,2,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1]
        ],
        '1,0': [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,2,2,2,2,2,0,0,0,0,0,1],
            [1,0,0,0,0,2,2,2,2,2,0,0,0,0,0,1],
            [1,0,0,0,0,2,2,2,2,2,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1]
        ],
        '0,1': [
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
            [1,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
            [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        '1,1': [
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,2,2,2,2,2,2,2,0,0,0,0,1],
            [1,0,0,0,2,2,2,2,2,2,2,0,0,0,0,1],
            [1,0,0,0,2,2,2,2,2,2,2,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        '0,-1': [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1],
            [1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1],
            [1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1]
        ],
        '-1,0': [
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,2,2,2,2,2,2,0,0,0,0,0,1],
            [1,0,0,0,2,2,2,2,2,2,0,0,0,0,0,1],
            [1,0,0,0,2,2,2,2,2,2,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        '2,0': [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        '-1,1': [
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        '-1,-1': [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1]
        ]
    };

    const key = `${screenX},${screenY}`;

    // Get base room layout (use predefined or generate from template)
    let room;

    if (mapData[key]) {
        // Use predefined room
        room = JSON.parse(JSON.stringify(mapData[key]));
    } else {
        // Generate room from template based on coordinates
        room = generateRoomFromTemplate(screenX, screenY);
    }

    // Wall off edges that don't connect to anything
    if (!hasLeft) {
        // Close left edge
        room[7][0] = 1;
    }
    if (!hasRight) {
        // Close right edge
        room[7][15] = 1;
    }
    if (!hasUp) {
        // Close top edge
        room[0][9] = 1;
        room[0][10] = 1;
    }
    if (!hasDown) {
        // Close bottom edge
        room[14][9] = 1;
        room[14][10] = 1;
    }

    return room;
}

function generateRoomFromTemplate(screenX, screenY) {
    // Create different room types based on coordinates
    const sum = screenX + screenY;
    const roomType = sum % 5; // 5 different room templates

    // Base empty room with all openings
    let room = [
        [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1]
    ];

    // Add features based on room type
    if (roomType === 0) {
        // Empty room - no obstacles
    } else if (roomType === 1) {
        // Small water pond in center
        room[6][7] = 2; room[6][8] = 2;
        room[7][7] = 2; room[7][8] = 2;
        room[8][7] = 2; room[8][8] = 2;
    } else if (roomType === 2) {
        // Wall blocks scattered
        room[4][4] = 1; room[4][11] = 1;
        room[10][4] = 1; room[10][11] = 1;
    } else if (roomType === 3) {
        // Large water area
        room[5][5] = 2; room[5][6] = 2; room[5][7] = 2; room[5][8] = 2; room[5][9] = 2; room[5][10] = 2;
        room[6][5] = 2; room[6][6] = 2; room[6][7] = 2; room[6][8] = 2; room[6][9] = 2; room[6][10] = 2;
        room[7][5] = 2; room[7][6] = 2; room[7][7] = 2; room[7][8] = 2; room[7][9] = 2; room[7][10] = 2;
        room[8][5] = 2; room[8][6] = 2; room[8][7] = 2; room[8][8] = 2; room[8][9] = 2; room[8][10] = 2;
    } else if (roomType === 4) {
        // Wall barriers
        room[3][3] = 1; room[3][4] = 1; room[3][5] = 1;
        room[3][10] = 1; room[3][11] = 1; room[3][12] = 1;
        room[11][3] = 1; room[11][4] = 1; room[11][5] = 1;
        room[11][10] = 1; room[11][11] = 1; room[11][12] = 1;
    }

    return room;
}

function createHealthDisplay(scene) {
    for (let i = 0; i < 6; i++) {
        const heart = scene.add.image(10 + (i * 10), 10, 'heart');
        heart.setScrollFactor(0);
        heart.setDepth(100);
        hearts.push(heart);
    }
}

function createInventoryDisplay(scene) {
    inventoryText = scene.add.text(10, 225, 'Keys: 0  Rupees: 0  Bombs: 0', {
        fontSize: '10px',
        fill: '#fff',
        fontFamily: 'monospace'
    });
    inventoryText.setScrollFactor(0);
    inventoryText.setDepth(100);
}

function updateInventoryDisplay() {
    inventoryText.setText(`Keys: ${inventory.keys}  Rupees: ${inventory.rupees}  Bombs: ${inventory.bombs}`);
}

function updateHealthDisplay() {
    for (let i = 0; i < hearts.length; i++) {
        hearts[i].setVisible(i < player.health);
    }
}

function playerHitByEnemy(player, enemy) {
    if (!canTakeDamage) return;

    try {
        player.health--;
        playDamageSound();
        updateHealthDisplay();
        canTakeDamage = false;

        // Flash player
        player.setTint(0xff0000);

        if (player.health <= 0) {
            gameOver();
        }

        // Invincibility period
        setTimeout(() => {
            if (player && player.clearTint) {
                player.clearTint();
            }
            canTakeDamage = true;
        }, 1000);
    } catch (e) {
        console.log('Error in playerHitByEnemy:', e);
        canTakeDamage = true;
    }
}

function gameOver() {
    console.log('Game Over!');
    player.setVelocity(0);
}

function showVictoryScreen(scene) {
    if (!victoryText) {
        victoryText = scene.add.text(128, 120, 'YOU WIN!\n\nBoss Defeated!\n\nCollect the Boss Key!', {
            fontSize: '14px',
            fill: '#ffd700',
            fontFamily: 'monospace',
            align: 'center',
            backgroundColor: '#000',
            padding: { x: 10, y: 10 }
        });
        victoryText.setOrigin(0.5);
        victoryText.setDepth(200);

        scene.time.delayedCall(3000, () => {
            if (victoryText) victoryText.destroy();
        });
    }
}

function collideWithObstacle(player, obstacle) {
    // Only collide with rocks, not doors
    return obstacle.obstacleType === 'rock';
}

function spawnObstacles(scene, screenX, screenY) {
    const obstacleData = {
        '7,8': [
            {type: 'door', x: 240, y: 120, isBossDoor: true}
        ],
        '4,4': [
            {type: 'rock', x: 112, y: 64}
        ],
        '2,2': [
            {type: 'door', x: 240, y: 120}
        ],
        '6,6': [
            {type: 'door', x: 240, y: 120}
        ]
    };

    const key = `${screenX},${screenY}`;
    const obstaclesToSpawn = obstacleData[key] || [];

    obstaclesToSpawn.forEach(data => {
        const obstacle = obstacles.create(data.x, data.y, data.type);
        obstacle.setDepth(8);
        obstacle.setImmovable(true);
        obstacle.obstacleType = data.type;
        obstacle.isBossDoor = data.isBossDoor || false;

        // Make doors wider (32 pixels)
        if (data.type === 'door') {
            obstacle.setDisplaySize(32, 16);
        }
    });
}

function checkDoorInteraction(scene) {
    useKeyText.setVisible(false);

    obstacles.children.entries.forEach(obstacle => {
        if (obstacle.obstacleType === 'door') {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                obstacle.x, obstacle.y
            );

            if (distance < 24) {
                if (obstacle.isBossDoor) {
                    // Boss door requires boss key
                    if (inventory.bosskeys > 0) {
                        useKeyText.setText('Press E to use boss key');
                        useKeyText.setVisible(true);

                        if (scene.input.keyboard.addKey('E').isDown) {
                            inventory.bosskeys--;
                            playDoorSound();
                            updateInventoryDisplay();
                            obstacle.destroy();
                            useKeyText.setVisible(false);
                        }
                    } else {
                        useKeyText.setText('Need boss key!');
                        useKeyText.setVisible(true);
                    }
                } else {
                    // Regular door requires regular key
                    if (inventory.keys > 0) {
                        useKeyText.setText('Press E to use key');
                        useKeyText.setVisible(true);

                        if (scene.input.keyboard.addKey('E').isDown) {
                            inventory.keys--;
                            playDoorSound();
                            updateInventoryDisplay();
                            obstacle.destroy();
                            useKeyText.setVisible(false);
                        }
                    } else {
                        useKeyText.setText('Need a key!');
                        useKeyText.setVisible(true);
                    }
                }
            }
        }
    });
}

function spawnItems(scene, screenX, screenY) {
    const itemData = {
        '0,0': [{type: 'potion', x: 160, y: 140}],
        '1,1': [{type: 'key', x: 128, y: 100}],
        '2,2': [{type: 'key', x: 128, y: 100}, {type: 'rupee', x: 80, y: 180}],
        '3,3': [{type: 'potion', x: 128, y: 80}],
        '4,4': [{type: 'bomb', x: 80, y: 140}, {type: 'rupee', x: 180, y: 140}],
        '5,5': [{type: 'key', x: 128, y: 60}],
        '6,6': [{type: 'key', x: 128, y: 100}, {type: 'potion', x: 200, y: 160}],
        '7,7': [{type: 'bosskey', x: 128, y: 100}],
        '0,8': [{type: 'rupee', x: 64, y: 60}, {type: 'bomb', x: 192, y: 60}],
        '8,0': [{type: 'rupee', x: 128, y: 80}, {type: 'potion', x: 64, y: 140}],
        '2,5': [{type: 'key', x: 128, y: 120}],
        '5,2': [{type: 'bomb', x: 128, y: 120}],
        '3,6': [{type: 'rupee', x: 100, y: 100}, {type: 'rupee', x: 156, y: 100}],
        '6,3': [{type: 'potion', x: 128, y: 80}]
    };

    const key = `${screenX},${screenY}`;
    const itemsToSpawn = itemData[key] || [];

    itemsToSpawn.forEach(data => {
        const item = items.create(data.x, data.y, data.type);
        item.setDepth(5);
        item.itemType = data.type;
    });
}

function collectItem(player, item) {
    try {
        if (item.itemType === 'key') {
            inventory.keys++;
        } else if (item.itemType === 'rupee') {
            inventory.rupees++;
        } else if (item.itemType === 'potion') {
            player.health = Math.min(player.health + 2, 6);
            updateHealthDisplay();
        } else if (item.itemType === 'bomb') {
            inventory.bombs++;
        } else if (item.itemType === 'bosskey') {
            inventory.bosskeys++;
        }

        playItemSound();
        updateInventoryDisplay();
        item.destroy();
    } catch (e) {
        console.log('Error in collectItem:', e);
        if (item && item.destroy) item.destroy();
    }
}

function spawnEnemies(scene, screenX, screenY) {
    // Spawn enemies in some rooms based on coordinates
    let enemyPositions = [];

    // Add enemies to various rooms across the 9x9 world
    const sum = screenX + screenY;
    if (sum % 3 === 0 && sum > 0) {
        // Every 3rd room (diagonal pattern)
        enemyPositions.push({x: 64, y: 64});
        enemyPositions.push({x: 192, y: 64});
    }
    if (sum % 4 === 0 && sum > 0) {
        enemyPositions.push({x: 128, y: 160});
    }
    if (screenX % 2 === 1 && screenY % 2 === 1) {
        enemyPositions.push({x: 80, y: 80});
        enemyPositions.push({x: 176, y: 176});
    }

    enemyPositions.forEach(pos => {
        const enemy = enemies.create(pos.x, pos.y, 'enemy');
        enemy.setCollideWorldBounds(true);
        enemy.setDepth(9);
        enemy.health = 2;
        enemy.direction = Phaser.Math.Between(0, 3);
        enemy.moveTimer = 0;
        enemy.isBoss = false;
    });

    // Spawn boss in boss room (far corner of 9x9 world)
    if (screenX === 8 && screenY === 8 && !bossDefeated) {
        boss = enemies.create(128, 120, 'boss');
        boss.setCollideWorldBounds(true);
        boss.setDepth(9);
        boss.health = 10;
        boss.direction = Phaser.Math.Between(0, 3);
        boss.moveTimer = 0;
        boss.isBoss = true;
        boss.setDisplaySize(32, 32);
    }
}

function updateEnemies(scene) {
    enemies.children.entries.forEach(enemy => {
        if (enemy.isBoss) {
            // Boss AI - chase player
            enemy.moveTimer--;
            if (enemy.moveTimer <= 0) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
                enemy.direction = Math.floor((angle + Math.PI) / (Math.PI / 2)) % 4;
                enemy.moveTimer = 30;
            }

            enemy.setVelocity(0);
            const speed = 60;
            if (enemy.direction === 0) enemy.setVelocityX(-speed);
            else if (enemy.direction === 1) enemy.setVelocityX(speed);
            else if (enemy.direction === 2) enemy.setVelocityY(-speed);
            else if (enemy.direction === 3) enemy.setVelocityY(speed);
        } else {
            // Normal enemy AI
            enemy.moveTimer--;
            if (enemy.moveTimer <= 0) {
                enemy.direction = Phaser.Math.Between(0, 3);
                enemy.moveTimer = 60;
            }

            enemy.setVelocity(0);
            const speed = 40;
            if (enemy.direction === 0) enemy.setVelocityX(-speed);
            else if (enemy.direction === 1) enemy.setVelocityX(speed);
            else if (enemy.direction === 2) enemy.setVelocityY(-speed);
            else if (enemy.direction === 3) enemy.setVelocityY(speed);
        }
    });
}

function attackWithSword(scene) {
    const dir = player.direction || 'down';
    let offsetX = 0, offsetY = 0;

    if (dir === 'left') { offsetX = -20; sword.angle = 90; }
    else if (dir === 'right') { offsetX = 20; sword.angle = -90; }
    else if (dir === 'up') { offsetY = -20; sword.angle = 0; }
    else if (dir === 'down') { offsetY = 20; sword.angle = 180; }

    sword.x = player.x + offsetX;
    sword.y = player.y + offsetY;
    sword.setVisible(true);
    sword.setActive(true);

    playSwordSound();

    scene.time.delayedCall(200, () => {
        sword.setVisible(false);
        sword.setActive(false);
    });
}

function hitEnemy(sword, enemy) {
    if (!sword.visible) return;

    enemy.health--;
    playHitSound();

    if (enemy.health <= 0) {
        if (enemy.isBoss) {
            // Boss defeated
            bossDefeated = true;
            const bossKey = items.create(enemy.x, enemy.y, 'bosskey');
            bossKey.setDepth(5);
            bossKey.itemType = 'bosskey';
            playSound(600, 1.0, 'square');

            // Show victory message
            const scene = sword.scene;
            if (scene) showVictoryScreen(scene);
        } else {
            // Drop item randomly from normal enemies
            const dropChance = Math.random();
            if (dropChance < 0.3) {
                const dropType = Math.random() < 0.5 ? 'rupee' : 'potion';
                const drop = items.create(enemy.x, enemy.y, dropType);
                drop.setDepth(5);
                drop.itemType = dropType;
            }
        }
        enemy.destroy();
    }
}

function checkScreenTransition(scene) {
    // Define 9x9 world boundaries
    const minX = 0, maxX = 8;
    const minY = 0, maxY = 8;

    // Check boundaries and trigger transitions
    // Only transition if player is in the middle area where openings typically are
    if (player.x < 4 && player.y > 80 && player.y < 160) {
        const targetX = currentScreen.x - 1;
        if (targetX >= minX && !isDoorBlocking('left')) {
            transitionScreen(scene, -1, 0);
        }
    } else if (player.x > 252 && player.y > 80 && player.y < 160) {
        const targetX = currentScreen.x + 1;
        if (targetX <= maxX && !isDoorBlocking('right')) {
            transitionScreen(scene, 1, 0);
        }
    } else if (player.y < 4 && player.x > 80 && player.x < 176) {
        const targetY = currentScreen.y - 1;
        if (targetY >= minY && !isDoorBlocking('up')) {
            transitionScreen(scene, 0, -1);
        }
    } else if (player.y > 236 && player.x > 80 && player.x < 176) {
        const targetY = currentScreen.y + 1;
        if (targetY <= maxY && !isDoorBlocking('down')) {
            transitionScreen(scene, 0, 1);
        }
    }
}

function isDoorBlocking(direction) {
    // Check if there's a door blocking the transition in this direction
    let blockingDoor = null;

    obstacles.children.entries.forEach(obstacle => {
        if (obstacle.obstacleType === 'door') {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                obstacle.x, obstacle.y
            );

            if (distance < 30) {
                if (direction === 'right' && obstacle.x > 240) blockingDoor = obstacle;
                else if (direction === 'left' && obstacle.x < 16) blockingDoor = obstacle;
                else if (direction === 'up' && obstacle.y < 16) blockingDoor = obstacle;
                else if (direction === 'down' && obstacle.y > 224) blockingDoor = obstacle;
            }
        }
    });

    return blockingDoor !== null;
}

function transitionScreen(scene, dx, dy) {
    isTransitioning = true;
    currentScreen.x += dx;
    currentScreen.y += dy;

    // Position player on opposite side
    if (dx !== 0) player.x = dx > 0 ? 8 : 248;
    if (dy !== 0) player.y = dy > 0 ? 8 : 232;

    player.setVelocity(0);

    // Clear old enemies, items, and obstacles
    enemies.clear(true, true);
    items.clear(true, true);
    obstacles.clear(true, true);

    // Also clear walls to prevent invisible collision issues
    if (walls) {
        walls.clear(true, true);
    }

    // Clear old map (except player, sword, and UI elements)
    scene.children.each(child => {
        const isUIElement = hearts.includes(child) ||
                          child === inventoryText ||
                          child === useKeyText ||
                          child === victoryText;

        if (child !== player && child !== sword && !isUIElement) {
            child.destroy();
        }
    });

    // Recreate map, enemies, items, and obstacles
    createMap(scene, currentScreen.x, currentScreen.y);
    spawnEnemies(scene, currentScreen.x, currentScreen.y);
    spawnItems(scene, currentScreen.x, currentScreen.y);
    spawnObstacles(scene, currentScreen.x, currentScreen.y);

    scene.physics.add.collider(player, walls);
    scene.physics.add.collider(enemies, walls);
    scene.physics.add.collider(player, obstacles, null, collideWithObstacle, scene);
    scene.physics.add.collider(enemies, obstacles);
    scene.physics.add.overlap(sword, enemies, hitEnemy, null, scene);
    scene.physics.add.overlap(player, enemies, playerHitByEnemy, null, scene);
    scene.physics.add.overlap(player, items, collectItem, null, scene);

    // Small delay before allowing another transition
    scene.time.delayedCall(100, () => {
        isTransitioning = false;
    });
}
