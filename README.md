# Projeto Prático - Base de Dados de Acordãos 
 ***Representação e Processamento de Conhecimento na Web (MEI - junho de 2023)***

## Autores:
* Bruno Campos (pg50275)
* Joaquim T. Roque (pg50502)
* Pedro Pereira (XXXXXXX)

## Introdução

Foi selecionado o quarto tema para o nosso projeto prático: Base de Dados de Acórdãos. O objetivo é criar um serviço web para a organização dos conjuntos de acórdãos disponibilizados periodicamente ao público pelos diversos tribunais autónomos, oferecendo uma interface única para a consulta de informações nos acórdãos. Neste relatório, serão abordados o tratamento dos _datasets_ fornecidos, as diversas opções de filtragem de acórdãos disponibilizadas, incluindo uma taxonomia classificativa de descritores, e, por fim, as funcionalidades desenvolvidas para os utilizadores do serviço.

## Tratamento de Datasets

Considerando que foram fornecidos 14 _datasets_ distintos, o grupo considerou que seria importante analisar a estrutura dos mesmos num fase inicial. Para tal, desenvolveu-se um _script_ em Perl que, dado um ou mais ficheiros JSON, iria produzir um pequeno relatório relativo às chaves presentes nos documentos de cada ficheiro, indicando a sua frequência, bem como o número total de documentos. Um exemplo de como correr este _script_ e respetivo _output_ gerado seria:

```
    $ ./json_keys.pl file1.json file2.json
    $ cat summary.out
Summary for file1.json (5895 documents):
5895----: chave1
5895----: chave2
5895----: chave3


Summary for file2.json (44895 documents):
6000----: chave1
4753----: chave2
3292----: chave3
```

Partindo desta informação, conclui-se que havia muita inconsistência entre os _datasets_ mas também internamente, entre documentos do mesmo _dataset_. No total, existiam mais de 11 mil chaves distintas nos documentos. Como tal, foi necessário fazer uma limpeza aos dados. Concretamente, os campos relativos a datas foram normalizados, sendo todos alterados para o formato AAAA/MM/DD. Isto será particularmente importante na questão da filtragem, discutida no capítulo seguinte. Para além disso, também se tornou aparente que uma parte considerável das chaves não correspondiam a informação relevante, daí que estes campos foram simplesmente removidos. O critério para fazer o mesmo é de certa forma arbitrário, mas é facilmente ajustável, bastando alterar o conjunto das chaves a remover.

### Taxonomia

...


## Filtragem de Acordãos

...

### Palavras-chave

...


### Data do Acordão

...


### Tribunais

...


### Relator

...


### Nº de Processo

...


### Taxonomia

...


## Utilizadores

...
