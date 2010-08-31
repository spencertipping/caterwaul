d('|foo| foo#c(@, @x)')         // => function (foo) {return foo.call(this, this.x)}
d('|x, y| @x = x, @y = y')      // => function (x, y) {return this.x = x, this.y = y}
d('|f, xs| f#a(f, xs)')         // => function (f, xs) {return f.apply (f, xs)}