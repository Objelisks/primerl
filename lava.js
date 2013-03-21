var Shriekbat = {
	ch: "s",
	color: [200, 200, 0],
	getSpeed: 100,
	lastDir: 0,
	moveAI: AI.Crawler,
	attackAI: AI.Bump,
	health: 3,
	getSpeed: function() { return 100; },
	act: function() {
		this.moveAI.call(this);
		this.attackAI.call(this);
	},
	data: {
		scanLength: 6,
		leftPos: [10, 10],
		rightPos: [50, 6],
		leftLog: [
		"  /---------\\",
		"/-' Zoomer  '--------------------\\",
		"| It runs along walls            |",
		"| Zoomers are covered in spikes  |",
		"| Dangerous to touch             |",
		"\\--------------------------------/"
		],
		rightLog: [
		"/----------\\",
		"|  <^^^>   |",
		"| (_,\",_)  |",
		"|          |",
		"\\----------/"
		]
	}
}

var Magmoor = {
	ch: "M",
	color: [255, 128, 0],
	getSpeed: 100,
	lastDir: 0,
	moveAI: AI.Crawler,
	attackAI: AI.Bump,
	health: 3,
	getSpeed: function() { return 100; },
	act: function() {
		this.moveAI.call(this);
		this.attackAI.call(this);
	},
	data: {
		scanLength: 6,
		leftPos: [10, 10],
		rightPos: [50, 6],
		leftLog: [
		"  /---------\\",
		"/-' Zoomer  '--------------------\\",
		"| It runs along walls            |",
		"| Zoomers are covered in spikes  |",
		"| Dangerous to touch             |",
		"\\--------------------------------/"
		],
		rightLog: [
		"/----------\\",
		"|  <^^^>   |",
		"| (_,\",_)  |",
		"|          |",
		"\\----------/"
		]
	}
}

var LavaLevel = function() {
	Level.call(this);
	this.ambient = [64, 0, 0];
	this.fogColor = [32, 0, 0];
}
LavaLevel.extend(Level);

LavaLevel.prototype.generate = function() {
	var digger = new ROT.Map.Uniform(80, 25);
	this.freeCells = [];

	var diggerCallback = function(x, y, value) {
		if(value) return;

		var chars = [".", ","];
		var key = x+","+y;
		this.freeCells.push(key);
		this.map[key] = {
			solid: false,
			ch: chars.random(),
			heat: 80 + ROT.RNG.getUniform() * 10,
			color: ROT.Color.randomize(this.ambient, [32, 5, 5]),
			things: []
		}
	};
	digger.create(diggerCallback.bind(this));

	this.addLava();
}

LavaLevel.prototype.addLava = function() {
	var digger = new ROT.Map.Cellular(50, 25);
	digger.randomize(0.3);
	var diggerCallback = function(x, y, value) {
		if(!value) return;

		var lava = ["~"];
		var lavaColor = [128, 64, 0];
		var key = x+","+y;
		this.freeCells.splice(this.freeCells.indexOf(key), 1);
		this.map[key] = {
			solid: false,
			ch: lava.random(),
			heat: 245 + ROT.RNG.getUniform() * 10,
			color: ROT.Color.randomize(lavaColor, [16, 8, 0]),
			things: []
		}
		this.staticLights.push({
			x: x, 
			y: y, 
			range: 5,
			color: [128, 64, 0]
		});
	}
	digger.create(diggerCallback.bind(this));
}