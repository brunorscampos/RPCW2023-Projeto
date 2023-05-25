#!/usr/bin/env perl

use v5.36;
use utf8;

use constant CHAR_LIM => 99;

sub summarize_json($in_fn, $out_fh){

    my %json_keys = ();
    my $doc_count = 0;

    open my $in_fh, '<:utf8', $in_fn or do { warn "$!"; return 1; };
    local $/ = '    },';

    while(<$in_fh>){
        ++$doc_count;
        while(m{^(?>[ ]{8}|\t\t)"(.*?)(?<!\\)"\s*:(.*)\z}ms){
            ++$json_keys{$1};
            $_ = $2;
        }
    }

    say $out_fh "Summary for $in_fn ($doc_count documents):";
    foreach my $k (sort { $json_keys{$b} <=> $json_keys{$a} } keys %json_keys){

        my $v = $json_keys{$k};

        print $out_fh ((sprintf "%-8s", $v) =~ tr/ /-/r);
        say $out_fh ": $k";
    }

    print $out_fh "\n\n";

    return 0;
}

sub main(){

    binmode STDOUT, ':utf8';

    unless(scalar @ARGV > 0){
        say STDERR "usage: $0 FILE...";
        return 1;
    }

    open my $out_fh, '>:utf8', 'summary.out';

    foreach(@ARGV){
        if(fork == 0){
            exit summarize_json($_, $out_fh);
        }
    }

    wait foreach(@ARGV);

    return 0;
}

exit main() unless(caller);
