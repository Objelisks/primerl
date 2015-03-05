var Zoomer = {
	ch: "z",
	color: [0, 200, 255],
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

var BioLevel = function() {
	Level.call(this);
	this.ambient = [0, 32, 0];
	this.fogColor = [16, 32, 16];
}
BioLevel.extend(Level);

BioLevel.prototype.generate = function() {
	var digger = new  ROT.Map.Uniform(80, 22);
	//digger.randomize(0.4);
	this.freeCells = [];

	var floor = [".", "'", "\""];
	var diggerCallback = function(x, y, value) {
		
		var key = x+","+y;
		if(value == 0) {
			this.freeCells.push(key);
			this.map[key] = {
				solid: false,
				ch: floor.random(),
				color: this.ambient,
				heat: 50,
				things: []
			}
		} else {
			this.map[key] = {
				solid: true,
				ch: " ",
				color: "black",
				heat: 0,
				things: []
			}
		}
	};
	digger.create(diggerCallback.bind(this));

	this.makePlants();
}

BioLevel.prototype.makePlants = function() {
	var plantChars = ["&", "T", "t", "|"];
	var plantColors = [[50, 200, 0], [0,128,0], [0,25,80]];
	for (var i = 0; i < 20; i++) {
		var p = this.freeCells.takeRandom().split(",");
		var plant = {
			x: parseInt(p[0]),
			y: parseInt(p[1]),
			ch: plantChars.random(),
			color: ROT.Color.randomize(plantColors.random(), [0, 50, 50])
		};
		this.map[p].things.push(plant);
		this.map[p].heat = 128;
		this.staticLights.push({
			x: plant.x, 
			y: plant.y, 
			range: 6,
			color: plant.color
		});
	};

	for (var i = 0; i < 10; i++) {
		var p = this.freeCells.takeRandom().split(",");
		var creature = new AI.Creature(parseInt(p[0]), parseInt(p[1]), Zoomer)
		this.creatures.push(creature);
		Game.engine.addActor(creature);
	};
}