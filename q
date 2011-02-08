#!/usr/bin/perl
# Run perldoc on this file for documentation.

$|++;

my %data;
my %transient;
my %externalized_functions;
my %datatypes;

my %locations;          # Maps eval-numbers to attribute names

sub meta::define_form {
  my ($namespace, $delegate) = @_;
  $datatypes{$namespace} = $delegate;
  *{"meta::${namespace}::implementation"} = $delegate;
  *{"meta::$namespace"} = sub {
    my ($name, $value, %options) = @_;
    chomp $value;
    $data{"${namespace}::$name"} = $value unless $options{no_binding};
    $delegate->($name, $value) unless $options{no_delegate}}}

sub meta::eval_in {
  my ($what, $where) = @_;

  # Obtain next eval-number and alias it to the designated location
  @locations{eval('__FILE__') =~ /\(eval (\d+)\)/} = ($where);

  my $result = eval $what;
  $@ =~ s/\(eval \d+\)/$where/ if $@;
  warn $@ if $@;
  $result}

meta::define_form 'meta', sub {
  my ($name, $value) = @_;
  meta::eval_in($value, "meta::$name")};

meta::meta('configure', <<'__25976e07665878d3fae18f050160343f');
# A function to configure transients. Transients can be used to store any number of
# different things, but one of the more common usages is type descriptors.

sub meta::configure {
  my ($datatype, %options) = @_;
  $transient{$_}{$datatype} = $options{$_} for keys %options;
}
__25976e07665878d3fae18f050160343f
meta::meta('externalize', <<'__9141b4e8752515391385516ae94b23b5');
# Function externalization. Data types should call this method when defining a function
# that has an external interface.

sub meta::externalize {
  my ($name, $attribute, $implementation) = @_;
  $externalized_functions{$name} = $attribute;
  *{"::$name"} = $implementation || $attribute;
}
__9141b4e8752515391385516ae94b23b5
meta::meta('functor::editable', <<'__e3d2ede6edf65ffe2123584b2bd5dab7');
# An editable type. This creates a type whose default action is to open an editor
# on whichever value is mentioned. This can be changed using different flags.

sub meta::functor::editable {
  my ($typename, %options) = @_;

  meta::configure $typename, %options;
  meta::define_form $typename, sub {
    my ($name, $value) = @_;

    $options{on_bind} && &{$options{on_bind}}($name, $value);

    meta::externalize $options{prefix} . $name, "${typename}::$name", sub {
      my $attribute             = "${typename}::$name";
      my ($command, @new_value) = @_;

      return &{$options{default}}(retrieve($attribute)) if ref $options{default} eq 'CODE' and not defined $command;
      return edit($attribute) if $command eq 'edit' or $options{default} eq 'edit' and not defined $command;
      return associate($attribute, @new_value ? join(' ', @new_value) : join('', <STDIN>)) if $command eq '=' or $command eq 'import' or $options{default} eq 'import' and not defined $command;
      return retrieve($attribute)}}}
__e3d2ede6edf65ffe2123584b2bd5dab7
meta::meta('type::bootstrap', <<'__297d03fb32df03b46ea418469fc4e49e');
# Bootstrap attributes don't get executed. The reason for this is that because
# they are serialized directly into the header of the file (and later duplicated
# as regular data attributes), they will have already been executed when the
# file is loaded.

meta::configure 'bootstrap', extension => '.pl', inherit => 1;
meta::define_form 'bootstrap', sub {};
__297d03fb32df03b46ea418469fc4e49e
meta::meta('type::data', 'meta::functor::editable \'data\', extension => \'\', inherit => 0, default => \'cat\';');
meta::meta('type::function', <<'__d93b3cc15693707dac518e3d6b1f5648');
meta::configure 'function', extension => '.pl', inherit => 1;
meta::define_form 'function', sub {
  my ($name, $value) = @_;
  meta::externalize $name, "function::$name", meta::eval_in("sub {\n$value\n}", "function::$name");
};
__d93b3cc15693707dac518e3d6b1f5648
meta::meta('type::inc', <<'__c95915391b969734305f2f492d5ca8e3');
meta::configure 'inc', inherit => 1, extension => '.pl';
meta::define_form 'inc', sub {
  use File::Path 'mkpath';
  use File::Basename qw/basename dirname/;

  my ($name, $value) = @_;
  my $tmpdir   = basename($0) . '-' . $$;
  my $filename = "/tmp/$tmpdir/$name";

  push @INC, "/tmp/$tmpdir" unless grep /^\/tmp\/$tmpdir$/, @INC;

  mkpath(dirname($filename));
  unless (-e $filename) {
    open my $fh, '>', $filename;
    print $fh $value;
    close $fh;
  }
};
__c95915391b969734305f2f492d5ca8e3
meta::meta('type::internal_function', <<'__34abb44c67c7e282569e28ef6f4d62ab');
meta::configure 'internal_function', extension => '.pl', inherit => 1;
meta::define_form 'internal_function', sub {
  my ($name, $value) = @_;
  *{$name} = meta::eval_in("sub {\n$value\n}", "internal_function::$name");
};
__34abb44c67c7e282569e28ef6f4d62ab
meta::meta('type::library', <<'__a9c0193f297bbc96a78eb5e27727fd30');
meta::configure 'library', extension => '.pl', inherit => 1;
meta::define_form 'library', sub {
  my ($name, $value) = @_;
  meta::eval_in($value, "library::$name");
  meta::externalize $name, "library::$name", sub {
    edit("library::$name");
  };
};
__a9c0193f297bbc96a78eb5e27727fd30
meta::meta('type::message_color', <<'__794bf137c425293738f07636bcfb5c55');
meta::configure 'message_color', extension => '', inherit => 1;
meta::define_form 'message_color', sub {
  my ($name, $value) = @_;
  terminal::color($name, $value);
};
__794bf137c425293738f07636bcfb5c55
meta::meta('type::meta', <<'__640f25635ce2365b0648962918cf9932');
# This doesn't define a new type. It customizes the existing 'meta' type
# defined in bootstrap::initialization. Note that horrible things will
# happen if you redefine it using the editable functor.

