var caterwaul = require('./caterwaul.node.js').caterwaul;
var filename  = process.argv[2];
var source    = require('fs').readFileSync(filename, 'utf8');
var parsed    = caterwaul.parse(source);
require('fs').writeFileSync(
  filename.replace(/\.js$/, '.out.js'),
  parsed.toString(),
  'utf8');