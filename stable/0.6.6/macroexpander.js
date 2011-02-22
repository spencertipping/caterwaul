// A quick macroexpander REPL:
console.log('%s', caterwaul.clone('format').format(caterwaul.clone('std seq opt continuation parser').macroexpand(caterwaul.parse(process.argv.slice(2).join(' ')))));