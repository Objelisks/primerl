var Level = function(type) {
	this.map = {};
	this.colors = {};
	this.creatures = [];
	this.fog = {};
	this.fogColor = [0, 32, 0];
	this.fogScale = 10.0;
	this.fogNoise = new ROT.Noise.Simplex();
	this.fogOffset = [0, 0];
	this.fogVelocity = [1.2, 0.5];
	this.freeCells = [];
	this.ambient = [32, 32, 32];
	this.staticLights = [];
}

Level.prototype.draw = function(display, dynamicLights) {
	this.computeFog();
	this.computeLights(dynamicLights);

	for(var key in this.map) {
		var parts = key.split(",");
		var x = parseInt((parts[0]));
		var y = parseInt((parts[1]));
		var tile = this.map[key];
		var visible = Game.player.vision[key] || (Game.player.getVisor() == "xray" && Game.player.xrayVision[key]);
		if(tile.seen || visible) {
			tile.seen = true;

			var tileCharacter = tile.ch;
			if(tile.things.length > 0) {
				tileCharacter = tile.things[0].ch;
			}

			var tileColor = tile.color;
			if(visible) {
				if(this.colors[key] != null)
					tileColor = ROT.Color.multiply(tileColor, this.colors[key]);
				var visor = null;
				var newColor = null;
				if((visor = Game.player.getVisorStats().filter) != null)
					newColor = visor({x: x, y: y, heat: tile.heat, color: this.ambient, isMap: true});
				if(newColor) {
					tileColor = newColor;
				}
			}

			display.draw(x, y, tileCharacter, ROT.Color.toRGB(tileColor), ROT.Color.toRGB(this.fog[key]));
		}
	}
	
	for (var i = this.creatures.length - 1; i >= 0; i--) {
		var creature = this.creatures[i];
		if(creature.health <= 0) {
			this.creatures.splice(i, 1);
			Game.player.loseTarget();
			continue;
		}
		if(Game.player.vision[creature.x+","+creature.y])
			creature.draw(display);
	};
}

Level.prototype.isSolid = function(x, y) {
	return this.map[x+","+y] == null || this.map[x+","+y].solid;
}
Level.prototype.isOpen = function(x, y) {
	return this.map[x+","+y] != null && !this.map[x+","+y].solid;
}

Level.prototype.computeLights = function(dynamicLights) {
	var lights = new ROT.Lighting(this.isOpen.bind(this), { });
	lights.setFOV(new ROT.FOV.PreciseShadowcasting(this.isOpen.bind(this)));

	for (var i = dynamicLights.length - 1; i >= 0; i--) {
		var light = dynamicLights[i];
		lights.setLight(light.x, light.y, light.range, ROT.Color.scale(light.range, light.color));
	}

	for (var j = this.staticLights.length - 1; j >= 0; j--) {
		var light = this.staticLights[j];
		lights.setLight(light.x, light.y, light.range, ROT.Color.scale(light.range, light.color));
	};

	this.colors = {};
	lights.compute(function(x, y, color) {
		this.colors[x+","+y] = color;
	}.bind(this));
}

Level.prototype.computeFog = function() {
	this.fogOffset[0] += this.fogVelocity[0] / this.fogScale;
	this.fogOffset[1] += this.fogVelocity[1] / this.fogScale;
	for(var key in this.map) {
		var p = key.split(",");
		var fx = (parseInt(p[0]) + this.fogOffset[0]) / this.fogScale;
		var fy = (parseInt(p[1]) + this.fogOffset[1]) / this.fogScale;
		this.fog[key] = ROT.Color.interpolate([0,0,0], this.fogColor, this.fogNoise.get(fx, fy));
	}
}

Level.prototype.getRandomCell = function() {
	return this.freeCells.takeRandom();
}