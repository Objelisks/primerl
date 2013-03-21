Array.prototype.takeRandom = function() {
	if (!this.length) { return null; }
	var index = Math.floor(ROT.RNG.getUniform() * this.length);
	return this.splice(index, 1)[0];
}

Array.prototype.multiply = function(scalar) {
	for (var i = this.length - 1; i >= 0; i--) {
		this[i] *= scalar;
	};
}

ROT.Color.scale = function(scalar, color) {
	return [color[0] * scalar, color[1] * scalar, color[2] * scalar];
}

Math.distance = function(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

Math.interpolate = function(a, b, t) {
	return a + (b-a) * t;
}