(function(f){return f(f)})(function(initializer){var calls_init=function(){var f=function(){return f.init.apply(f,arguments)};return f},original_global=typeof caterwaul==="undefined"?undefined:caterwaul,caterwaul_global=calls_init();
caterwaul_global.deglobalize=function(){caterwaul=original_global;return caterwaul_global};caterwaul_global.core_initializer=initializer;caterwaul_global.modules=[];
caterwaul_global.module=function(name,transform,f){if(arguments.length===1){return caterwaul_global[name+"_initializer"]}if(!(name+"_initializer" in caterwaul_global)){caterwaul_global.modules.push(name)
}f||(f=transform,transform=null);(caterwaul_global[name+"_initializer"]=transform?caterwaul_global(transform)(f):f)(caterwaul_global);return caterwaul_global};return caterwaul=caterwaul_global
});