var Status = function() {
	this.showScanProgress = false;
	this.showScanLogs = false;
	this.scanLogInterpolate = 0.0;
	this.showBossHealth = false;
	this.maxScan = 1;
	this.maxBossHealth = 1;
}

Status.symbols = {
	leftSide: [
	"-----,",
	"      \\",
	"      |",
	"      /"
	],

	rightSide: [
	" ,-------------",
	"/              ",
	"|              ",
	"\\             "
	],

	combat: [
	"  |  ",
	"-<+>-",
	"  |  ",
	],

	scan: [
	"",
	"[-+-]",
	""
	],

	thermal: [
	" ___ ",
	"(_ _)",
	"  v  "
	],

	xray: [
	"/x x\\",
	"| x |",
	"\\x x/"
	],

	beam: [
	"",
	" ---o",
	""
	],

	ice: [
	"",
	" ===*",
	"",
	],

	wave: [
	"",
	" ~-~-",
	"",
	],

	plasma: [
	"",
	" -!!!",
	"",
	],

	missile: [
	"",
	" ~-=>",
	""
	],

	missileAmmo: [
	"-=>"
	],

	energyTank: "E",
	energyLevel: "="
}

Status.leftSide = [0, 21];
Status.rightSide = [65, 21];

Status.playerHealthPos = [1, 0];
Status.leftLogStart = [0,10];
Status.rightLogStart = [50, -10];
Status.leftLogPos = [0, 21];
Status.rightLogPos = [65, 21];
Status.bossHealthPos = [26, 1];
Status.scanLogPos = [26, 23];
Status.barWidth = 24;
Status.ammoCounterPos = [75, 22];
Status.maxTanks = 6;
Status.scanLogColor = [0, 155, 100];
Status.bossHealthColor = [155, 0, 0];
Status.energyColor = [200,200,0];
Status.targetColor = [200,0,0];

Status.prototype.draw = function(display) {
	if(Game.player.target) {
		display.draw(Game.player.target.x-1, Game.player.target.y, "[", Status.targetColor);
		display.draw(Game.player.target.x+1, Game.player.target.y, "]", Status.targetColor);
	}

	this.drawSymbol(display, Status.leftSide[0], Status.leftSide[1], Status.symbols.leftSide);
	this.drawSymbol(display, Status.leftSide[0]+1, Status.leftSide[1]+1, Status.symbols[Game.player.getVisor()]);
	this.drawSymbol(display, Status.rightSide[0], Status.rightSide[1], Status.symbols.rightSide);
	this.drawSymbol(display, Status.rightSide[0]+1, Status.rightSide[1]+1, Status.symbols[Game.player.getWeapon()]);
	this.drawSymbol(display, Status.ammoCounterPos[0], Status.ammoCounterPos[1], Status.symbols.missileAmmo);

	var tanks = parseInt(Game.player.health / 100);
	var currentTank = parseInt(Game.player.health.mod(100) / 10);
	var i;
	for (var i = 0; i < tanks; i++) {
		display.draw(Status.playerHealthPos[0]+i, Status.playerHealthPos[1], Status.symbols.energyTank, Status.energyColor);
	}
	for (var j = Status.maxTanks+1; j < Status.maxTanks+1+currentTank; j++) {
		display.draw(Status.playerHealthPos[0]+j, Status.playerHealthPos[1], Status.symbols.energyLevel, Status.energyColor);
	};

	var ammoCounter = "" + Game.player.missileAmmo;
	while(ammoCounter.length < 3)
		ammoCounter = "0" + ammoCounter;
	display.drawText(Status.ammoCounterPos[0], Status.ammoCounterPos[1]+1, ammoCounter);

	if(this.showScanProgress && Game.player.target) {
		display.draw(Status.scanLogPos[0], Status.scanLogPos[1], "[", Status.scanLogColor, "black");
		var width = parseInt((Game.player.scanProgress / Game.player.target.data.scanLength) * Status.barWidth);
		for (var i = 1; i <= width; i++) {
			display.draw(Status.scanLogPos[0]+i, Status.scanLogPos[1], "-", Status.scanLogColor, Status.scanLogColor);
		};
		display.draw(Status.scanLogPos[0]+Status.barWidth+1, Status.scanLogPos[1], "]", Status.scanLogColor, "black");
	}
	if(this.showBossHealth && Game.boss) {
		display.draw(Status.bossHealthPos[0], Status.bossHealthPos[1], "[", Status.bossHealthColor, "black");
		var width = parseInt(Game.boss.health * Status.barWidth);
		for (var i = 1; i <= width; i++) {
			display.draw(Status.bossHealthPos[0]+i, Status.bossHealthPos[1], "-", Status.bossHealthColor, Status.bossHealthColor);
		};
		display.draw(Status.bossHealthPos[0]+Status.barWidth+1, Status.bossHealthPos[1], "]", Status.bossHealthColor, "black");
	}

	if(this.showScanLogs) {
		this.drawSymbol(display, 
				parseInt(Math.interpolate(Status.leftLogStart[0], this.leftLogPos[0], this.scanLogInterpolate)),
				parseInt(Math.interpolate(Status.leftLogStart[1], this.leftLogPos[1], this.scanLogInterpolate)),
				this.leftLog,
				[0,200,250],
				null);
		this.drawSymbol(display, 
				parseInt(Math.interpolate(Status.rightLogStart[0], this.rightLogPos[0], this.scanLogInterpolate)),
				parseInt(Math.interpolate(Status.rightLogStart[1], this.rightLogPos[1], this.scanLogInterpolate)),
				this.rightLog,
				[0,200,250],
				null);
	}
}

Status.prototype.drawSymbol = function(display, x, y, symbol, fg, bg) {
	for(var line=0; line<symbol.length; line++) {
		// draw each line
		var text = symbol[line];
		for (var i = 0; i < text.length; i++) {
			display.draw(x+i, y+line, text[i], fg?fg:null, bg?bg:"black");
		}
	}
}

Status.prototype.handleEvent = function(e) {
	// any key
	this.showScanLogs = false;
	Game.player.scanProgress = 0;
	window.removeEventListener("keydown", this);
	Game.engine.unlock();
}

Status.prototype.scanLogs = function(data) {
	Game.engine.lock();
	this.scanLogInterpolate = 0.0;
	this.showScanLogs = true;
	this.leftLog = data.leftLog;
	this.rightLog = data.rightLog;
	this.leftLogPos = data.leftPos;
	this.rightLogPos = data.rightPos;

	var drawMovement = function() {
		this.scanLogInterpolate += 0.1;
		Game.redraw();

		if(this.scanLogInterpolate >= 1.0) {
			window.addEventListener("keydown", this);
		} else {
			setTimeout(drawMovement.bind(this), 50);
		}
	}.bind(this);

	drawMovement();
	// anykey
	// remove display
	// Game.engine.unlock();
}