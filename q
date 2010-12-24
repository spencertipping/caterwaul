#!/usr/bin/perl

=head1 Self-modifying Perl script

=head2 Original implementation by Spencer Tipping L<http://spencertipping.com>

The prototype for this script is licensed under the terms of the MIT source code license.
However, this script in particular may be under different licensing terms. To find out how
this script is licensed, please contact whoever sent it to you. Alternatively, you may
run it with the 'license' argument if they have specified a license that way.

You should not edit this file directly. For information about how it was constructed, go
to L<http://spencertipping.com/#section=self-modifying-perl>. For quick usage guidelines, run
this script with the 'usage' argument.
=cut

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
    my ($name, $value) = @_;
    chomp $value;
    $data{"${namespace}::$name"} = $value;
    $delegate->($name, $value);
  };
}

sub meta::eval_in {
  my ($what, $where) = @_;

  # Obtain next eval-number and alias it to the designated location
  @locations{eval('__FILE__') =~ /\(eval (\d+)\)/} = ($where);

  my $result = eval $what;
  $@ =~ s/\(eval \d+\)/$where/ if $@;
  warn $@ if $@;
  $result;
}

meta::define_form 'meta', sub {
  my ($name, $value) = @_;
  meta::eval_in($value, "meta::$name");
};

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

meta::meta('functor::editable', <<'__bbfdc65c8d51695de1cd6050232555bd');
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

      return &{$options{default}}(retrieve($attribute))                                    if ref $options{default} eq 'CODE'                                          and not defined $command;
      return edit($attribute)                                                              if $command eq 'edit'                      or $options{default} eq 'edit'   and not defined $command;
      return associate($attribute, @new_value ? join(' ', @new_value) : join('', <STDIN>)) if $command eq '=' or $command eq 'import' or $options{default} eq 'import' and not defined $command;
      return retrieve($attribute);
    };
  };
}
__bbfdc65c8d51695de1cd6050232555bd

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
meta::bootstrap('initialization', <<'__baa43e5e8e6e1cd76d4e2de828ceaa4d');
#!/usr/bin/perl

=head1 Self-modifying Perl script

=head2 Original implementation by Spencer Tipping L<http://spencertipping.com>

The prototype for this script is licensed under the terms of the MIT source code license.
However, this script in particular may be under different licensing terms. To find out how
this script is licensed, please contact whoever sent it to you. Alternatively, you may
run it with the 'license' argument if they have specified a license that way.

You should not edit this file directly. For information about how it was constructed, go
to L<http://spencertipping.com/#section=self-modifying-perl>. For quick usage guidelines, run
this script with the 'usage' argument.
=cut

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
    my ($name, $value) = @_;
    chomp $value;
    $data{"${namespace}::$name"} = $value;
    $delegate->($name, $value);
  };
}

sub meta::eval_in {
  my ($what, $where) = @_;

  # Obtain next eval-number and alias it to the designated location
  @locations{eval('__FILE__') =~ /\(eval (\d+)\)/} = ($where);

  my $result = eval $what;
  $@ =~ s/\(eval \d+\)/$where/ if $@;
  warn $@ if $@;
  $result;
}

meta::define_form 'meta', sub {
  my ($name, $value) = @_;
  meta::eval_in($value, "meta::$name");
};

__baa43e5e8e6e1cd76d4e2de828ceaa4d

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
meta::function('child', <<'__3eeb4b4fd37a502b53f0008e7835b5de');
my ($child_name) = @_;

# Make the child inherit from this object. The easiest way to do that is to
# grab $0, which is presumably executable, and have the child update from it.
hypothetically(sub {
  associate('data::name', $child_name);
  clone($child_name);
});

enable();
qx($child_name update-from $0 -nu);
disable();
__3eeb4b4fd37a502b53f0008e7835b5de

meta::function('clone', <<'__5a30a4ba6293e250ed22884d609e4781');
for (grep length, @_) {
  file::write($_, serialize(), noclobber => 1);
  chmod(0700, $_);
}
__5a30a4ba6293e250ed22884d609e4781

