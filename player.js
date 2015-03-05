var moveKeys = {
	38: 0,
	33: 1,
	39: 2,
	34: 3,
	40: 4,
	35: 5,
	37: 6,
	36: 7,
	104: 0,
	105: 1,
	102: 2,
	99: 3,
	98: 4,
	97: 5,
	100: 6,
	103: 7
}

var fireKey = 70; // f
var targetKey = 84; // t
var deselectKey = 68; // d
var aimKey = 65; // a
var switchWeaponKey = 83; // s
var switchVisorKey = 86; // v
var nopKeys = {101:1, 12:1}; // numpad 5

var Player = function(x, y) {
	this.x = x;
	this.y = y;
	this.color = ROT.Color.toHex([255, 127, 0]);
	this.speed = 100;
	this.target = null;
	this.lastDir = [0,1];
	this.creatureDistances = null;
	this.vision = {};
	this.xrayVision = {};
	this.visionFOV = new ROT.FOV.PreciseShadowcasting(Game.isOpen.bind(Game));
	this.xrayVisionFOV = new ROT.FOV.PreciseShadowcasting(function() {return true});
	this.xraypulse = 0;

	this.health = 100;
	this.currentWeapon = 0;
	this.currentVisor = 0;
	this.missileAmmo = 10;
	this.scanProgress = 0;

	this.refreshVision();
}

Player.weaponCycle = ["beam", "ice", "wave", "plasma"];
Player.weaponStats = {
	beam: {
		fireRate: 100,
		projectile: {
			type: "projectile",
			ptype: "beam",
			color: [255, 200, 100],
			lightStr: 2,
			ch: "o",
			damage: 1
		}
	},
	ice: {
		fireRate: 25,
		projectile: {
			type: "projectile",
			ptype: "beam",
			color: [255, 200, 100],
			lightStr: 3,
			ch: "*",
			damage: 3,
			//onhit slow
		}
	},
	wave: {
		fireRate: 50,
		projectile: {
			type:"projectile",
			ptype: "wave",
			color: [200, 50, 250],
			lightStr: 5,
			ch: "~",
			damage: 2,
			//onhit stun
		}
	},
	plasma: {
		fireRate: 25,
		projectile: {
			type: "projectile",
			ptype: "plasma",
			color: [255, 50, 50],
			lightStr: 10,
			ch: "!",
			damage: 4,
			//onhit fire
		}
	}
}

// filter, if present, modifies the fg color of the tile
Player.visorCycle = ["combat", "scan", "thermal", "xray"];
Player.visorStats = {
	combat: {
	},
	scan: {
	},
	thermal: {
		filter: function(thing) {
			if(thing.heat) {
				return ROT.Color.toRGB(ROT.Color.interpolateHSL([190, 255, 128], [10, 128, 255], thing.heat / 255.0));
			} 
			else {
				return [32, 0, 64];
			}
		}
	},
	xray: {
		filter: function(thing) {
			if(thing.isMap) {
				// gets the radius from the player, null if not within vision
				//var canSee = Game.player.vision[thing.x+","+thing.y];
				var canSeeXray = Game.player.xrayVision[thing.x+","+thing.y];

				if(canSeeXray) {
					// grayscale the tile, and apply the pulse filter
					//var color = thing.color;
					//var gray = 0.2126*color[0] + 0.7152*color[1] + 0.0722*color[2];
					var grad = [255, 128, 32, 16, 8, 4, 2, 1, 0, 0, 0, 0, 0];
					var diff = Math.max(0, Math.min(Math.abs(canSeeXray - Game.player.xraypulse), 8));
					var gray = grad[diff];
					return [gray, gray, gray];
				}
			}
			return false;
		}
	}
}

Player.Moving = 0;
Player.Targetting = 1;
Player.Scanning = 2;

Player.VisionRadius = 10;

Player.prototype.draw = function(display) {
	display.draw(this.x, this.y, "@", this.color);
}

Player.prototype.getSpeed = function() {
	return this.speed;
}

Player.prototype.act = function() {
	Game.engine.lock();
	Game.redraw();
	this.xraypulse = (this.xraypulse + 1) % Player.VisionRadius;
	window.addEventListener("keydown", this);
}