meta::configure 'meta', extension => '.pl', inherit => 1;
__640f25635ce2365b0648962918cf9932
meta::meta('type::note', 'meta::functor::editable \'note\', extension => \'.sdoc\', inherit => 0, default => \'edit\';');
meta::meta('type::parent', <<'__607e9931309b1b595424bedcee5dfa45');
meta::define_form 'parent', \&meta::bootstrap::implementation;
meta::configure 'parent', extension => '', inherit => 1;
__607e9931309b1b595424bedcee5dfa45
meta::meta('type::retriever', <<'__6e847a9d205e4a5589765a3366cdd115');
meta::configure 'retriever', extension => '.pl', inherit => 1;
meta::define_form 'retriever', sub {
  my ($name, $value) = @_;
  $transient{retrievers}{$name} = meta::eval_in("sub {\n$value\n}", "retriever::$name");
};
__6e847a9d205e4a5589765a3366cdd115
meta::meta('type::state', <<'__c1f29670be26f1df6100ffe4334e1202');
# Allows temporary or long-term storage of states. Nothing particularly insightful
# is done about compression, so storing alternative states will cause a large
# increase in size. Also, states don't contain other states -- otherwise the size
# increase would be exponential.

# States are created with the save-state function.

meta::configure 'state', inherit => 0, extension => '.pl';
meta::define_form 'state', \&meta::bootstrap::implementation;
__c1f29670be26f1df6100ffe4334e1202
meta::meta('type::watch', 'meta::functor::editable \'watch\', prefix => \'watch::\', inherit => 1, extension => \'.pl\', default => \'cat\';');
meta::bootstrap('initialization', <<'__8774229a1a0ce7fd056d81ba0b077f79');
#!/usr/bin/perl
# Run perldoc on this file for documentation.

$|++;

my %data;
my %transient;
my %externalized_functions;
my %datatypes;

my %locations;          # Maps eval-numbers to attribute names

sub meta::define_form {
  my ($namespace, $delegate) = @_;
  $datatypes{$namespace} = $delegate;
  *{"meta::${namespace}::implementation"} = $delegate;
  *{"meta::$namespace"} = sub {
    my ($name, $value, %options) = @_;
    chomp $value;
    $data{"${namespace}::$name"} = $value unless $options{no_binding};
    $delegate->($name, $value) unless $options{no_delegate}}}

sub meta::eval_in {
  my ($what, $where) = @_;

  # Obtain next eval-number and alias it to the designated location
  @locations{eval('__FILE__') =~ /\(eval (\d+)\)/} = ($where);

  my $result = eval $what;
  $@ =~ s/\(eval \d+\)/$where/ if $@;
  warn $@ if $@;
  $result}

meta::define_form 'meta', sub {
  my ($name, $value) = @_;
  meta::eval_in($value, "meta::$name")};

__8774229a1a0ce7fd056d81ba0b077f79
meta::bootstrap('perldoc', <<'__c63395cbc6f7160b603befbb2d9b6700');
=head1 Self-modifying Perl script

=head2 Original implementation by Spencer Tipping L<http://spencertipping.com>

The prototype for this script is licensed under the terms of the MIT source code license.
However, this script in particular may be under different licensing terms. To find out how
this script is licensed, please contact whoever sent it to you. Alternatively, you may
run it with the 'license' argument if they have specified a license that way.

You should not edit this file directly. For information about how it was constructed, go
to L<http://spencertipping.com/writing-self-modifying-perl>. For quick usage guidelines,
run this script with the 'usage' argument.

=cut

