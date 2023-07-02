# Projeto Prático - Base de Dados de Acordãos 
 ***Representação e Processamento de Conhecimento na Web (MEI - junho de 2023)***

## Autores:
* Bruno Campos (pg50275)
* Joaquim T. Roque (pg50502)
* Pedro Pereira (a80376)

## Introdução

Foi selecionado o quarto tema para o nosso projeto prático: Base de Dados de Acórdãos. O objetivo é criar um serviço web para a organização dos conjuntos de acórdãos disponibilizados periodicamente ao público pelos diversos tribunais autónomos, oferecendo uma interface única para a consulta de informações nos acórdãos. Neste relatório, serão abordados o tratamento dos _datasets_ fornecidos, as diversas opções de filtragem de acórdãos disponibilizadas, incluindo uma taxonomia classificativa de descritores, e, por fim, as funcionalidades desenvolvidas para os utilizadores do serviço.

## Rotas

### Principais

* ```GET /``` : Redireciona para ```/acordaos```
* ```GET /acordaos``` : Página principal
* ```GET /acordaos/:id``` : Página do acórdão com o ```id``` especificado
* ```GET /acordaos/adicionar``` : Formulário para adicionar um acórdão
* ```GET /acordaos/:id/editar``` : Formulário para editar um acórdão
* ```GET /login``` : Formulário de login
* ```GET /register``` : Formulário de registo

### Auxiliares

* ```GET /logout``` : Rota para efetuar logout
* ```GET /api/acordaos``` : Rota utilizada pelo JQuery Datatable para obter acórdãos
* ```POST /api/insert``` : Rota para inserção de acórdãos
* ```POST /api/edit``` : Rota para edição de acórdãos
* ```POST /api/delete``` : Rota para remoção de acórdãos
* ```POST /login``` : Rota para efetuar login
* ```POST /register``` : Rota para registo
* ```POST /favorites/add``` : Rota para adicionar a favoritos
* ```POST /favorites/remove``` : Rota para remover de favoritos

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

Partindo desta informação, conclui-se que havia muita inconsistência entre os _datasets_ mas também internamente, entre documentos do mesmo _dataset_. No total, existiam mais de 11 mil chaves distintas nos documentos. Como tal, foi necessário fazer uma limpeza aos dados. Concretamente, os campos relativos a datas foram normalizados, sendo todos alterados para o formato AAAA-MM-DD. Isto será particularmente importante na questão da filtragem, discutida no capítulo seguinte. Para além disso, também se tornou aparente que uma parte considerável das chaves não correspondiam a informação relevante, daí que estes campos foram simplesmente removidos. O critério para fazer o mesmo é de certa forma arbitrário, mas é facilmente ajustável, bastando alterar o conjunto das chaves a remover.

### Taxonomia

Para criar uma taxonomia de descritores, optamos por uma abordagem externa aos acórdãos. Ou seja, criamos uma taxonomia a partir dos descritores presentes nos acórdãos, sem modificar os próprios descritores dos acórdãos. Escolhemos essa abordagem para reduzir o tempo necessário para o tratamento e evitar alterações em milhares de descritores de uma área em que não temos conhecimento suficiente para fazer alterações efetivas. Além disso, optamos por reduzir os descritores finais para apenas as duas primeiras palavras, visando diminuir o tempo necessário para a criação da taxonomia.

A criação da taxonomia foi realizada seguindo os seguintes passos:

* Obtenção da lista de todos os descritores de acórdãos únicos iniciais;
* Tratamento dessa lista: capitalização, remoção de acentos e preposições, ordenação alfabética, obtenção dos descritores únicos intermediários, extração apenas das duas primeiras palavras dos descritores, ordenação alfabética e obtenção dos descritores únicos finais;
* Criação de uma taxonomia vazia baseada em uma estrutura de árvore com referência aos nós pai;
* Preenchimento da taxonomia com identificadores únicos (campo 'url') dos acórdãos correspondentes a cada nó;

Após a conclusão de cada um desses passos, obtemos uma taxonomia classificatória de descritores de acórdãos.

## Filtragem de Acordãos

Para a interface web de navegação dos acórdãos são disponibilizadas as seguintes possibilidades de pesquisa.

### Palavras-chave

A filtragem de acórdãos com base em palavras-chave fornecidas é efetuada através de um índice de texto completo da coleção de acórdãos (***db.acordaos.createIndex({ "$\*\*": "text" })***), permitindo a encontrar todos os acórdãos que incluem todas as palavras-chave.

### Data do Acordão

Aproveitando o tratamento de datas realizado anteriormente, é possível filtrar acórdãos utilizando campos de datas. Existem dois filtros de datas disponíveis: um para indicar a data inicial e outro para indicar a data final. Atualmente, apenas o campo "Data do Acórdão" está sendo utilizado, mas existem vários outros campos de datas disponíveis. É possível que no futuro alguns desses campos sejam convergidos com a "Data do Acórdão", já que possivelmente se referem à mesma data.


### Tribunais

Todos os acórdãos contêm um campo denominado "tribunal", o que permite filtrar os acórdãos com base no tribunal a que pertencem. É possível incluir vários tribunais na pesquisa, caso sejam desejados acórdãos provenientes de diferentes tribunais. No momento, os tribunais disponíveis estão limitados aos 14 tribunais iniciais (hard-coded). Além disso, foi criado um índice para otimizar os tempos de filtragem por tribunal (***db.acordaos.createIndex({ tribunal: 1 })***).


### Relator

É possível aplicar um filtro de pesquisa pelo nome do relator do acórdão.


### Nº de Processo

Também é possível realizar a pesquisa utilizando o número do processo correspondente.


### Taxonomia

Finalmente, disponibilizamos uma pesquisa de acórdãos utilizando a taxonomia de descritores criada anteriormente. As palavras introduzidas passam pelo mesmo tratamento que os descritores da taxonomia, ou seja, são removidos acentos e preposições.


## Usuários

A interface web não só oferece pesquisa de acórdãos, como também disponibiliza autenticação de contas para os utilizadores, bem como funcionalidades adicionais para aqueles que estão autenticados.


### Autenticação

Para implementar autenticação foi primeiro construído um servidor que trata de toda a informação específica a utilizadores. Este servidor expõe rotas para fazer, _log in_, registar um utilizador e interagir com a lista de favoritos de um utilizador.
Para fazer _log in_ este utiliza um _token_ _jwt_ que assina com o nível de autorização do utilizador, data de criação e data de expiração.


### Níveis de Acesso

Depois de autenticados, as operações que cada utilizador pode realizar dependem do nível de acesso atribuído. Atualmente, existem dois níveis de acesso disponíveis:

* Administrador: tem acesso completo a todas as funcionalidades da interface web. Isto inclui a possibilidade de adicionar, editar ou eliminar acórdãos, bem como adicioná-los aos favoritos;
* Utilizador: tem acesso restrito apenas aos favoritos;


### Favoritos

Os utilizadores autenticados têm a opção de adicionar acórdãos aos seus favoritos, juntamente com uma breve descrição, se desejarem. Esses acórdãos serão disponibilizados na aba de favoritos, permitindo que o utilizador os acesse novamente ou os remova dessa mesma lista.