Player.prototype.handleEvent = function(e) {
	if(e.keyCode == deselectKey || (this.target && this.target.health <= 0)) {
		// TODO maybe also add a timer for time outside of vision
		this.loseTarget();
		return;
	}

	if(e.keyCode in nopKeys) {
		return this.unlock();
	}

	if(e.keyCode == fireKey) {
		var dir = this.lastDir;
		if(this.target) {
			var angle = this.getAngleToTarget(this.target);
			dir = [Math.cos(angle), Math.sin(angle)];
		}
		this.shoot(dir);
		return this.unlock();
	}

	if(e.keyCode == switchVisorKey) {
		this.resetScan();
		this.currentVisor = (this.currentVisor + 1).mod(Player.visorCycle.length);
		this.refreshVision();
		Game.redraw();
		return;
	}

	if(e.keyCode == switchWeaponKey) {
		this.currentWeapon = (this.currentWeapon + 1).mod(Player.weaponCycle.length);
		Game.redraw();
		return;
	}

	if(e.keyCode == targetKey) {
		if(this.creatureDistances == null || this.creatureDistances.length == 0) {
			this.creatureDistances = [];
			for (var i = Game.level.creatures.length - 1; i >= 0; i--) {
				var creature = Game.level.creatures[i];
				if(this.vision[creature.x+","+creature.y]) {
					var distance = Math.distance(this.x, this.y, creature.x, creature.y);
					this.creatureDistances.push({distance: distance, creature: creature});
				}
			}

			this.creatureDistances.sort(function(a, b) { return a.distance - b.distance; });
		}

		var nextCreature = this.creatureDistances.shift();
		if(nextCreature && this.target == nextCreature.creature)
			nextCreature = this.creatureDistances.shift();
		
		if(nextCreature) {
			this.target = nextCreature.creature;
			Game.redraw();
		}
	}

	if(e.keyCode in moveKeys) {
		var move = ROT.DIRS[8][moveKeys[e.keyCode]];
		var newPos = [this.x+move[0], this.y+move[1]];
		if(Game.isOpen(newPos[0], newPos[1])) {
			this.move(move);
			this.refreshVision();
			return this.unlock();
		}
	}
}

Player.prototype.unlock = function() {
	window.removeEventListener("keydown", this);
	this.creatureDistances = null;
	Game.engine.unlock();
}

Player.prototype.getWeaponStats = function() {
	return Player.weaponStats[Player.weaponCycle[this.currentWeapon]];
}

Player.prototype.getWeapon = function() {
	return Player.weaponCycle[this.currentWeapon];
}

Player.prototype.getVisorStats = function() {
	return Player.visorStats[Player.visorCycle[this.currentVisor]];
}

Player.prototype.getVisor = function() {
	return Player.visorCycle[this.currentVisor];
}

Player.prototype.shoot = function(dir) {
	if(this.getVisor() == "scan") {
		if(this.target) {
			this.scanProgress++;
			Game.status.showScanProgress = true;
			if(this.scanProgress >= this.target.data.scanLength)
				Game.status.scanLogs(this.target.data);
		}
		return;
	}

	var projectile = Object.create(this.getWeaponStats().projectile);
	projectile.dir = dir;
	projectile.x = this.x;
	projectile.y = this.y;
	projectile.origin = this;

	Game.addEffect(projectile);
}

Player.prototype.move = function(dir) {
	this.x += dir[0];
	this.y += dir[1];
	this.lastDir = dir;
}

Player.prototype.refreshVision = function() {
	this.vision = {};
	this.visionFOV.compute(this.x, this.y, Player.VisionRadius, function(x, y, r, vis) {
		if(vis)
			this.vision[x+","+y] = r;
	}.bind(this));
	if(this.getVisor() == "xray") {
		this.xrayVision = {};
		this.xrayVisionFOV.compute(this.x, this.y, Player.VisionRadius, function(x, y, r, vis) {
			if(vis)
				this.xrayVision[x+","+y] = r;
		}.bind(this));
	}
}

Player.prototype.resetScan = function() {
	this.scanProgress = 0;
	Game.status.showScanProgress = false;
	Game.redraw();
}

Player.prototype.loseTarget = function() {
	this.target = null;
	this.resetScan();
}

Player.prototype.getAngleToTarget = function(target) {
	return Math.atan2(target.y - this.y, target.x - this.x);
}