meta::function('cp', <<'__d33fe9aa270eeee6dcc3ee445447a6a7');
my ($from, $to) = @_;
my $exists = exists $data{$from};
associate($to, retrieve($from)) if $exists;
die "No such attribute $from" unless $exists;
retrieve($from);
__d33fe9aa270eeee6dcc3ee445447a6a7

meta::function('create', <<'__97e5444422f5f6087371f59ddc3e1b8c');
my ($name, $value) = @_;

return edit($name) if exists $data{$name};

if (defined $value) {
  associate($name, $value);
} else {
  associate($name, '');
  edit($name);
}
__97e5444422f5f6087371f59ddc3e1b8c

meta::function('current-state', <<'__d83ae43551c0f58d1d0ce576402a315a');
my @valid_keys   = grep ! /^state::/, sort keys %data;
my @ordered_keys = (grep(/^meta::/, @valid_keys), grep(! /^meta::/, @valid_keys));
join "\n", map serialize_single($_), @ordered_keys;
__d83ae43551c0f58d1d0ce576402a315a

meta::function('disable', 'chmod_self(sub {$_[0] & 0666});');
meta::function('edit', <<'__6912fb43aad413e79cbf45e134866b6e');
my ($name, %options) = @_;
my $extension = $transient{extension}{namespace($name)} || '';

die "Attribute $name does not exist." unless exists $data{$name};
associate($name, invoke_editor_on($data{$name} || "# Attribute $name", %options, attribute => $name, extension => $extension),
          execute => $name !~ /^internal::/ && $name !~ /^bootstrap::/);
save();
__6912fb43aad413e79cbf45e134866b6e

meta::function('enable', 'chmod_self(sub {$_[0] | $_[0] >> 2});');
meta::function('export', <<'__6c445eea603f9863df0f8db445fd708e');
# Exports data into a text file.
#   export attr1 attr2 attr3 ... file.txt

my $name = pop @_;
my @attributes = @_;

if (@attributes) {
  my $file = join "\n", map cat($_), @attributes;
  file::write($name, $file);
} else {
  die 'Not enough arguments';
}
__6c445eea603f9863df0f8db445fd708e

meta::function('extern', '&{$_[0]}(retrieve(@_[1 .. $#_]));');
meta::function('grep', <<'__ccbc55153c3f45db829686632273b93b');
# Looks through attributes for a pattern. Usage is grep pattern [options], where
# [options] is the format as provided to select_keys.

my $pattern              = shift @_ or die 'Must specify a pattern to search for';
my ($options, @criteria) = separate_options(@_);
my @attributes           = select_keys(%$options, '--criteria' => join('|', @criteria));
my $color                = $$options{'-c'};

my @matching_attributes;
my @matching_line_numbers;
my @matching_lines;