__c63395cbc6f7160b603befbb2d9b6700
meta::data('default-action', 'queue');
meta::data('license', <<'__3c6177256de0fddb721f534c3ad8c0ee');
MIT License
Copyright (c) 2010 Spencer Tipping

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
__3c6177256de0fddb721f534c3ad8c0ee
meta::data('name', 'q');
meta::data('quiet', '1');
meta::data('watching', '1');
meta::function('cat', 'join "\\n", retrieve(@_);');
meta::function('cc', <<'__5c64e1adc128113e1b409e0fbcbe29a2');
# Stashes a quick one-line continuation. (Used to remind me what I was doing.)
@_ ? associate('data::current-continuation', join(' ', @_)) : retrieve('data::current-continuation');
__5c64e1adc128113e1b409e0fbcbe29a2
meta::function('child', <<'__9b5175a0e9b94998754cad35582b987a');
my ($child_name) = @_;
clone($child_name);
enable();
qx($child_name update-from $0 -nu);
disable();
__9b5175a0e9b94998754cad35582b987a
meta::function('clone', <<'__5a30a4ba6293e250ed22884d609e4781');
for (grep length, @_) {
  file::write($_, serialize(), noclobber => 1);
  chmod(0700, $_);
}
__5a30a4ba6293e250ed22884d609e4781
meta::function('cp', <<'__e5fee448a74ecbf4ae215e6b43dfc048');
my $from = shift @_;
my $value = retrieve($from);
associate($_, $value) for @_;
__e5fee448a74ecbf4ae215e6b43dfc048
meta::function('create', <<'__7ca9912feb8e43dc446bab9a0c79821a');
my ($name, $value) = @_;
return edit($name) if exists $data{$name};
associate($name, defined $value ? $value : '');
edit($name) unless defined $value;
__7ca9912feb8e43dc446bab9a0c79821a
meta::function('current-state', <<'__d83ae43551c0f58d1d0ce576402a315a');
my @valid_keys   = grep ! /^state::/, sort keys %data;
my @ordered_keys = (grep(/^meta::/, @valid_keys), grep(! /^meta::/, @valid_keys));
join "\n", map serialize_single($_), @ordered_keys;
__d83ae43551c0f58d1d0ce576402a315a
meta::function('disable', 'chmod_self(sub {$_[0] & 0666});');
meta::function('edit', <<'__c74a5d1c0dbd922acaf1397f89190fce');
my ($name, %options) = @_;
my $extension = extension_for($name);

die "Attribute $name does not exist." unless exists $data{$name};
associate($name, invoke_editor_on($data{$name} || "# Attribute $name", %options, attribute => $name, extension => $extension),
          execute => $name !~ /^bootstrap::/);
save();
'';
__c74a5d1c0dbd922acaf1397f89190fce
meta::function('enable', 'chmod_self(sub {$_[0] | $_[0] >> 2});');
meta::function('export', <<'__388e0cc60507443cb1c0cc3e2658cfef');
# Exports data into a text file.
#   export attr1 attr2 attr3 ... file.txt
my $name = pop @_;
@_ or die 'Expected filename';
file::write($name, join "\n", retrieve(@_));
__388e0cc60507443cb1c0cc3e2658cfef
meta::function('extern', '&{$_[0]}(retrieve(@_[1 .. $#_]));');
meta::function('grep', <<'__ba0d15b75bfe3555d76b894c93d465b7');
# Looks through attributes for a pattern. Usage is grep pattern [options], where
# [options] is the format as provided to select_keys.

my $pattern              = shift @_ or die 'Must specify a pattern to search for';
my ($options, @criteria) = separate_options(@_);
my @attributes           = select_keys(%$options, '--criteria' => join('|', @criteria));

my @m_attributes, @m_line_numbers, @m_lines;

