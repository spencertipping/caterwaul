var caterwaul = require('./caterwaul.node.std.js').caterwaul;
caterwaul('js_all')(function () {
  fs.writeFileSync(output_file, $(expand)(parsed).toString(), 'utf8')
  -where [fs          = require('fs'),
          output_file = process.argv[2].replace(/\.js$/, '.out.js'),
          parsed      = $.parse(fs.readFileSync(process.argv[2], 'utf8')),
          expand      = $.rereplacer(_x /log -qs, _x -se- console.log(it) -qse)]},
  {$: caterwaul, require: require})();