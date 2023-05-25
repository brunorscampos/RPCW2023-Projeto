#!/usr/bin/env perl

use v5.36;
use utf8;
use JSON;

use constant PRETTIFY => 1;

# drop these keys
use constant REMOVABLE_KEYS => [
    ''
];

use constant DATE_KEYS => [
    'DATA DA AQUISIÇÃO',
    'DATA DA PRÁTICA DO FACTO',
    'DATA DE ENTRADA REQUERIMENTO',
    'DATA',
    'Data Dec. Recorrida',
    'Data Depósito',
    'Data cheque',
    'Data da Decisão Singular',
    'Data da Decisão Sumária',
    'Data da Decisão',
    'Data da Operação',
    'Data da Reclamação',
    'Data da escritura de compra e venda',
    'Data de Alteração De Denominação',
    'Data de Apresentação do Pedido de Asilo',
    'Data de Constituição',
    'Data de Entrada',
    'Data de Início',
    'Data de Nascimento / Idade',
    'Data de Vencimento',
    'Data de durabilidade mínima',
    'Data de vencimento',
    'Data do Acordão',
    'Data do Acórdão',
    'Data do Apêndice',
    'Data do Diário da República',
    'Data do Movimento',
    'Data do início de comercialização',
    'Data do movimento',
    'Data dos pagamentos',
    'Data e Hora da Assinatura',
    'Data expedição',
    'Data limite de pagamento',
    'Data movimento',
    'Data',
    'DataValor da Operação',
    'Datas de Fixação',
    'Datas de pagamento da taxa fixa',
    'Datas de pagamento da taxa variável',
    'Datas',
    'Em que data regressou voluntariamente ao seu país de origem?',
    'Em que data teve lugar esse afastamento?',
    'Ordenante Data do Movimento'
];

sub delete_keys($document){
    foreach my $k (@{REMOVABLE_KEYS()}){
        delete $document->{$k};
    }
}

sub normalize_dates($document){
    foreach my $k (@{DATE_KEYS()}){
        next unless(exists $document->{$k});

        my $date = $document->{$k};
        unless($date =~ s[^\s*(\d{2})(/|-)(\d{2})\g2(\d{4})\s*$][$4-$3-$1]o){
            print STDERR "$date doesn't match the DD/MM/YYYY format (@ key '$k'); skipping...\n";
        }
        else {
            $document->{$k} = $date;
        }
    }
}

sub clean_documents($in_fn){

    my $out_fn = "$in_fn.new";
    my $json_obj  = JSON->new()->utf8(0);

    local $/ = '    },';
    open my $in_fh, '<:utf8', $in_fn or do { warn "$!"; return 1; };
    open my $out_fh, '>:utf8', $out_fn or do { warn "$!"; return 1; };

    print $out_fh '[';
    print $out_fh "\n" if(PRETTIFY);

    my $is_first = 1;
    while(<$in_fh>){

        m/\{.*\}/so;
        $_ = $&;

        # get the hash representing the document
        # and clean up this entry with the appropriate subroutines
        my %document = %{$json_obj->decode($_)};
        delete_keys(\%document);
        normalize_dates(\%document);

        my $out_str = $json_obj->pretty(PRETTIFY)->space_before(0)->encode(\%document);

        if(PRETTIFY){

            $out_str =~ s/(.*)\n$/$1/so;
            $out_str =~ s/\n/\n\t/go;
            $out_str = "\t$out_str";

            say $out_fh ',' unless($is_first);
        }
        else {
            print $out_fh ',' unless($is_first);
        }

        print $out_fh $out_str;


        $is_first = 0;
    }

    if(PRETTIFY){
        say $out_fh "\n]";
    }
    else {
        print $out_fh ']';
    }

    return 0;
}

sub main(){

    binmode STDOUT, ':utf8';
    binmode STDERR, ':utf8';

    unless(scalar @ARGV > 0){
        say STDERR "usage: $0 FILE...";
        return 1;
    }

    foreach(@ARGV){
        #if(fork == 0){
            clean_documents($_);
        #}
    }

    #wait foreach(@ARGV);
    return 0;
}

exit main() unless(caller);
