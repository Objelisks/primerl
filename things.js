var Door = function(x, y, type) {
	this.color = color;
	this.speed = 100;
	this.openTime = 0;
	this.currentChar = Door.closedChar;
}

Door.types = {
	"basic": {
		color: [0, 250, 200]
	},
	"ice": {
		color: [250, 250, 250],
		openedBy: "ice"
	},
	"missile": {
		color: [250, 100, 100]
		openedBy: "missile"
	}
}

Door.openState = "_";
Door.openingState = "/";
Door.closedState = "%";
Door.maxOpenTime = 10;

Door.prototype.getSpeed = function() {
	return this.speed;
}

Door.prototype.act = function() {
	if(this.state == Door.openState) {
		this.openedTime += 1;
		if(this.openedTime > Door.maxOpenTime) {
			this.openedTime = 0;
			this.close();
		}
	}
	if(this.state == Door.openingState) {
		this.state = Door.openState;
	}
}

Door.prototype.onHit = function(thing) {
	if(this.opened) return;
	if(thing.type == "projectile") {
		if(this.openedBy && thing.ptype == this.openedBy) {
			this.open();
		}
	}
}

Door.prototype.draw = function(display) {
	display.draw(this.x, this.y, this.state, this.color);
}

Door.prototype.open = function() {
	this.state = Door.openingState;
}

Door.prototype.close = function() {
	this.state = Door.closedState;
}

Door.prototype.onHit = function(projectile) {
	if(this.opened) return;
	if(projectile.color == color) {
		this.open();
	}
}