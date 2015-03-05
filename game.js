var Game = {
	display: null,
	status: null,
	colors: {},
	map: {},
	things: {},
	freeCells: [],
	player: null,
	level: null,
	
	levelTypes: [BioLevel, LavaLevel],

	init: function() {
		this.ambient = [32, 32, 32];
		this.display = new ROT.Display();
		this.engine = new ROT.Engine();
		document.body.appendChild(this.display.getContainer());
		//Game.generateMap();

		this.effects = new Effects();

		var levelType = BioLevel;
		this.level = new levelType();
		this.level.generate();

		var pos = this.level.getRandomCell().split(",");
		this.player = new Player(parseInt(pos[0]), parseInt(pos[1]));

		this.status = new Status(this.display);

		this.engine.addActor(this.player);
		this.engine.addActor(this.effects);
		this.engine.start();
	}
}

Game.isSolid = function(x, y) {
	return this.level.isSolid(x, y);
}
Game.isOpen = function(x, y) {
	return this.level.isOpen(x, y);
}

Game.redraw = function() {
	this.display.clear();
	var dynamicLights = [];
	dynamicLights.push({
		x: this.player.x,
		y: this.player.y,
		color: [100, 100, 100],
		range: Player.VisionRadius,
	});
	this.effects.getLights(dynamicLights);

	this.level.draw(this.display, dynamicLights);
	this.player.draw(this.display);
	this.effects.draw(this.display);
	this.status.draw(this.display);
}

Game.getStuffAt = function(x, y) {
	var info = {};
	if(this.player.x == x && this.player.y == y) {
		info.thing = this.player;
		info.solid = true;
		return info;
	}
	var mapTile = this.level.map[x+","+y];
	if(mapTile) {
		info.thing = mapTile;
		info.solid = info.thing.solid;
		for (var i = this.level.creatures.length - 1; i >= 0; i--) {
			var creature = this.level.creatures[i];
			if(creature.x == x && creature.y == y) {
				info.thing = creature;
				info.solid = true;
				info.creature = true;
			}
		}
	} else {
		info.solid = true;
	}
	return info;
}


var Effects = function() {
	this.effects = [];
};

Effects.die = function(thing) {
	this.dead = true;
}

Effects.prototype.act = function() {
	Game.engine.lock();
	var	dead = [];

	for (var i = this.effects.length - 1; i >= 0; i--) {
		var effect = this.effects[i];
		if(effect == null) continue;
		effect.life--;

		if(effect.dead || effect.life <= 0) {
			dead.push(i);
			continue;
		}
		if(effect.dir) {
			effect.x += effect.dir[0];
			effect.y += effect.dir[1];
		}
		var info = Game.getStuffAt(parseInt(effect.x+0.5), parseInt(effect.y+0.5));
		if(info.solid) {
			if(effect.damage && info.creature) {
				info.thing.health -= effect.damage;
			}
			effect.onHit(info.thing);
			dead.push(i);
		}
		if(effect.step) {
			effect.step();
		}
	
	}

	var key;
	while((key = dead.shift()) != undefined) {
		this.effects.splice(key, 1);
	}

	Game.redraw();
	if(this.effects.length > 0)
		setTimeout(function() {
			this.act();
			Game.engine.unlock();
		}.bind(this), 10);
	else
		Game.engine.unlock();
}

Effects.prototype.getLights = function(lights) {
	for (var i = this.effects.length - 1; i >= 0; i--) {4
		var effect = this.effects[i];
		lights.push({
			x: parseInt(effect.x+0.5), 
			y: parseInt(effect.y+0.5), 
			range: effect.lightStr, 
			color: ROT.Color.scale(effect.lightStr, effect.color)
		});
	}
}

Effects.prototype.getSpeed = function() {
	return 100;
}

Effects.prototype.draw = function(display) {
	for(var i=0; i<this.effects.length; i++) {
		var effect = this.effects[i];
		display.draw(parseInt(effect.x+0.5), parseInt(effect.y+0.5), effect.ch, ROT.Color.toRGB(effect.color));
	}
}

Effects.prototype.create = function(params) {
	var effect = {
		x:0,
		y:0,
		ch: "x",
		color: [255, 0, 0],
		type: "effect",
		onHit: Effects.die,
		life: 12
	};
	for(var key in params) { effect[key] = params[key]; }
	this.effects.push(effect);
}

Game.addEffect = function(effect) {
	this.effects.create(effect);
}