for my $k (@attributes) {
  my @lines = split /\n/, retrieve($k);
  for (0 .. $#lines) {
    next unless $lines[$_] =~ /$pattern/;

    $lines[$_] =~ s/($pattern)/\033[1;31m\1\033[0;0m/g if $$options{'-c'};

    push @m_attributes,   $k;
    push @m_line_numbers, $_ + 1;
    push @m_lines,        $lines[$_]}} 

if ($$options{'-c'}) {
  s/^/\033[1;34m/o for @m_attributes;
  s/^/\033[1;32m/o && s/$/\033[0;0m/o for @m_line_numbers}

table_display([@m_attributes], [@m_line_numbers], [@m_lines]);
__ba0d15b75bfe3555d76b894c93d465b7
meta::function('hash', 'fast_hash(@_);');
meta::function('import', <<'__ac86cbe9c9fb12fc8cef2cc88e80c01e');
my $name = pop @_;
associate($name, @_ ? join('', map(file::read($_), @_)) : join('', <STDIN>)); 
__ac86cbe9c9fb12fc8cef2cc88e80c01e
meta::function('import-bundle', <<'__4c7139ed5c9f65f38a33cf8f8a6cae27');
eval join '', <STDIN>;
die $@ if $@;
__4c7139ed5c9f65f38a33cf8f8a6cae27
meta::function('initial-state', '$transient{initial};');
meta::function('load-state', <<'__0bddb2edf7d13e60bf47e7bce8c8c011');
my ($state_name) = @_;
my $state = retrieve("state::$state_name");

terminal::state('saving current state into _...');
&{'save-state'}('_');

delete $data{$_} for grep ! /^state::/, keys %data;
%externalized_functions = ();

terminal::state("restoring state $state_name...");
meta::eval_in($state, "state::$state_name");
terminal::error($@) if $@;
reload();
verify();
__0bddb2edf7d13e60bf47e7bce8c8c011
meta::function('lock', 'chmod_self(sub {$_[0] & 0555});');
meta::function('ls', <<'__acdc3ca5777ab9c7c430d493a7555998');
my ($options, @criteria) = separate_options(@_);
my ($all, $shadows, $dereference, $sizes, $flags) = @$options{qw(-a -s -d -z -l)};
$all   ||= $dereference;
$sizes ||= $flags;

return table_display([grep ! exists $data{$externalized_functions{$_}}, sort keys %externalized_functions]) if $shadows;

my $criteria    = join('|', @criteria);
my @definitions = select_keys('--criteria' => $criteria, %$options);

my %inverses  = map {$externalized_functions{$_} => $_} keys %externalized_functions;
my @externals = map $inverses{$_}, grep length, @definitions;
my @internals = grep length $inverses{$_}, @definitions;
my @sizes     = map sprintf('%6d %6d', length(serialize_single($_)), length(retrieve($_))), @{$all ? \@definitions : \@internals} if $sizes;

my %flag_hashes = map {$_ => {map {$_ => 1} select_keys("-$_" => 1)}} qw(m u i) if $flags;
my @flags       = map {my $k = $_; join '', map($flag_hashes{$_}{$k} ? $_ : '-', sort keys %flag_hashes)} @definitions if $flags;

join "\n", map strip($_), split /\n/, table_display($all ? [@definitions] : [grep length, @externals], $dereference ? ([@externals]) : (),
                                                    $sizes ? ([@sizes]) : (), $flags ? ([@flags]) : ());
__acdc3ca5777ab9c7c430d493a7555998
meta::function('ls-a', 'ls(\'-ad\', @_);');
meta::function('mv', <<'__52e95180e3c7019116bd798e0da0fdda');
my ($from, $to) = @_;
die "'$from' does not exist" unless exists $data{$from};
associate($to, retrieve($from));
rm($from);
__52e95180e3c7019116bd798e0da0fdda
meta::function('name', <<'__6848cbc257e4b6d7441b25acb04e23c9');
my $name = $0;
$name =~ s/^.*\///;
$name;
__6848cbc257e4b6d7441b25acb04e23c9
meta::function('note', <<'__bcbfeac6dd2112f47296265444570a6e');
# Creates a note with a given name, useful for jotting things down.
create("note::$_[0]");
__bcbfeac6dd2112f47296265444570a6e
meta::function('parents', 'join "\\n", grep s/^parent:://o, sort keys %data;');
meta::function('perl', <<'__986a274c013b77fe08d29726ce3799fe');
my $result = eval(join ' ', @_);
$@ ? terminal::error($@) : $result;
__986a274c013b77fe08d29726ce3799fe
meta::function('reload', 'execute($_) for grep ! /^bootstrap::/, keys %data;');
meta::function('rm', <<'__26d4a78ddb47259b3d8dcabe390426bd');
exists $data{$_} or terminal::warning("$_ does not exist") for @_;
delete @data{@_};
__26d4a78ddb47259b3d8dcabe390426bd
meta::function('save', 'dangerous(\'\', sub {file::write($0, serialize()); $transient{initial} = state()}) if verify();');
meta::function('save-state', <<'__5c5b586331e25951140ced6442d9fe2b');
# Creates a named copy of the current state and stores it.
my ($state_name) = @_;
associate("state::$state_name", &{'current-state'}(), execute => 1);
__5c5b586331e25951140ced6442d9fe2b
meta::function('serialize', <<'__5148e8ca46eeb3e297f76d098e496bcf');
my ($options, @criteria) = separate_options(@_);
my $partial     = $$options{'-p'};
my $criteria    = join '|', @criteria;
my @attributes  = map serialize_single($_), select_keys(%$options, '-m' => 1, '--criteria' => $criteria), select_keys(%$options, '-M' => 1, '--criteria' => $criteria);
my @final_array = @{$partial ? \@attributes : [retrieve('bootstrap::initialization'), @attributes, 'internal::main();', '', '__END__']};
join "\n", @final_array;
__5148e8ca46eeb3e297f76d098e496bcf
meta::function('serialize_single', <<'__ef0f63556d22816ed102d3bbe2172b28');
# Serializes a single attribute and optimizes for content.

my $name          = $_[0] || $_;
my $contents      = $data{$name};
my $meta_function = 'meta::' . namespace($name);
my $invocation    = attribute($name);
my $escaped       = $contents;
$escaped =~ s/\\/\\\\/go;
$escaped =~ s/'/\\'/go;

return "$meta_function('$invocation', '$escaped');" unless $escaped =~ /\v/;

my $delimiter = '__' . fast_hash($contents);
return "$meta_function('$invocation', <<'$delimiter');\n$contents\n$delimiter";
__ef0f63556d22816ed102d3bbe2172b28
meta::function('sh', 'system(@_);');
meta::function('shell', <<'__44f4c89b3f25a47a44ef85f16c960743');
use Term::ReadLine;

my $term = new Term::ReadLine "$0 shell";
$term->ornaments(0);
my $attribs = $term->Attribs;
my $name = name();
$attribs->{completion_entry_function} = $attribs->{list_completion_function};

my $prompt = sub {
  my $state = state();
  my $other = $state ne $transient{initial} ? 33 : 30;
  "\033[1;32m$name\033[1;${other}m" . substr($state, 0, 4) . "\033[0;0m "};

while ($attribs->{completion_word} = [sort keys %data, sort keys %externalized_functions], defined($_ = $term->readline(&$prompt()))) {
  my $command_line = $_;
  my @args = grep length, split /\s+|("[^"\\]*(?:\\.)?")/o;
  my $function_name = shift(@args) or next;

  terminal::warning("$function_name invalid (use 'ls' to see available commands)"), next unless $externalized_functions{$function_name};

  s/^"(.*)"$/\1/o, s/\\\\"/"/go for @args;
  print dangerous('', sub {&$function_name(@args)}), "\n"}
__44f4c89b3f25a47a44ef85f16c960743
meta::function('size', 'length(serialize());');
meta::function('snapshot', <<'__c5d8a624c3eecc183f39b33c9b72f0db');
my ($name) = @_;
file::write(my $finalname = temporary_name($name), serialize(), noclobber => 1);
chmod 0700, $finalname;
$finalname;
__c5d8a624c3eecc183f39b33c9b72f0db
meta::function('state', <<'__119111f84c3e32a5536838ac84bc6f10');
my @keys = sort keys %data;
my $hash = fast_hash(fast_hash(scalar @keys) . join '|', @keys);
$hash = fast_hash("$data{$_}|$hash") for @keys;
$hash;
__119111f84c3e32a5536838ac84bc6f10
meta::function('touch', 'associate($_, \'\') for @_;');
meta::function('unlock', 'chmod_self(sub {$_[0] | 0200});');
meta::function('update', '&{\'update-from\'}(@_, grep s/^parent:://o, sort keys %data);');
meta::function('update-from', <<'__4bb87dcea3d13203b15070a4a44389f8');
# Upgrade all attributes that aren't customized. Customization is defined when the data type is created,
# and we determine it here by checking for $transient{inherit}{$type}.

# Note that this assumes you trust the remote script. If you don't, then you shouldn't update from it.

my ($options, @targets) = separate_options(@_);

@targets or return;
my $save_state = ! ($$options{'-n'} || $$options{'--no-save'});
my $no_parents =    $$options{'-P'} || $$options{'--no-parent'} || $$options{'--no-parents'};
my $force      =    $$options{'-f'} || $$options{'--force'};

&{'save-state'}('before-update') if $save_state;

for my $target (@targets) {
  dangerous("updating from $target", sub {
    my $attributes = join '', qx($target ls -aiu);
    die "skipping unreachable $target" unless $attributes;

    rm(split /\n/, retrieve("parent::$target")) if $data{"parent::$target"};
    associate("parent::$target", $attributes) unless $no_parents;

    dangerous('', sub {eval qx($target serialize -ipmu)});
    dangerous('', sub {eval qx($target serialize -ipMu)});
    reload()})}

if (verify()) {terminal::info("Successfully updated from $_[0]. Run 'load-state before-update' to undo this change.") if $save_state}
elsif ($force) {terminal::warning('Failed to verify: at this point your object will not save properly, though backup copies will be created.',
                                  'Run "load-state before-update" to undo the update and return to a working state.') if $save_state}
else {terminal::error('Verification failed after the upgrade was complete.');
      terminal::info("$0 has been reverted to its pre-upgrade state.", "If you want to upgrade and keep the failure state, then run 'update-from $target --force'.") if $save_state;
      return &{'load-state'}('before-update') if $save_state}
__4bb87dcea3d13203b15070a4a44389f8
meta::function('usage', '"Usage: $0 action [arguments]\\nUnique actions (run \'$0 ls\' to see all actions):" . ls(\'-u\');');
meta::function('verify', <<'__123f83b5cb5c2400ae0b5c8af1c7bf20');
file::write(my $other = $transient{temporary_filename} = temporary_name(), my $serialized_data = serialize());
chomp(my $observed = join '', qx|perl '$other' state|);

unlink $other if my $result = $observed eq (my $state = state());
terminal::error("Verification failed; expected $state but got $observed from $other") unless $result;
$result;
__123f83b5cb5c2400ae0b5c8af1c7bf20
meta::internal_function('associate', <<'__fc4f785bcf3ffe3225a73a1fdd314703');
my ($name, $value, %options) = @_;
die "Namespace does not exist" unless exists $datatypes{namespace($name)};
$data{$name} = $value;
execute($name) if $options{'execute'};
$value;
__fc4f785bcf3ffe3225a73a1fdd314703
meta::internal_function('attribute', <<'__62efb9f22157835940af1d5feae98d98');
my ($name) = @_;
$name =~ s/^[^:]*:://;
$name;
__62efb9f22157835940af1d5feae98d98
meta::internal_function('chmod_self', <<'__b13487447c65f2dc790bd6b21dde89dd');
my ($mode_function)      = @_;
my (undef, undef, $mode) = stat $0;
chmod &$mode_function($mode), $0;
__b13487447c65f2dc790bd6b21dde89dd
meta::internal_function('complete', <<'__f14ae2337c0653b6bb6fd02bb6493646');
my @functions  = sort keys %externalized_functions;
my @attributes = sort keys %data;

sub match {
  my ($text, @options) = @_;
  my @matches = sort grep /^$text/, @options;

  if    (@matches == 0) {return undef;}
  elsif (@matches == 1) {return $matches [0];}
  elsif (@matches >  1) {return ((longest ($matches [0], $matches [@matches - 1])), @matches);}
}

sub longest {
  my ($s1, $s2) = @_; 
  return substr ($s1, 0, length $1) if ($s1 ^ $s2) =~ /^(\0*)/;
  return ''; 
}

# This is another way to implement autocompletion.
#
# my $attribs = $term->Attribs;
# $attribs->{completion_entry_function} = $attribs->{list_completion_function};
# $attribs->{completion_word} = [sort keys %data, sort keys %externalized_functions];

my ($text, $line) = @_;
if ($line =~ / /) {
  # Start matching attribute names.
  match ($text, @attributes);
} else {
  # Start of line, so it's a function.
  match ($text, @functions);
}
__f14ae2337c0653b6bb6fd02bb6493646
meta::internal_function('dangerous', <<'__167c759b4f9e54a667222dd3d405200d');
# Wraps a computation that may produce an error.
my ($message, $computation) = @_;
terminal::info($message) if $message;
my $result = eval {&$computation()};
terminal::warning(translate_backtrace($@)), return undef if $@;
$result;
__167c759b4f9e54a667222dd3d405200d
meta::internal_function('debug_trace', <<'__77644ab45a770a6e172680f659911507');
terminal::debug(join ', ', @_);
wantarray ? @_ : $_[0];
__77644ab45a770a6e172680f659911507
meta::internal_function('execute', <<'__4b4efc33bc6767a7aade7f427eedf83f');
my ($name, %options) = @_;
my $namespace = namespace($name);
eval {&{"meta::$namespace"}(attribute($name), retrieve($name))};
warn $@ if $@ && $options{'carp'};
__4b4efc33bc6767a7aade7f427eedf83f
meta::internal_function('exported', <<'__27414e8f2ceeaef3555b9726e690eb0f');
# Allocates a temporary file containing the concatenation of attributes you specify,
# and returns the filename. The filename will be safe for deletion anytime.
my $filename = temporary_name();
file::write($filename, cat(@_));
$filename;
__27414e8f2ceeaef3555b9726e690eb0f
meta::internal_function('extension_for', <<'__65e48f50f20bc04aa561720b03bf494c');
my $extension = $transient{extension}{namespace($_[0])};
$extension = &$extension($_[0]) if ref $extension eq 'CODE';
$extension || '';
__65e48f50f20bc04aa561720b03bf494c
meta::internal_function('fast_hash', <<'__ac70f469e697725cfb87629833434ab1');
my ($data)     = @_;
my $piece_size = length($data) >> 3;

my @pieces     = (substr($data, $piece_size * 8) . length($data), map(substr($data, $piece_size * $_, $piece_size), 0 .. 7));
my @hashes     = (fnv_hash($pieces[0]));

push @hashes, fnv_hash($pieces[$_ + 1] . $hashes[$_]) for 0 .. 7;

$hashes[$_] ^= $hashes[$_ + 4] >> 16 | ($hashes[$_ + 4] & 0xffff) << 16 for 0 .. 3;
$hashes[0]  ^= $hashes[8];

sprintf '%08x' x 4, @hashes[0 .. 3];
__ac70f469e697725cfb87629833434ab1
meta::internal_function('file::read', <<'__186bbcef8f6f0dd8b72ba0fdeb1de040');
my $name = shift;
open my($handle), "<", $name;
my $result = join "", <$handle>;
close $handle;
$result;
__186bbcef8f6f0dd8b72ba0fdeb1de040
meta::internal_function('file::write', <<'__eb7b1efebe0db73378b0cce46681788d');
use File::Path     'mkpath';
use File::Basename 'dirname';

my ($name, $contents, %options) = @_;
die "Choosing not to overwrite file $name" if $options{noclobber} and -f $name;
mkpath(dirname($name)) if $options{mkpath};

open my($handle), $options{append} ? '>>' : '>', $name or die "Can't open $name for writing";
print $handle $contents;
close $handle;
__eb7b1efebe0db73378b0cce46681788d
meta::internal_function('fnv_hash', <<'__8d001a3a7988631bab21a41cee559758');
# A rough approximation to the Fowler-No Voll hash. It's been 32-bit vectorized
# for efficiency, which may compromise its effectiveness for short strings.

my ($data) = @_;

my ($fnv_prime, $fnv_offset) = (16777619, 2166136261);
my $hash                     = $fnv_offset;
my $modulus                  = 2 ** 32;

$hash = ($hash ^ ($_ & 0xffff) ^ ($_ >> 16)) * $fnv_prime % $modulus for unpack 'L*', $data . substr($data, -4) x 8;
$hash;
__8d001a3a7988631bab21a41cee559758
meta::internal_function('hypothetically', <<'__33ee2e1595d3877bd1d9accaa72305c8');
# Applies a temporary state and returns a serialized representation.
# The original state is restored after this, regardless of whether the
# temporary state was successful.

my %data_backup   = %data;
my ($side_effect) = @_;
my $return_value  = eval {&$side_effect()};
%data = %data_backup;

die $@ if $@;
$return_value;
__33ee2e1595d3877bd1d9accaa72305c8
meta::internal_function('internal::main', <<'__b7379923a1c7d2481bad4247b8a71974');
disable();

$SIG{'INT'} = sub {snapshot(); exit 1};

$transient{initial}      = state();
chomp(my $default_action = retrieve('data::default-action'));

my $function_name = shift(@ARGV) || $default_action || 'usage';
terminal::warning("unknown action: '$function_name'") and $function_name = 'usage' unless $externalized_functions{$function_name};

chomp(my $result = &$function_name(@ARGV));
print "$result\n" if $result;

save() unless state() eq $transient{initial};

END {
  enable();
}
__b7379923a1c7d2481bad4247b8a71974
meta::internal_function('invoke_editor_on', <<'__32c8b1e3c90bd40d504703e22b26e1f5');
my ($data, %options) = @_;
my $editor   = $options{editor} || $ENV{VISUAL} || $ENV{EDITOR} || die 'Either the $VISUAL or $EDITOR environment variable should be set to a valid editor';
my $options  = $options{options} || $ENV{VISUAL_OPTS} || $ENV{EDITOR_OPTS} || '';
my $filename = temporary_name() . "-$options{attribute}$options{extension}";

file::write($filename, $data);
system("$editor $options '$filename'");

my $result = file::read($filename);
unlink $filename;
$result;
__32c8b1e3c90bd40d504703e22b26e1f5
meta::internal_function('namespace', <<'__93213d60cafb9627e0736b48cd1f0760');
my ($name) = @_;
$name =~ s/::.*$//;
$name;
__93213d60cafb9627e0736b48cd1f0760
meta::internal_function('retrieve', <<'__0b6f4342009684fdfa259f45ac75ae37');
my @results = map defined $data{$_} ? $data{$_} : retrieve_with_hooks($_), @_;
wantarray ? @results : $results[0];
__0b6f4342009684fdfa259f45ac75ae37
meta::internal_function('retrieve_with_hooks', <<'__5186a0343624789d08d1cc2084550f3d');
# Uses the hooks defined in $transient{retrievers}, and returns undef if none work.
my ($attribute) = @_;
my $result      = undef;

defined($result = &$_($attribute)) and return $result for map $transient{retrievers}{$_}, sort keys %{$transient{retrievers}};
return undef;
__5186a0343624789d08d1cc2084550f3d
meta::internal_function('select_keys', <<'__8ee1d5fa37927c66d9eec4d0d8269493');
my %options   = @_;
my %inherited = map {$_ => 1} split /\n/o, join "\n", retrieve(grep /^parent::/o, sort keys %data) if $options{'-u'} or $options{'-U'};
my $criteria  = $options{'--criteria'} || $options{'--namespace'} && "^$options{'--namespace'}::" || '.';

grep /$criteria/ && (! $options{'-u'} || ! $inherited{$_}) && (! $options{'-U'} || $inherited{$_}) &&
                    (! $options{'-I'} || ! $transient{inherit}{namespace($_)}) && (! $options{'-i'} || $transient{inherit}{namespace($_)}) &&
                    (! $options{'-S'} || ! /^state::/o) && (! $options{'-M'} || ! /^meta::/o) && (! $options{'-m'} || /^meta::/o), sort keys %data;
__8ee1d5fa37927c66d9eec4d0d8269493
meta::internal_function('separate_options', <<'__d47e8ee23fe55e27bb523c9fcb2f5ca1');
# Things with one dash are short-form options, two dashes are long-form.
# Characters after short-form are combined; so -auv4 becomes -a -u -v -4.
# Also finds equivalences; so --foo=bar separates into $$options{'--foo'} eq 'bar'.
# Stops processing at the -- option, and removes it. Everything after that
# is considered to be an 'other' argument.

# The only form not supported by this function is the short-form with argument.
# To pass keyed arguments, you need to use long-form options.

my @parseable;
push @parseable, shift @_ until ! @_ or $_[0] eq '--';

my @singles = grep /^-[^-]/, @parseable;
my @longs   = grep /^--/,    @parseable;
my @others  = grep ! /^-/,   @parseable;

my @singles = map /-(.{2,})/ ? map("-$_", split(//, $1)) : $_, @singles;

my %options;
  $options{$1} = $2 for grep /^([^=]+)=(.*)$/, @longs;
++$options{$_}      for grep ! /=/, @singles, @longs;

({%options}, @others, @_);
__d47e8ee23fe55e27bb523c9fcb2f5ca1
meta::internal_function('strip', 'wantarray ? map {s/^\\s*|\\s*$//g; $_} @_ : $_[0] =~ /^\\s*(.*?)\\s*$/ && $1;');
meta::internal_function('table_display', <<'__8a6897e093f36bf05477a3889b84a61d');
# Displays an array of arrays as a table; that is, with alignment. Arrays are
# expected to be in column-major order.

sub maximum_length_in {
  my $maximum = 0;
  length > $maximum and $maximum = length for @_;
  $maximum;
}

my @arrays    = @_;
my @lengths   = map maximum_length_in(@$_), @arrays;
my @row_major = map {my $i = $_; [map $$_[$i], @arrays]} 0 .. $#{$arrays[0]};
my $format    = join '  ', map "%-${_}s", @lengths;

join "\n", map strip(sprintf($format, @$_)), @row_major;
__8a6897e093f36bf05477a3889b84a61d
meta::internal_function('temporary_name', <<'__0fb1402061581b69822f913631b4a9d9');
use File::Temp 'tempfile';
my (undef, $temporary_filename) = tempfile("$0." . 'X' x 4, OPEN => 0);
$temporary_filename;
__0fb1402061581b69822f913631b4a9d9
meta::internal_function('translate_backtrace', <<'__06fad3d85833a6484e426401b95e0206');
my ($trace) = @_;
$trace =~ s/\(eval (\d+)\)/$locations{$1 - 1}/g;
$trace;
__06fad3d85833a6484e426401b95e0206
meta::internal_function('with_exported', <<'__fc4f32c46d95c6deed0414364d1c7410');
# Like exported(), but removes the file after running some function.
# Usage is with_exported(@files, sub {...});
my $f      = pop @_;
my $name   = exported(@_);
my $result = eval {&$f($name)};
terminal::warning("$@ when running with_exported()") if $@;
unlink $name;
$result;
__fc4f32c46d95c6deed0414364d1c7410
meta::library('terminal', <<'__0ec2ca45ce7b9b56c05c9b284a7ee78a');
# Functions for nice-looking terminal output.
package terminal;

my $process = ::name();

sub message {print STDERR "[$_[0]] $_[1]\n"}
sub color {
  my ($name, $color) = @_;
  *{"terminal::$name"} = sub {chomp $_, print STDERR "\033[1;30m$process(\033[1;${color}m$name\033[1;30m)\033[0;0m $_\n" for @_}}

my %preloaded = (info => 32, progress => 32, state => 34, debug => 34, warning => 33, error => 31);
color $_, $preloaded{$_} for keys %preloaded;
__0ec2ca45ce7b9b56c05c9b284a7ee78a
meta::message_color('state', 'purple');
meta::message_color('states', 'yellow');
meta::message_color('watch', 'blue');
meta::note('queue', <<'__9cb73b7d563276a8ee898d35a37b6095');
Bug list.
Caterwaul does the right thing 99% of the time. This section is for the 1% when something goes wrong.

  Auto-parens for syntax nodes [won't fix].
  It's possible to write this:

  | qs[x + y].replace({x: qs[z, t], y: qs[f, g]})

  And end up with an expression whose semantics aren't reflected by the syntax tree (due to operator precedence). This is unfortunate. However, it can also be useful. Anytime there's ambiguity
  about this sort of thing you should wrap the expression in parens (which is sometimes required even when no particular ambiguity exists, e.g. at statement-level with function expressions in
  Firefox).

  Fix matching against flattened nodes [fixed in 0.5].
  This is a reasonable bug. Nodes should be able to "un-flatten" back down into nested form, following their natural associativity. This should be done within macros to make sure that further
  macro patterns don't spuriously reject them.

  V8-based runtimes sometimes fail jQuery test [fixed in 0.5].
  This is probably a V8 bug of some sort, though I'll have to isolate a suitable test case to submit it. Fortunately it only seems to have an effect when transforming jQuery (and it produces
  the same output), so maybe there is some nondeterminism that I need to address.

  Update: I think this was a product of using eval()-based functions. It's still a V8 bug, but at least there's a workaround.

  Remove uses of eval() inside Caterwaul [fixed in 0.5].
  This is actually important for a couple of reasons. First, it's slow to use eval. Better is to avoid it by writing functions out longhand (much as I don't particularly like doing so).
  Second, it may be causing V8 some trouble. I'm not sure; will have to test this.

  Stops matching after an expansion rejection [fixed in 0.5.1].
  If you have two macros whose patterns are identical, only the second will ever be used. This wouldn't be such a problem, except that the first won't be used even if the second declares a
  macroexpansion failure by returning false.

  Fails in IE7 [will fix in 0.5.4].
  Something about constructors and how the sequence library implements inheritance from arrays. I'm not married to the idea of implementing proper inheritance here; it comes with enough
  problems.

Ideas.
Unimportant things that might help at some point in the future.

  Hashed syntax nodes.
  This is useful for accelerating macroexpansion. I'm not sure whether it's relevant yet, but if done correctly it would give syntax nodes faster rejection (which is the most common case when
  macroexpanding). The challenge is incorporating wildcards.
__9cb73b7d563276a8ee898d35a37b6095
meta::parent('/home/spencertipping/bin/notes', <<'__320d51928ec8e2e370d67d30abe059b5');
function::note
meta::type::note
parent::object
__320d51928ec8e2e370d67d30abe059b5
meta::parent('object', <<'__59e6a6d404efe9edcd702da0f4895df2');
bootstrap::initialization
bootstrap::perldoc
function::cat
function::cc
function::child
function::clone
function::cp
function::create
function::current-state
function::disable
function::edit
function::enable
function::export
function::extern
function::grep
function::hash
function::import
function::initial-state
function::load-state
function::lock
function::ls
function::ls-a
function::mv
function::name
function::parents
function::perl
function::reload
function::rm
function::save
function::save-state
function::serialize
function::serialize_single
function::sh
function::shell
function::size
function::snapshot
function::state
function::touch
function::unlock
function::update
function::update-from
function::usage
function::verify
internal_function::associate
internal_function::attribute
internal_function::chmod_self
internal_function::dangerous
internal_function::debug_trace
internal_function::execute
internal_function::exported
internal_function::extension_for
internal_function::fast_hash
internal_function::file::read
internal_function::file::write
internal_function::fnv_hash
internal_function::hypothetically
internal_function::internal::main
internal_function::invoke_editor_on
internal_function::namespace
internal_function::retrieve
internal_function::retrieve_with_hooks
internal_function::select_keys
internal_function::separate_options
internal_function::strip
internal_function::table_display
internal_function::temporary_name
internal_function::translate_backtrace
internal_function::with_exported
library::terminal
message_color::state
message_color::states
meta::configure
meta::externalize
meta::functor::editable
meta::type::bootstrap
meta::type::data
meta::type::function
meta::type::inc
meta::type::internal_function
meta::type::library
meta::type::message_color
meta::type::meta
meta::type::parent
meta::type::retriever
meta::type::state
retriever::file
retriever::id
__59e6a6d404efe9edcd702da0f4895df2
meta::retriever('file', '-f $_[0] ? file::read($_[0]) : undef;');
meta::retriever('id', '$_[0] =~ /^id::/ ? substr($_[0], 4) : undef;');
internal::main();

__END__