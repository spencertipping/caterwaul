d.typeclass('foldable', 'fold', 'zero', 'merge', 'ret').define ({
  map:  '|f| @fold((@|x, y| @merge(x, @ret(f(y)))), @zero())',
  lift: '|f| @fold((@|x, y| @merge(x, f(y))), @zero())'});