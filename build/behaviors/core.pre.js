caterwaul.method('macro_form',function (){for (var i=0,l=arguments.length-1;
i<l;
 ++i)this.define_macro_form(arguments[i],arguments[l]);
return this}).method('define_macro_form',function (name,define){var names=name+'s',form=name+'_form',forms=name+'_forms',define_name='define_'+name;
return this.shallow(names,[]).method(name,function (){for (var fs=this[forms],def=this[define_name],i=0,l=arguments.length-1,definition=this.ensure_expander(arguments[l]),lj=fs.length;
i<l;
 ++i){for (var name=arguments[i],j=0;
j<lj;
 ++j)def.call(this,name,definition,fs[j]);
this[names].push({name:name,definition:definition})}return this}).shallow(forms,[]).method(form,function (){for (var xs=this[names],def=this[define_name],i=0,l=arguments.length,lj=xs.length;
i<l;
 ++i){for (var form=this.ensure_syntax(arguments[i]),j=0;
j<lj;
 ++j)def.call(this,xs[j].name,xs[j].definition,form);
this[forms].push(form)}return this}).method(define_name,function (){return define.apply(this,arguments),this})});
caterwaul.macro_form('modifier','parameterized_modifier',function (name,def,form){this.macro(form.replace({it:name}),def)});
caterwaul.configuration('core.js',function (){this.modifier_form('it in _expression','it[_expression]','_expression |it','_expression -it','_expression /it','_expression.it').parameterized_modifier_form('it[_modifiers][_expression]','it[_modifiers] in _expression','it._modifiers[_expression]','it._modifiers in _expression','_expression, it[_modifiers]','_expression |it[_modifiers]','_expression /it[_modifiers]','_expression -it[_modifiers','_expression -it- _modifiers','_expression, it._modifiers','_expression |it._modifiers','_expression /it._modifiers','_expression -it._modifiers','_expression <it> _modifiers');
this.macro('wobbly[_x]','(function () {throw _x}).call(this)');
this.macro('_string',function (match){var s=match._string.data,q=s.charAt(0);
if (q!=='\''&&q!=='"'|| !/#\{[^\}]+\}/.test(s))return false;
for (var pieces=[],i=1,l=s.length-1,brace_depth=0,got_hash=false,start=1,c;
i<l;
 ++i)if (brace_depth)if ((c=s.charAt(i))==='}') --brace_depth||pieces.push(s.substring(start,i))&&(start=i+1),got_hash=false;
else brace_depth+=c==='{';
else if ((c=s.charAt(i))==='#')got_hash=true;
else if (c==='{'&&got_hash)pieces.push(s.substring(start,i-1)),start=i+1, ++brace_depth;
else got_hash=false;
pieces.push(s.substring(start,l));
for (var escaped=new RegExp('\\\\'+q,'g'),i=0,l=pieces.length;
i<l;
 ++i)if (i&1)pieces[i]=this.parse(pieces[i].replace(escaped,q)).as('(');
else pieces[i]=new this.syntax(q+pieces[i]+q);
return new this.syntax('+',pieces).unflatten().as('(')});
this.macro('_left(_args) = _right','_left = (function (_args) {return _right})')});
caterwaul.configuration('core.quote',function (){this.modifier('qs',function (match){return new this.ref(match._expression)}).modifier('qse',function (match){return new this.ref(this.macroexpand(match._expression))})});
caterwaul.configuration('core.words',function (){this.parameterized_modifier('given','from','fn','(function (_modifiers) {return _expression})').parameterized_modifier('bgiven','bfrom','fb','(function (t, f) {return (function () {return f.apply(t, arguments)})})(this, (function (_modifiers) {return _expression}))');
this.parameterized_modifier('effect','se','(function (it) {return (_modifiers), it}).call(this, (_expression))').parameterized_modifier('then','re','returning','(function (it) {return (_modifiers)}).call(this, (_expression))');
this.parameterized_modifier('where','bind','(function () {var _modifiers; return (_expression)}).call(this)');
this.parameterized_modifier('when','((_modifiers) && (_expression))').parameterized_modifier('unless','(! (_modifiers) && (_expression))').parameterized_modifier('otherwise','((_expression) || (_modifiers))');
this.parameterized_modifier('over',this.with_gensyms('(function () {for (var gensym_xs = (_modifiers), gensym_result = [], gensym_i = 0, gensym_l = gensym_xs.length, it; gensym_i < gensym_l; ++gensym_i) '+'  it = gensym_xs[gensym_i], gensym_result.push(_expression); return gensym_result}).call(this)')).parameterized_modifier('over_keys',this.with_gensyms('(function () {var gensym_x = (_modifiers), gensym_result = []; '+'for (var it in gensym_x) Object.prototype.hasOwnProperty.call(gensym_x, it) && gensym_result.push(_expression); return gensym_result}).call(this)')).parameterized_modifier('over_values',this.with_gensyms('(function () {var gensym_x = (_modifiers), gensym_result = [], it; '+'for (var gensym_k in gensym_x) Object.prototype.hasOwnProperty.call(gensym_x, gensym_k) && (it = gensym_x[gensym_k], gensym_result.push(_expression));'+'return gensym_result}).call(this)'));
this.parameterized_modifier('until',this.with_gensyms('(function () {var gensym_result = []; while (! (_modifiers)) gensym_result.push(_expression); return gensym_result}).call(this)'))});
caterwaul.configure(function (){this.event('bake').on_bake(function (){this.bake=function (){throw new Error('cannot bake a caterwaul function more than once')}}).method('method_until_baked',function (name,f){return this.method(name,f).on_bake(function (){this[name]=function (){throw new Error('cannot call '+name+' after baking')}})});
this.on_bake(function (){this.method('macroexpand_single',this.create_baked_macroexpander(this.macro_patterns,this.macro_expanders))});
this.method('create_baked_macroexpander',(function (){var resolve_tree_path=function (tree,path){for (var i=0,l=path.length;
i<l;
 ++i)if ( !(tree=tree[path.charCodeAt(i)]))return tree;
return tree},partition_treeset=function (trees,path){for (var r={},i=0,l=trees.length,t,ti;
i<l;
 ++i)(t=resolve_tree_path(ti=trees[i],path))?(t=String.fromCharCode(t.length)+t.data):(t=''),(r[t]||(r[t]=[])).push(ti);
return r},next_path=function (visited,trees){if ( !visited)return '';
for (var k in visited)if (visited.hasOwnProperty(k))for (var i=0,l=visited[k],p;
i<l;
 ++i)if ( !((p=k+String.fromCharCode(i)) in visited)){for (var j=0,lj=trees.length,skip;
j<lj;
 ++j)if (skip=resolve_tree_path(trees[j],p).is_wildcard())break ;
if ( !skip)return p}},visit_path=function (path,visited,trees){var partitions=partition_treeset(trees,path),kv=function (k,v){var r={};
r[k]=v;
return r};
for (var k in partitions)if (partitions.hasOwnProperty(k))partitions[k]={trees:partitions[k],visited:merge({},visited,kv(path,k.charCodeAt(0)))};
return partitions},split_treeset_on_specification=function (trees,pattern_data,visited){var r=[],visited_count=0,available_paths={},available_count=0;
if (visited!=null){for (var k in visited)if (visited.hasOwnProperty(k)){ ++visited_count;
for (var i=0,l=visited[k];
i<l;
 ++i)available_paths[k+String.fromCharCode(i)]= ++available_count}}else available_paths={'':available_count=1};
for (var p=[],s=false,remaining_paths=null,remaining_count=0,i=0,l=trees.length,t,td;
i<l;
 ++i)if (((td=pattern_data[(t=trees[i]).id()]).non_wildcards===visited_count)!==s)r.push(p),p=[t],s= !s,remaining_paths=null;
else if (s)p.push(t);
else {if (remaining_paths===null)remaining_paths=merge({},available_paths),remaining_count=available_count;
for (var ps=td.wildcard_paths,j=0,lj=ps.length,pj;
j<lj;
 ++j)remaining_count-=remaining_paths.hasOwnProperty(pj=ps[j]),delete remaining_paths[pj];
if (remaining_count)p.push(t);
else r.push(p),r.push([]),p=[t],remaining_paths=null}p.length&&r.push(p);
return r},wildcard_paths=function (t){for (var r=t.is_wildcard()?['']:[],i=0,l=t.length;
i<l;
 ++i)for (var ps=t[i]&&wildcard_paths(t[i]),j=0,lj=ps.length;
j<lj;
 ++j)r.push(String.fromCharCode(i)+ps[j]);
return r},pattern_data=function (ps,es){for (var r={},i=0,l=ps.length,p;
i<l;
 ++i)r[(p=ps[i]).id()]={expander:es[i],non_wildcards:non_wildcard_node_count(p),wildcard_paths:wildcard_paths(p)};
return r},pattern_match_function_template=caterwaul.parse('function (t) {var result; _body}'),empty_variable_mapping_table=function (){return {'':'t'}},partition_template=caterwaul.parse('switch (_value) {_cases}'),partition_branch_template=caterwaul.parse('case _value: _body; break'),single_macro_attempt_template=caterwaul.parse('do {_body} while (false)'),indexed_path_reference_template=caterwaul.parse('_base[_index]'),absolute_path_reference_template=caterwaul.parse('_base'),generate_path_reference=function (variables,path){return variables[path]?absolute_path_reference_template.replace({_base:variables[path]}):indexed_path_reference_template.replace({_base:generate_path_reference(variables,path.substr(0,path.length-1)),_index:''+path.charCodeAt(path.length-1)})},path_variable_template=caterwaul.parse('var _temp = _value; if (! _temp) break'),path_exists_template=caterwaul.parse('null'),generate_path_variable=function (variables,path){if (variables[path])return path_exists_template;
var name='t'+genint(),replacements={_value:generate_path_reference(variables,path),_temp:name};
return variables[path]=name,path_variable_template.replace(replacements)},non_wildcard_node_count=function (tree){var r=0;
tree.reach(function (node){r+= !node.is_wildcard()});
return r},path_reference_object_template=caterwaul.parse('{_elements}'),variable_value_pair_template=caterwaul.parse('_variable: _value'),generate_path_reference_object=function (pattern,variables,paths){for (var refs=[],i=0,l=paths.length;
i<l;
 ++i)refs.push(variable_value_pair_template.replace({_variable:resolve_tree_path(pattern,paths[i]).data,_value:generate_path_reference(variables,paths[i])}));
return path_reference_object_template.replace({_elements:refs.length?new caterwaul.syntax(',',refs):undefined})},macroexpander_invocation_template=caterwaul.parse('if (result = _expander.apply(this, _path_reference_object)) return result'),generate_macroexpander_invocation=function (pattern_data,pattern,variables){return macroexpander_invocation_template.replace({_expander:new caterwaul.ref(pattern_data[pattern.id()].expander),_path_reference_object:generate_path_reference_object(pattern,variables,pattern_data[pattern.id()].wildcard_paths)})},length_reference_template=caterwaul.parse('_value.length'),data_reference_template=caterwaul.parse('_value.data'),generate_partitioned_switch=function (trees,visited,variables,pattern_data){var path=next_path(visited,trees),partitions=visit_path(path,visited,trees),lengths={},length_pairs=[];
for (var k in partitions)if (partitions.hasOwnProperty(k))(lengths[k.charCodeAt(0)]||(lengths[k.charCodeAt(0)]=[])).push(k.substr(1));
for (var k in lengths)if (lengths.hasOwnProperty(k))length_pairs.push([k,lengths[k]]);
var new_variables=merge({},variables),path_reference_variable=generate_path_variable(new_variables,path),variable=new_variables[path],length_reference=length_reference_template.replace({_value:variable}),data_reference=data_reference_template.replace({_value:variable});
for (var length_cases=new caterwaul.syntax(';'),i=0,l=length_pairs.length,pair;
i<l;
 ++i){for (var data_cases=new caterwaul.syntax(';'),length=(pair=length_pairs[i])[0],values=pair[1],j=0,lj=values.length,p,v;
j<lj;
 ++j)p=partitions[String.fromCharCode(length)+(v=values[j])],data_cases.push(partition_branch_template.replace({_value:'"'+v.replace(/([\\"])/g,'\\$1')+'"',_body:generate_decision_tree(p.trees,path,p.visited,new_variables,pattern_data)}));
lj&&length_cases.push(partition_branch_template.replace({_value:''+length_pairs[i][0],_body:partition_template.replace({_value:data_reference,_cases:data_cases})}))}return single_macro_attempt_template.replace({_body:new caterwaul.syntax(';',path_reference_variable,length_cases.length?partition_template.replace({_value:length_reference,_cases:length_cases}):[])})},generate_unpartitioned_sequence=function (trees,variables,pattern_data){for (var r=new caterwaul.syntax(';'),i=0,l=trees.length;
i<l;
 ++i)r.push(generate_macroexpander_invocation(pattern_data,trees[i],variables));
return r},generate_decision_tree=function (trees,path,visited,variables,pattern_data){for (var r=new caterwaul.syntax(';'),sts=split_treeset_on_specification(trees,pattern_data,visited),i=0,l=sts.length;
i<l;
 ++i)sts[i].length&&r.push(i&1?generate_unpartitioned_sequence(sts[i],variables,pattern_data):generate_partitioned_switch(sts[i],visited,variables,pattern_data));
return r};
return function (patterns,expanders){for (var i=patterns.length-1,rps=[],res=[];
i>=0;
 --i)rps.push(patterns[i]),res.push(expanders[i]);
return this.compile(pattern_match_function_template.replace({_body:generate_decision_tree(rps,null,null,empty_variable_mapping_table(),pattern_data(rps,res))}))}})())});
caterwaul.tconfigure('core.words core.js core.quote',caterwaul.precompiled_internal((function (){null;
return (function (){this.shallow('state_markers',{}).shallow('state_markers_inverse',{}).variadic('state_marker',(function (m){return (function (){var s=this.gensym();
return ((function (it){return (this.state_markers[this.state_markers_inverse[s]=m]=s),it}).call(this,(this)))}).call(this)})).method('translate_state_markers',(function (t){return this.ensure_syntax(t).replace(this.state_markers)})).method('translate_state_markers_inverse',(function (t){return this.ensure_syntax(t).replace(this.state_markers_inverse)})).method('initial_state',(function (name){return this.before(this.global().clone().final_macro('_x',this.translate_state_markers((''+(name)+'[_x]'))))})).right_variadic_binary('tmacro',(function (pattern,expansion){return (function (){var new_pattern=this.translate_state_markers(pattern),new_expansion=expansion.constructor===Function?expansion:this.translate_state_markers(expansion);
return (this.macro(new_pattern,new_expansion))}).call(this)}))})}).call(this)));
caterwaul.tconfigure('core.js core.words core.quote',caterwaul.precompiled_internal((function (){var gensym_1_gn1w4b96_c2i21t=new caterwaul.syntax('()',new caterwaul.syntax('.',new caterwaul.syntax('caterwaul'),new caterwaul.syntax('precompiled_internal')),new caterwaul.syntax('_x'));
var gensym_1_gn1w4b96_c2i21u=new caterwaul.syntax('new',new caterwaul.syntax('()',new caterwaul.syntax('.',new caterwaul.syntax('caterwaul'),new caterwaul.syntax('syntax')),new caterwaul.syntax('_name')));
var gensym_1_gn1w4b96_c2i21v=new caterwaul.syntax('new',new caterwaul.syntax('()',new caterwaul.syntax('.',new caterwaul.syntax('caterwaul'),new caterwaul.syntax('syntax')),new caterwaul.syntax(',',new caterwaul.syntax('_name'),new caterwaul.syntax('_children'))));
var gensym_1_gn1w4b96_c2i21w=new caterwaul.syntax('()',new caterwaul.syntax('.',new caterwaul.syntax('caterwaul'),new caterwaul.syntax('clone')),new caterwaul.syntax('_string'));
return (function (){(function (){var nontrivial_function_pattern=caterwaul.parse('function (_args) {_body}'),trivial_function_pattern=caterwaul.parse('function ()      {_body}'),nontrivial_function_gensym_template=caterwaul.parse('function (_args, _gensym) {_body}'),trivial_function_gensym_template=caterwaul.parse('function (_gensym)        {_body}'),nontrivial_gensym_detection_pattern=nontrivial_function_gensym_template,trivial_gensym_detection_pattern=trivial_function_gensym_template,annotate_macro_generator=(function (template){return (function (references){return (function (match){return (function (){var s=caterwaul.gensym(),result=template.replace({_args:match._args,_gensym:s,_body:annotate_functions_in(match._body,references)});
return ((function (it){return (references[s]={tree:result}),it}).call(this,(result)))}).call(this)})})}),mark_nontrivial_function_macro=annotate_macro_generator(nontrivial_function_gensym_template),mark_trivial_function_macro=annotate_macro_generator(trivial_function_gensym_template),annotate_functions_in=(function (tree,references){return caterwaul.macro_expand_naive(tree,[trivial_function_pattern,nontrivial_function_pattern],[mark_trivial_function_macro(references),mark_nontrivial_function_macro(references)])}),function_key=(function (tree){return (function (){var matches=nontrivial_gensym_detection_pattern.match(tree)||trivial_gensym_detection_pattern.match(tree);
return (((matches)&&(matches._gensym.data)))}).call(this)}),mark_as_compiled=(function (references,k,tree,environment){return ((k&&references[k])&&((function (it){return (references[k].compiled=tree,references[k].environment=environment),it}).call(this,((function (it){return (((references[k].compiled)&&((function (){throw new Error(('detected multiple compilations of '+(references[k].tree.serialize())+''))}).call(this)))),it}).call(this,(references[k]))))))}),wrapped_compile=(function (original,references){return (function (tree,environment){return (function (it){return (mark_as_compiled(references,function_key(tree),tree,caterwaul.merge({},this.globals,environment))),it}).call(this,(original.call(this,tree,environment)))})}),signal_already_compiled=(function (tree){return gensym_1_gn1w4b96_c2i21t.replace({_x:tree})}),closure_template=caterwaul.parse('(function () {_vars; return (_value)}).call(this)'),closure_variable_template=caterwaul.parse('var _var = _value'),closure_null_template=caterwaul.parse('null'),escape_string=(function (s){return '\''+s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/'/g,'\\\'')+'\''}),caterwaul_ref_string=(function (configurations){return '\''+(function (){var gensym_1_gn1w4b96_c2i21n=(configurations),gensym_1_gn1w4b96_c2i21o=[];
for (var it in gensym_1_gn1w4b96_c2i21n)Object.prototype.hasOwnProperty.call(gensym_1_gn1w4b96_c2i21n,it)&&gensym_1_gn1w4b96_c2i21o.push(it);
return gensym_1_gn1w4b96_c2i21o}).call(this)+'\''}),serialize_syntax=(function (value){return value.length===0?gensym_1_gn1w4b96_c2i21u.replace({_name:escape_string(value.data)}):(function (){var children=new caterwaul.syntax(',',(function (){for (var gensym_1_gn1w4b96_c2i21j=(value),gensym_1_gn1w4b96_c2i21k=[],gensym_1_gn1w4b96_c2i21l=0,gensym_1_gn1w4b96_c2i21m=gensym_1_gn1w4b96_c2i21j.length,it;
gensym_1_gn1w4b96_c2i21l<gensym_1_gn1w4b96_c2i21m;
 ++gensym_1_gn1w4b96_c2i21l)it=gensym_1_gn1w4b96_c2i21j[gensym_1_gn1w4b96_c2i21l],gensym_1_gn1w4b96_c2i21k.push(serialize_syntax(it));
return gensym_1_gn1w4b96_c2i21k}).call(this)).unflatten();
return (gensym_1_gn1w4b96_c2i21v.replace({_name:escape_string(value.data),_children:children}))}).call(this)}),serialize_caterwaul=(function (value){return gensym_1_gn1w4b96_c2i21w.replace({_string:caterwaul_ref_string(value.has)})}),serialize_ref=(function (value,name,seen){return  !value?(''+(value)+''):value.constructor===caterwaul.syntax?seen[value.id()]||(function (it){return (serialize_syntax(value))}).call(this,((seen[value.id()]=name))):value.is_caterwaul===caterwaul.is_caterwaul?seen[value.id()]||(function (it){return (serialize_caterwaul(value))}).call(this,((seen[value.id()]=name))):(function (){throw new Error(('syntax ref value is not serializable: '+(value)+''))}).call(this)}),single_variable=(function (name,value){return closure_variable_template.replace({_var:name,_value:value})}),names_and_values_for=(function (environment){return (function (){var gensym_1_gn1w4b96_c2i21n=(environment),gensym_1_gn1w4b96_c2i21o=[];
for (var it in gensym_1_gn1w4b96_c2i21n)Object.prototype.hasOwnProperty.call(gensym_1_gn1w4b96_c2i21n,it)&&gensym_1_gn1w4b96_c2i21o.push(single_variable(it,environment[it]));
return gensym_1_gn1w4b96_c2i21o}).call(this)}),tree_variables=(function (tree){return (function (){var vars=[],seen={};
return ((function (it){return (tree.reach((function (n){return ((n&&n.binds_a_value)&&(vars.push(single_variable(n.data,serialize_ref(n.value,n.data,seen)))))}))),it}).call(this,(vars)))}).call(this)}),variables_for=(function (tree,environment){return (function (){var all_variables=names_and_values_for(environment).concat(tree_variables(tree));
return (all_variables.length?new caterwaul.syntax(';',all_variables):closure_null_template)}).call(this)}),precompiled_closure=(function (tree,environment){return closure_template.replace({_vars:variables_for(tree,environment),_value:tree})}),precompiled_function=(function (tree,environment){return signal_already_compiled(precompiled_closure(tree,environment))}),substitute_precompiled=(function (references){return (function (match){return (function (){var ref=references[match._gensym.data];
return (((ref&&ref.compiled)&&(precompiled_function(ref.compiled,ref.environment))))}).call(this)})}),perform_substitution=(function (references,tree){return (function (){var expander=substitute_precompiled(references);
return (caterwaul.macro_expand_naive(tree,[trivial_gensym_detection_pattern,nontrivial_gensym_detection_pattern],[expander,expander]))}).call(this)}),reconstruct_original=(function (references,match){return (function (){var new_match={_body:remove_gensyms(references,match._body),_args:match._args};
return (match._args?nontrivial_function_pattern.replace(new_match):trivial_function_pattern.replace(new_match))}).call(this)}),remove_referenced_gensyms=(function (references){return (function (match){return (function (){var ref=references[match._gensym.data];
return (((ref&&ref.tree)&&(reconstruct_original(references,match))))}).call(this)})}),remove_gensyms=(function (references,tree){return (function (){var expander=remove_referenced_gensyms(references);
return (caterwaul.macro_expand_naive(tree,[trivial_gensym_detection_pattern,nontrivial_gensym_detection_pattern],[expander,expander]))}).call(this)}),annotated_caterwaul=(function (caterwaul,references){return caterwaul.clone().method('compile',wrapped_compile(caterwaul.compile,references))}),trace_execution=(function (caterwaul,f){return (function (){var references={},annotated=annotate_functions_in(caterwaul.parse(f),references);
return ((function (it){return (caterwaul.compile(annotated,{caterwaul:annotated_caterwaul(caterwaul,references)})()),it}).call(this,({references:references,annotated:annotated})))}).call(this)});
return (this.method('precompile',(function (f){return (function (){var traced=trace_execution(this,f);
return (this.compile(remove_gensyms(traced.references,perform_substitution(traced.references,traced.annotated))))}).call(this)})))}).call(this)})}).call(this)));
caterwaul.tconfiguration('core.js core.words','core.test',caterwaul.precompiled_internal((function (){null;
return (function (){this.event('test_defined','test_passed','test_failed'),this.method('test',(function (name,f){return (function (it){return (this.test_defined(name,it)),it}).call(this,((function (it){return (this.merge(it,this.test_methods)),it}).call(this,(this.test_transform(f)))))}))})}).call(this)));
caterwaul.shallow('trace',caterwaul.clone().tconfigure('core.js core.words core.quote',caterwaul.precompiled_internal((function (){var gensym_1_gn1w4b96_c2i22j=new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('=',new caterwaul.syntax('_x'),new caterwaul.syntax('_y')));
var gensym_1_gn1w4b96_c2i22k=new caterwaul.syntax('[]',new caterwaul.syntax('H'),new caterwaul.syntax(',',new caterwaul.syntax('_'),new caterwaul.syntax('=',new caterwaul.syntax('_x'),new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_y')))));
var gensym_1_gn1w4b96_c2i22l=new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('=',new caterwaul.syntax('[]',new caterwaul.syntax('_x'),new caterwaul.syntax('_y')),new caterwaul.syntax('_z')));
var gensym_1_gn1w4b96_c2i22m=new caterwaul.syntax('[]',new caterwaul.syntax('H'),new caterwaul.syntax(',',new caterwaul.syntax('_'),new caterwaul.syntax('=',new caterwaul.syntax('[]',new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_x')),new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_y'))),new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_z')))));
var gensym_1_gn1w4b96_c2i22n=new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('=',new caterwaul.syntax('.',new caterwaul.syntax('_x'),new caterwaul.syntax('_y')),new caterwaul.syntax('_z')));
var gensym_1_gn1w4b96_c2i22o=new caterwaul.syntax('[]',new caterwaul.syntax('H'),new caterwaul.syntax(',',new caterwaul.syntax('_'),new caterwaul.syntax('=',new caterwaul.syntax('.',new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_x')),new caterwaul.syntax('_y')),new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_z')))));
var gensym_1_gn1w4b96_c2i22p=new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('+',new caterwaul.syntax('_x'),new caterwaul.syntax('_y')));
var gensym_1_gn1w4b96_c2i22q=new caterwaul.syntax('[]',new caterwaul.syntax('H'),new caterwaul.syntax(',',new caterwaul.syntax('_'),new caterwaul.syntax('+',new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_x')),new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('_y')))));
var gensym_1_gn1w4b96_c2i22r=new caterwaul.syntax('[]',new caterwaul.syntax('E'),new caterwaul.syntax('u+',new caterwaul.syntax('_x')));
var gensym_1_gn1w4b96_c2i22s=new caterwaul.syntax('[]',new caterwaul.syntax('H'),new caterwaul.syntax(',',new caterwaul.syntax('_'),new caterwaul.syntax('u+',new caterwaul.syntax('[]',new caterwaul.syntax('T'),new caterwaul.syntax('_x')))));
var gensym_1_gn1w4b96_c2i22t=new caterwaul.syntax(',',new caterwaul.syntax('()',new caterwaul.syntax('_before_hook'),new caterwaul.syntax('_tree')),new caterwaul.syntax('()',new caterwaul.syntax('_after_hook'),new caterwaul.syntax(',',new caterwaul.syntax('_tree'),new caterwaul.syntax('_expression'))));
var gensym_1_gn1w4b96_c2i22u=new caterwaul.syntax(',',new caterwaul.syntax('()',new caterwaul.syntax('_before_hook'),new caterwaul.syntax('_tree')),new caterwaul.syntax('()',new caterwaul.syntax('_after_hook'),new caterwaul.syntax(',',new caterwaul.syntax(',',new caterwaul.syntax(',',new caterwaul.syntax('_tree'),new caterwaul.syntax('_object')),new caterwaul.syntax('_method')),new caterwaul.syntax('[',new caterwaul.syntax('_parameters')))));
return (function (){(function (){var qw=(function (s){return s.split(/\s+/)});
return (this.event('before_trace','after_trace'),(function (){for (var gensym_1_gn1w4b96_c2i229=(qw('E S H D I')),gensym_1_gn1w4b96_c2i22a=[],gensym_1_gn1w4b96_c2i22b=0,gensym_1_gn1w4b96_c2i22c=gensym_1_gn1w4b96_c2i229.length,it;
gensym_1_gn1w4b96_c2i22b<gensym_1_gn1w4b96_c2i22c;
 ++gensym_1_gn1w4b96_c2i22b)it=gensym_1_gn1w4b96_c2i229[gensym_1_gn1w4b96_c2i22b],gensym_1_gn1w4b96_c2i22a.push(this.state_marker(it));
return gensym_1_gn1w4b96_c2i22a}).call(this),this.method('assignment_operator',(function (op){return this.tmacro(gensym_1_gn1w4b96_c2i22j.replace({'=':op}),gensym_1_gn1w4b96_c2i22k.replace({'=':op})).tmacro(gensym_1_gn1w4b96_c2i22l.replace({'=':op}),gensym_1_gn1w4b96_c2i22m.replace({'=':op})).tmacro(gensym_1_gn1w4b96_c2i22n.replace({'=':op}),gensym_1_gn1w4b96_c2i22o.replace({'=':op}))})).method('binary_operator',(function (op){return this.tmacro(gensym_1_gn1w4b96_c2i22p.replace({'+':op}),gensym_1_gn1w4b96_c2i22q.replace({'+':op}))})).method('unary_operator',(function (op){return this.tmacro(gensym_1_gn1w4b96_c2i22r.replace({'u+':('u'+(op)+'')}),gensym_1_gn1w4b96_c2i22s.replace({'u+':('u'+(op)+'')}))})),this.tmacro('E[]','null').tmacro('E[_x]','H[_, _x]'),(function (){for (var gensym_1_gn1w4b96_c2i229=(qw('= += -= *= /= %= &= |= ^= <<= >>= >>>=')),gensym_1_gn1w4b96_c2i22a=[],gensym_1_gn1w4b96_c2i22b=0,gensym_1_gn1w4b96_c2i22c=gensym_1_gn1w4b96_c2i229.length,it;
gensym_1_gn1w4b96_c2i22b<gensym_1_gn1w4b96_c2i22c;
 ++gensym_1_gn1w4b96_c2i22b)it=gensym_1_gn1w4b96_c2i229[gensym_1_gn1w4b96_c2i22b],gensym_1_gn1w4b96_c2i22a.push(this.assignment_operator(it));
return gensym_1_gn1w4b96_c2i22a}).call(this),(function (){for (var gensym_1_gn1w4b96_c2i229=(qw('() [] + - * / % < > <= >= == != === !== in instanceof ^ & | && ||')),gensym_1_gn1w4b96_c2i22a=[],gensym_1_gn1w4b96_c2i22b=0,gensym_1_gn1w4b96_c2i22c=gensym_1_gn1w4b96_c2i229.length,it;
gensym_1_gn1w4b96_c2i22b<gensym_1_gn1w4b96_c2i22c;
 ++gensym_1_gn1w4b96_c2i22b)it=gensym_1_gn1w4b96_c2i229[gensym_1_gn1w4b96_c2i22b],gensym_1_gn1w4b96_c2i22a.push(this.binary_operator(it));
return gensym_1_gn1w4b96_c2i22a}).call(this),(function (){for (var gensym_1_gn1w4b96_c2i229=(qw('+ - ! ~')),gensym_1_gn1w4b96_c2i22a=[],gensym_1_gn1w4b96_c2i22b=0,gensym_1_gn1w4b96_c2i22c=gensym_1_gn1w4b96_c2i229.length,it;
gensym_1_gn1w4b96_c2i22b<gensym_1_gn1w4b96_c2i22c;
 ++gensym_1_gn1w4b96_c2i22b)it=gensym_1_gn1w4b96_c2i229[gensym_1_gn1w4b96_c2i22b],gensym_1_gn1w4b96_c2i22a.push(this.unary_operator(it));
return gensym_1_gn1w4b96_c2i22a}).call(this),this.tmacro('E[(_x)]','(E[_x])').tmacro('E[++_x]','H[_, ++_x]').tmacro('E[--_x]','H[_, --_x]').tmacro('E[_x++]','H[_, _x++]').tmacro('E[_x--]','H[_, _x--]').tmacro('E[_x, _y]','E[_x], E[_y]').tmacro('E[_x._y]','H[_, E[_x]._y]').tmacro('E[_f()]','H[_, E[_f]()]').tmacro('E[_o._m(_xs)]','D[_, E[_o], _m, [E[_xs]]]').tmacro('E[_o[_m](_xs)]','I[_, E[_o], E[_m], [E[_xs]]]').tmacro('E[_o._m()]','D[_, E[_o], _m, []').tmacro('E[_o[_m]()]','I[_, E[_o], E[_m], []').tmacro('E[typeof _x]','H[_, typeof _x]').tmacro('E[void _x]','H[_, void E[_x]]').tmacro('E[delete _x._y]','H[_, delete E[_x]._y]').tmacro('E[new _x(_y)]','H[_, new H[_x](E[_y])]').tmacro('E[{_ps}]','H[_, {E[_ps]}]').tmacro('E[_k: _v]','_k: E[_v]').tmacro('E[[_xs]]','H[_, [E[_xs]]]').tmacro('E[_x ? _y : _z]','H[_, E[_x] ? E[_y] : E[_z]]').tmacro('E[function (_xs) {_body}]','H[_, function (_xs) {S[_body]}]').tmacro('E[function ()    {_body}]','H[_, function ()    {S[_body]}]'),this.tmacro('S[_x]','E[_x]').tmacro('S[for (_x) _y]','for (S[_x]) S[_y]').tmacro('S[{_x}]','{S[_x]}').tmacro('S[for (_x; _y; _z) _body]','for (S[_x]; E[_y]; E[_z]) S[_body]').tmacro('S[_x; _y]','S[_x]; S[_y]').tmacro('S[while (_x) _y]','while (E[_x]) S[_y]').tmacro('S[do _x; while (_y)]','do S[_x]; while (E[_y])').tmacro('S[function _f(_args) {_body}]','function _f(_args) {S[_body]}').tmacro('S[do {_x} while (_y)]','do {S[_x]} while (E[_y])').tmacro('S[function _f()      {_body}]','function _f()      {S[_body]}').tmacro('S[_x, _y]','S[_x], S[_y]').tmacro('S[try {_x} catch (_e) {_y}]','try {S[_x]} catch (_e) {S[_y]}').tmacro('S[_x = _y]','_x = E[_y]').tmacro('S[try {_x} catch (_e) {_y} finally {_z}]','try {S[_x]} catch (_e) {S[_y]} finally {S[_z]}').tmacro('S[var _xs]','var S[_xs]').tmacro('S[try {_x} finally {_y}]','try {S[_x]} finally {S[_y]}').tmacro('S[const _xs]','const S[_xs]').tmacro('S[return _x]','return E[_x]').tmacro('S[if (_x) _y]','if (E[_x]) S[_y]').tmacro('S[return]','return').tmacro('S[if (_x) _y; else _z]','if (E[_x]) S[_y]; else S[_z]').tmacro('S[throw _x]','throw E[_x]').tmacro('S[if (_x) {_y} else _z]','if (E[_x]) {S[_y]} else S[_z]').tmacro('S[break _label]','break _label').tmacro('S[break]','break').tmacro('S[switch (_c) {_body}]','switch (E[_c]) {S[_body]}').tmacro('S[continue _label]','continue _label').tmacro('S[with (_x) _y]','with (E[_x]) S[_y]').tmacro('S[continue]','continue').tmacro('S[_label: _stuff]','_label: S[_stuff]'),this.tmacro('H[_tree, _x]',(function (match){return this.expression_hook(match._tree[1],match._x)})).tmacro('D[_tree, _object, _method, [_parameters]]',(function (match){return this.direct_method_hook(match._tree[1],match)})).tmacro('I[_tree, _object, _method, [_parameters]]',(function (match){return this.indirect_method_hook(match._tree[1],match)})),this.method('before_hook',(function (tree){return this.before_trace(tree)})).method('after_hook',(function (tree,value){return (function (it){return (value)}).call(this,(this.after_trace(tree,value)))})).method('after_method_hook',(function (tree,object,method,parameters){return (function (){var resolved=object[method];
return ((function (it){return (this.after_hook(tree,resolved.apply(object,parameters)))}).call(this,((function (it){return (this.after_trace(tree[0],resolved))}).call(this,(this.before_trace(tree[0]))))))}).call(this)})).once('before_hook_ref',(function (nothing){return new this.ref(this.before_hook)})).once('after_hook_ref',(function (nothing){return new this.ref(this.after_hook)})).once('after_method_hook_ref',(function (nothing){return new this.ref(this.after_method_hook)})).method('quote_method_name',(function (method){return ('"'+(method.data.replace(/"/g,"\\\""))+'"')})).field('expression_hook_template',gensym_1_gn1w4b96_c2i22t.as('(')).field('indirect_method_hook_template',gensym_1_gn1w4b96_c2i22u.as('(')).method('expression_hook',(function (original,tree){return this.expression_hook_template.replace({_before_hook:this.before_hook_ref(),_after_hook:this.after_hook_ref(),_tree:new this.ref(original),_expression:tree.as('(')})})).method('method_hook',(function (tree,object,method,parameters){return this.indirect_method_hook_template.replace({_before_hook:this.before_hook_ref(),_after_hook:this.after_method_hook_ref(),_tree:new this.ref(tree),_object:object,_method:method,_parameters:parameters})})).method('direct_method_hook',(function (tree,match){return this.method_hook(tree,match._object,this.quote_method_name(match._method),match._parameters)})).method('indirect_method_hook',(function (tree,match){return this.method_hook(tree,match._object,match._method,match._parameters)})),this.initial_state('S'))}).call(this)})}).call(this))));
