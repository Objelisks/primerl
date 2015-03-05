var numNeighbors = function(x, y) {
	var count = 0;
	for (var i = 0; i < 8; i++) {
		var moveDir = ROT.DIRS[8][i];
		var newPos = [x + moveDir[0], y + moveDir[1]];
		count += Game.isSolid(newPos[0], newPos[1]) ? 1 : 0;
	}
	return count;
}

var AI = {};

AI.Crawler = function() {
	if(!this.lastDir) this.lastDir = 0;
	// try each direction
	// until you find one that is next to a wall
	// and is not solid
	// if none are found, go forward
	var bestPos = null;
	var currentDir = this.lastDir;
	do {
		var moveDir = ROT.DIRS[8][currentDir];
		var newPos = [this.x + moveDir[0], this.y + moveDir[1]];
		if(Game.isOpen(newPos[0], newPos[1])) {
			bestPos = newPos;	
			break;
		} else if(bestPos != null) {
			break;
		}

		currentDir = (currentDir - 1).mod(8);
	} while(currentDir != this.lastDir);

	if(bestPos != null) {
		this.x = bestPos[0];
		this.y = bestPos[1];
		this.lastDir = currentDir;
	}
	return;
}

AI.Charge = function() {

}

AI.Shoot = function() {
	this.rateOfFire = 3.0;
}

AI.Bump = function() {

}

AI.Creature = function(x, y, data) {
	this.x = x;
	this.y = y; 
	this.ch = "c";
	this.color = [255, 0, 0];
	for(var key in data) { this[key] = data[key]; }
}

AI.Creature.prototype.draw = function(display) {
	display.draw(this.x, this.y, this.ch, ROT.Color.toRGB(this.color));
}