for my $k (@attributes) {
  my @lines = split /\n/, retrieve($k);
  for (0 .. $#lines) {
    next unless $lines[$_] =~ /$pattern/;

    $lines[$_] =~ s/($pattern)/\033[1;31m\1\033[0;0m/g if $color;

    push @matching_attributes,   $k;
    push @matching_line_numbers, $_ + 1;
    push @matching_lines,        $lines[$_];
  }
}

if ($color) {
  s/^/\033[1;34m/o                    for @matching_attributes;
  s/^/\033[1;32m/o && s/$/\033[0;0m/o for @matching_line_numbers;
}

table_display([@matching_attributes], [@matching_line_numbers], [@matching_lines]);
__ccbc55153c3f45db829686632273b93b

meta::function('hash', <<'__7c4145cf6e97dfb9ab04a613866751d3');
my ($data) = @_;
fast_hash($data);
__7c4145cf6e97dfb9ab04a613866751d3

meta::function('import', <<'__84d29edfe7ad2119465fdcf7d037ed1c');
my $name  = pop @_;
my @files = @_;

if (@files) {
  my $files = join "", map {file::read ($_)} @files;
  associate ($name, $files); 
}
else {
  associate($name, join('', <STDIN>));
}
__84d29edfe7ad2119465fdcf7d037ed1c

meta::function('import-bundle', <<'__4c7139ed5c9f65f38a33cf8f8a6cae27');
eval join '', <STDIN>;
die $@ if $@;
__4c7139ed5c9f65f38a33cf8f8a6cae27

meta::function('load-state', <<'__878f141333993ead4d272027ad301eee');
my ($state_name) = @_;
my $state = retrieve("state::$state_name");

terminal::message('state', 'Saving current state into _...');
&{'save-state'}('_');

terminal::message('state', 'Removing attributes from %data and unexternalizing functions...');
delete $data{$_} for grep ! /^state::/ && ! /^internal::runtime$/, keys %data;
%externalized_functions = ();

terminal::message('state', "Restoring state $state_name...");
eval($state);
terminal::message('error', $@) if $@;
reload();
verify();
__878f141333993ead4d272027ad301eee

meta::function('lock', 'chmod_self(sub {$_[0] & 0555});');
meta::function('ls', <<'__ffe7609f16d647b7eb9ed9693dd12c23');
my ($options, @criteria) = separate_options(@_);

my ($all, $shadows, $dereference, $sizes, $flags) = @$options{qw(-a -s -d -z -l)};
$all   ||= $dereference;
$sizes ||= $flags;

return table_display([grep ! defined $data{$externalized_functions{$_}}, sort keys %externalized_functions]) if $shadows;

my $criteria    = join('|', @criteria);
my @definitions = select_keys('--criteria' => $criteria, %$options);

my %inverses  = map {$externalized_functions{$_} => $_} keys %externalized_functions;
my @externals = map $inverses{$_}, @definitions;
my @sizes     = map sprintf('%6d %6d', length(serialize_single($_)), length(retrieve($_))), @definitions if $sizes;

my %flag_hashes = map {$_ => {map {$_ => 1} select_keys("-$_" => 1)}} qw(m u i) if $flags;
my @flags       = map {my $k = $_; join '', map($flag_hashes{$_}{$k} ? $_ : '-', sort keys %flag_hashes)} @definitions if $flags;

join "\n", map strip($_), split /\n/, table_display($all ? [@definitions] : [grep length, @externals], $dereference ? ([@externals]) : (),
                                                    $sizes ? ([@sizes]) : (), $flags ? ([@flags]) : ());
__ffe7609f16d647b7eb9ed9693dd12c23

meta::function('ls-a', 'ls(\'-ad\', @_);');
meta::function('mv', <<'__09f350db8406303ade06d229477d79ad');
my ($from, $to) = @_;
my $destination_namespace = namespace($to);

die "'$from' does not exist" unless exists $data{$from};
die "The namepsace '$destination_namespace' does not exist" unless $datatypes{$destination_namespace};

associate($to, retrieve($from));
rm($from);
__09f350db8406303ade06d229477d79ad

meta::function('note', <<'__bcbfeac6dd2112f47296265444570a6e');
# Creates a note with a given name, useful for jotting things down.
create("note::$_[0]");
__bcbfeac6dd2112f47296265444570a6e

meta::function('parents', 'join "\\n", grep s/^parent:://o, sort keys %data;');
meta::function('perl', <<'__f2b57dd342923797e8e2287c3095803f');
my $result = eval(join ' ', @_);
$@ ? terminal::message('error', $@) : $result;
__f2b57dd342923797e8e2287c3095803f

meta::function('reload', 'execute($_) for grep ! (/^internal::/ || /^bootstrap::/), keys %data;');
meta::function('rm', <<'__963fdd3d9f6a0ba279b001b1f5679a38');
for my $to_be_deleted (@_) {
  terminal::message('warning', "$to_be_deleted does not exist") unless exists $data{$to_be_deleted};
}

delete @data{@_};
__963fdd3d9f6a0ba279b001b1f5679a38

meta::function('save', <<'__ca9ab587c78ff2024ef9ad8ca634db5b');
if (! verify()) {
  die "$0 has not been updated";
} else {
  my $serialized_data = serialize();
  eval {file::write($0, $serialized_data)};
  die $@ if $@;
  terminal::message('info', "$0 saved successfully.");
}
__ca9ab587c78ff2024ef9ad8ca634db5b

meta::function('save-state', <<'__5c5b586331e25951140ced6442d9fe2b');
# Creates a named copy of the current state and stores it.
my ($state_name) = @_;
associate("state::$state_name", &{'current-state'}(), execute => 1);
__5c5b586331e25951140ced6442d9fe2b

meta::function('serialize', <<'__023436ac07471e2f2cf016e2172c8d73');
my ($options, @criteria) = separate_options(@_);
my $partial              = $$options{'-p'};
my $criteria             = join '|', @criteria;
my @attributes           = map serialize_single($_), select_keys(%$options, '-m' => 1, '--criteria' => $criteria), select_keys(%$options, '-M' => 1, '--criteria' => $criteria);
my @final_array          = @{$partial ? \@attributes : [retrieve('bootstrap::initialization'), @attributes, 'internal::main();', '', '__END__']};

join "\n", @final_array;
__023436ac07471e2f2cf016e2172c8d73

meta::function('serialize_single', <<'__48005281edde632b0df2e346c094b7bd');
# Serializes a single attribute and optimizes for content.

my $name               = $_[0] || $_;
my $contents           = $data{$name};
my $meta_function_name = 'meta::' . namespace($name);
my $invocation_name    = attribute($name);
my $escaped            = $contents;
$escaped =~ s/\\/\\\\/go;
$escaped =~ s/'/\\'/go;

return "$meta_function_name('$invocation_name', '$escaped');" unless $escaped =~ /\v/;

my $delimiter = '__' . fast_hash($contents);
return "$meta_function_name('$invocation_name', <<'$delimiter');\n$contents\n$delimiter\n";
__48005281edde632b0df2e346c094b7bd

meta::function('shell', <<'__e9e0709e6ee1dd09521c683322be79e6');
use Term::ReadLine;

my $term = new Term::ReadLine "$0 shell";
$term->ornaments(0);
my $prompt = undef;
my $set_prompt = sub {
  $prompt = "\033[1;32m" . name() . "\033[0;0m ";
};
  
my $output = $term->OUT || \*STDOUT;

$term->Attribs->{attempted_completion_function} = \&complete;

&$set_prompt();
while (defined ($_ = $term->readline($prompt))) {
  my $command_line = $_;
  my @args = grep length, split /\s+|("[^"\\]*(?:\\.)?")/o;
  my $function_name = shift @args;

  return if $function_name eq 'exit';

  s/^"(.*)"$/\1/o, s/\\\\"/"/go for @args;

  if ($function_name) {
    if ($externalized_functions{$function_name}) {
      chomp(my $result = eval {&$function_name(@args)});
      terminal::message('error', translate_backtrace($@)) if $@;
      print $output $result, "\n" unless $@;
    } else {
      terminal::message('warning', "Command not found: '$function_name' (use 'ls' to see available commands)");
    }
  }

  if (watching()) {
    for (grep /^watch::/, sort keys %data) {
      my $watch = retrieve($_);
      terminal::message('watch', "$_ => " . meta::eval_in($watch, $_));
    }
  }

  &$set_prompt();
}
__e9e0709e6ee1dd09521c683322be79e6

meta::function('size', 'length(serialize());');
meta::function('snapshot', <<'__787158a5844d36cbfd29e5b74c9167e1');
my ($name) = @_;
file::write(my $finalname = temporary_name($name), serialize(), noclobber => 1);
chmod 0700, $finalname;

terminal::message('state', "Created snapshot at $finalname.");
__787158a5844d36cbfd29e5b74c9167e1

meta::function('state', <<'__e17520e3a5d81d788ae995fd8ac47cb9');
my @keys = sort keys %data;
my $hash = fast_hash(scalar @keys);
$hash = fast_hash($hash . join '|', @keys);
$hash = fast_hash("$data{$_}|$hash") for @keys;
$hash;
__e17520e3a5d81d788ae995fd8ac47cb9

meta::function('unlock', 'chmod_self(sub {$_[0] | 0200});');
meta::function('update', '&{\'update-from\'}(@_, grep s/^parent:://o, sort keys %data);');
meta::function('update-from', <<'__f927cc6b2e1c93ce2e969845e01ba839');
# Upgrade all attributes that aren't customized. Customization is defined when the data type is created,
# and we determine it here by checking for $transients{inherit}{$type}.
#
# Note that this assumes you trust the remote script. If you don't, then you shouldn't update from it.

my ($options, @targets) = separate_options(@_);

my %options = %$options;
@targets or die 'Must specify at least one target to update from';

my $save_state = ! ($options{'-n'} || $options{'--no-save'});
my $no_parents =    $options{'-P'} || $options{'--no-parent'} || $options{'--no-parents'};
my $force      =    $options{'-f'} || $options{'--force'};
my $unique     =    $options{'-u'} || $options{'--unique'};

my $unique_option = $unique ? '-u' : '';

&{'save-state'}('before-update') if $save_state;
terminal::message('warning', 'Not saving state, as requested; to save it, omit the -n option.') unless $save_state;

for my $target (@targets) {
  terminal::message('info', "Updating from $target");

  my $attributes = join '', qx($target ls -aiu);
  terminal::message('warning', "Skipping unreachable object $target") unless $attributes;

  if ($attributes) {
    rm(split /\n/, retrieve("parent::$target")) if $data{"parent::$target"};
    associate("parent::$target", $attributes) unless $no_parents;

    terminal::message('info', 'Updating meta attributes...');
    eval qx($target serialize -ipm $unique_option);
    terminal::message('warning', $@) if $@;

    terminal::message('info', 'Updating non-meta attributes...');
    eval qx($target serialize -ipM $unique_option);
    terminal::message('warning', $@) if $@;
    reload();

    if (verify()) {
      terminal::message('info', "Successfully updated from $_[0]. Run 'load-state before-update' to undo this change.") if $save_state;
    } elsif ($force) {
      terminal::message('warning', 'The object failed verification, but the failure state has been kept because --force was specified.');
      terminal::message('warning', 'At this point your object will not save properly, though backup copies will be created.');
      terminal::message('info',    'Run "load-state before-update" to undo the update and return to a working state.') if $save_state;
    } else {
      terminal::message('error',   'Verification failed after the upgrade was complete.');
      terminal::message('info',    "$0 has been reverted to its pre-upgrade state.") if $save_state;
      terminal::message('info',    "If you want to upgrade and keep the failure state, then run 'update-from $target --force'.") if $save_state;
      return &{'load-state'}('before-update') if $save_state;
    }
  }
}
__f927cc6b2e1c93ce2e969845e01ba839

meta::function('usage', <<'__0d4df7beb12cee031e689cb7db19e5aa');
<<"EOD" . ls('-u');
Usage: $0 action [arguments]
Defined actions (unique to this script; run '$0 ls' to see all actions):
EOD
__0d4df7beb12cee031e689cb7db19e5aa

meta::function('verify', <<'__e8ff828f42cdc7d759b70bb81721ddb6');
my $serialized_data = serialize();
my $state           = state();

my $temporary_filename = temporary_name();
$transient{temporary_filename} = $temporary_filename;
file::write($temporary_filename, $serialized_data);
chmod 0700, $temporary_filename;

chomp(my $observed_state = join '', qx|perl '$temporary_filename' state|);

my $result = $observed_state eq $state;
unlink $temporary_filename if $result;
terminal::message('error', "Verification failed; '$observed_state' (produced by $temporary_filename) != '$state' (expected)") unless $result;

$result;
__e8ff828f42cdc7d759b70bb81721ddb6

meta::internal_function('associate', <<'__80f0728190bf3b0d4c94807cfdc12a22');
my ($name, $value, %options) = @_;
my $namespace = namespace($name);
die "Namespace $namespace does not exist" unless $datatypes{$namespace};
$data{$name} = $value;
execute($name) if $options{'execute'};
__80f0728190bf3b0d4c94807cfdc12a22

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

meta::internal_function('debug_trace', <<'__f887289259890731458a66398b628cdc');
quiet() or terminal::message('debug', join ', ', @_);
wantarray ? @_ : $_[0];
__f887289259890731458a66398b628cdc

meta::internal_function('execute', <<'__4b4efc33bc6767a7aade7f427eedf83f');
my ($name, %options) = @_;
my $namespace = namespace($name);
eval {&{"meta::$namespace"}(attribute($name), retrieve($name))};
warn $@ if $@ && $options{'carp'};
__4b4efc33bc6767a7aade7f427eedf83f

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

meta::internal_function('internal::main', <<'__acb38ec5971c89f794f486f1c30900e6');
disable();

$SIG{'INT'} = sub {
  snapshot();
  exit 1;
};

my $initial_state        = state();
chomp(my $default_action = retrieve('data::default-action'));

my $function_name = shift(@ARGV) || $default_action || 'usage';
terminal::message('warning', "Unknown action: '$function_name'") and $function_name = 'usage' unless $externalized_functions{$function_name};

chomp(my $result = &$function_name(@ARGV));
print "$result\n" if $result;

save() unless $initial_state eq state();

END {
  enable();
}
__acb38ec5971c89f794f486f1c30900e6

meta::internal_function('invoke_editor_on', <<'__7c798760d79429e5b52d9fa934e889d8');
my ($data, %options) = @_;
my $editor           = $options{editor} || $ENV{VISUAL} || $ENV{EDITOR} ||
                       die 'Either the $VISUAL or $EDITOR environment variable should be set to a valid editor';
my $options          = $options{options} || $ENV{VISUAL_OPTS} || $ENV{EDITOR_OPTS} || '';
my $extension        = $options{extension} || '';
my $attribute        = $options{attribute} || '';

my $filename         = temporary_name() . "-$attribute" . $extension;

file::write($filename, $data);
system("$editor $options '$filename'");

my $result = file::read($filename);
unlink $filename;
$result;
__7c798760d79429e5b52d9fa934e889d8

meta::internal_function('namespace', <<'__93213d60cafb9627e0736b48cd1f0760');
my ($name) = @_;
$name =~ s/::.*$//;
$name;
__93213d60cafb9627e0736b48cd1f0760

meta::internal_function('retrieve', <<'__0e9c1ae91f6cf6020cf1a05db7d51d72');
my @results = map defined $data{$_} ? $data{$_} : file::read($_), @_;
wantarray ? @results : $results[0];
__0e9c1ae91f6cf6020cf1a05db7d51d72

meta::internal_function('select_keys', <<'__9f1f6ed4c1df5aa5f62cfd0ded8e6ae6');
my %options   = @_;
my %inherited = map {$_ => 1} split /\n/o, join "\n", retrieve(grep /^parent::/o, sort keys %data) if $options{'-u'} or $options{'-U'};
my $criteria  = $options{'--criteria'} || $options{'--namespace'} && "^$options{'--namespace'}::" || '.';

grep /$criteria/ && (! $options{'-u'} || ! $inherited{$_}) &&
                    (! $options{'-U'} ||   $inherited{$_}) &&
                    (! $options{'-i'} ||   $transient{inherit}{namespace($_)}) &&
                    (! $options{'-I'} || ! $transient{inherit}{namespace($_)}) &&
                    (! $options{'-S'} || ! /^state::/o) &&
                    (! $options{'-m'} ||   /^meta::/o) &&
                    (! $options{'-M'} || ! /^meta::/o), sort keys %data;
__9f1f6ed4c1df5aa5f62cfd0ded8e6ae6

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

meta::library('terminal', <<'__6999988eaf441c9b1282e03e1db427b5');
# Functions for nice-looking terminal output.
package terminal;

my %color_conversions = (black  => "0;0", red  => "1;31", yellow => "1;33", green => "1;32",
                                          blue => "1;34", purple => "1;35", cyan  => "1;36");
my $longest_prefix = 0;
my %default_colors = ();

sub color {
  $default_colors{$_[0]} = $_[1];
  $longest_prefix = $longest_prefix < length($_[0]) ? length($_[0]) : $longest_prefix;
}

color    'info',  'green';
color  'status',  'green';
color   'error',    'red';
color   'debug',   'blue';
color 'warning', 'yellow';

sub message {
  my ($prefix, $message) = @_;
  my $color = $color_conversions{$default_colors{$prefix}};
  my $padding = ' ' x ($longest_prefix - length $prefix);

  return if ::quiet() and $default_colors{$prefix} eq 'green';
  print STDERR "${padding}\[\033[${color}m$prefix\033[0;0m] $message\n";
}
__6999988eaf441c9b1282e03e1db427b5

meta::message_color('state', 'purple');
meta::message_color('states', 'yellow');
meta::message_color('watch', 'blue');
meta::note('queue', <<'__40f159df1db69068a402de470d5f3472');
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

  V8-based runtimes sometimes fail jQuery test [will fix soon].
  This is probably a V8 bug of some sort, though I'll have to isolate a suitable test case to submit it. Fortunately it only seems to have an effect when transforming jQuery (and it produces
  the same output), so maybe there is some nondeterminism that I need to address.

  Remove uses of eval() inside Caterwaul [fixed in 0.5].
  This is actually important for a couple of reasons. First, it's slow to use eval. Better is to avoid it by writing functions out longhand (much as I don't particularly like doing so).
  Second, it may be causing V8 some trouble. I'm not sure; will have to test this.

Ideas.
Unimportant things that might help at some point in the future.

  Hashed syntax nodes.
  This is useful for accelerating macroexpansion. I'm not sure whether it's relevant yet, but if done correctly it would give syntax nodes faster rejection (which is the most common case when
  macroexpanding). The challenge is incorporating wildcards.
__40f159df1db69068a402de470d5f3472

meta::parent('/home/spencertipping/bin/notes', <<'__320d51928ec8e2e370d67d30abe059b5');
function::note
meta::type::note
parent::object
__320d51928ec8e2e370d67d30abe059b5

meta::parent('object', <<'__2fa5e2565231e24d8c3ba43abc0403c4');
bootstrap::initialization
function::cat
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
function::import-bundle
function::load-state
function::lock
function::ls
function::ls-a
function::mv
function::parents
function::perl
function::reload
function::rm
function::save
function::save-state
function::serialize
function::serialize_single
function::shell
function::size
function::snapshot
function::state
function::unlock
function::update
function::update-from
function::usage
function::verify
internal_function::associate
internal_function::attribute
internal_function::chmod_self
internal_function::complete
internal_function::debug_trace
internal_function::execute
internal_function::fast_hash
internal_function::file::read
internal_function::file::write
internal_function::fnv_hash
internal_function::hypothetically
internal_function::internal::main
internal_function::invoke_editor_on
internal_function::namespace
internal_function::retrieve
internal_function::select_keys
internal_function::separate_options
internal_function::strip
internal_function::table_display
internal_function::temporary_name
internal_function::translate_backtrace
library::terminal
message_color::state
message_color::states
message_color::watch
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
meta::type::state
meta::type::watch
__2fa5e2565231e24d8c3ba43abc0403c4

internal::main();

__END__