# Self-modifying Perl objects

Like the title suggests, each Perl script in this directory modifies itself by overwriting its own contents when it is executed. The mechanism for doing this is [described in detail
here](http://github.com/spencertipping/writing-self-modifying-perl). While this probably sounds like some useless academic exercise, I now use these scripts when writing new projects in Perl
and in other languages.

Each script here is MIT-licensed as usual. The only potential caveat is that they link to the GNU Readline Perl module, which may mean that the scripts themselves need to be GPL-licensed. In
either case, the contents of the scripts can be licensed independently of the scripts themselves.

## Overview

Each script is fully self-contained and maintains a table of `name -> value` mappings. Each `name` exists inside a namespace; this is written as `namespace::name`. The namespace determines
how the attribute is interpreted. So, for example, we can ask `./object` to enumerate everything in the `data::` namespace like this:

    $ ./object ls ^data::
    data::author
    data::default-action
    data::license
    data::permanent-identity
    $

By convention, namespaces are defined by attributes prefixed with `meta::type::`. So, for instance:

    $ ./object ls ^meta::type::
    meta::type::alias
    meta::type::bootstrap
    meta::type::cache
    meta::type::data
    meta::type::function
    meta::type::hook
    meta::type::inc
    meta::type::indicator
    meta::type::internal_function
    meta::type::library
    meta::type::message_color
    meta::type::meta
    meta::type::parent
    meta::type::retriever
    meta::type::state
    $

All attribute values are strings, but the namespace is informed when an attribute is defined. This allows scripts to reinterpret the string values in other ways. For example, the
`function::` namespace evals its values into Perl functions. These functions can access the attribute table using the `%data` hash, or preferably by using `associate()` and `retrieve()`:

    $ ./object cat function::cat
    join "\n", retrieve(@_);
    $ ./object cat internal_function::retrieve
    my @results = map defined $data{$_} ? $data{$_} : retrieve_with_hooks($_), @_;
    wantarray ? @results : $results[0];
    $

## Getting started

I find these scripts easy to use, but that's probably because I wrote them. I suspect anyone else will find them to be a frustrating nightmare (let me know if you find this to be the case
and I'll see what I can do to fix the problem).

First, you'll need the GNU readline library for Perl. On Arch Linux this is a separate package; I think you can install this either using CPAN or the system's package manager. You don't
absolutely need readline, but it enables tab-completion and makes for a much better shell experience. Once you've got that, make sure you've set your `$EDITOR` or `$VISUAL` environment
variable appropriately:

    $ echo $EDITOR
    /usr/bin/vim        # /usr/bin/emacs will also work, but is an inappropriate value ;)
    $

At this point you should be all set to create an object. The easiest way to do this is to tell `object` that you want a child of it. This causes your child to stay up-to-date with changes
you make to `object` later on. Here's how to do that:

    $ ./object child my-object

If you run `my-object` you'll enter its shell; at this point you can create and modify its attribute table. Most attributes are inherited from `object`, so it will warn you before you modify
them. This is a good thing; the logic that overwrites the file in-place is implemented as a series of `function::` and `internal_function::` attributes. If you changed these you could end up
with a script that obliterated itself. I know this because I've done it a few times.

The `data::` namespace lets you bind data that won't be inherited by child scripts and that won't be evaluated by Perl. This is a good place to stash script-specific data.

    $ ./my-object
    > create data::foo          # opens an editor; this is the value of data::foo
    > cat data::foo             # prints whatever you put into the editor
    > cp data::foo data::bar    # sets data::bar to data::foo
    > rm data::foo              # nukes data::foo
    > ls data::
    data::author
    data::bar
    data::default-action
    data::license
    > exit                      # saves object state
    $

You can find out what is unique to a given script by using `ls -u`:

    $ ./my-object
    > ls -u
    cache::parent-identification
    data::author
    data::bar
    data::default-action
    data::license
    parent::./object
    >

Everything in `data::` is considered unique because it won't be updated if it changes in the parent. It was inherited once when the original script (in this case `object`) copied itself, but
it isn't technically inherited. You can pull updates from all parents (Perl scripts use multiple-inheritance) using the `update` function:

    > update
    my-object(info) updating from ./object
    [a whole bunch of junk]
    >

You can also add new parents:

    > update-from some-other-perl-object
    my-object(info) updating from some-other-perl-object
    >

This creates a new entry in the `parent::` namespace and will cause future `update` operations to inherit changes to the given script.

## Data integrity and troubleshooting

These scripts are fairly resilient to breaking changes. For instance, if you write something that prevents a script from functioning correctly, it will refuse to overwrite itself and will
instead save a temporary file so that you can figure out what went wrong. A Perl object overwrites itself only when the new copy can hash its contents correctly. Since implementing these
checks, I have not lost any data doing normal things with these scripts.

That being said, your data is probably unsafe until you understand how Perl objects work. I highly recommend reading [Writing Self-Modifying
Perl](http://github.com/spencertipping/writing-self-modifying-perl) for this purpose.