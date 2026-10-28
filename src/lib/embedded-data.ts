import type { ProjectState } from "./project-store";

// Dados iniciais embutidos no HTML; usados só quando o navegador ainda não tem nada salvo.
export const EMBEDDED_DATA: Partial<ProjectState> | null = {
  "projectName": "Materiais Capitalizáveis",
  "manager": "Arthur Cardoso",
  "overview": "O projeto visa corrigir a deficiência no processo atual de emissão de notas fiscais para materiais utilizados na manutenção das turbinas, focando principalmente nos contratos “full scope”. \n\nAtualmente, apenas NFs de serviços são emitidas, sem contemplar notas de saída dos materiais consumidos nas turbinas eólicas, gerando riscos fiscais e contábeis. \n\nO cliente Auren foi o pioneiro a levantar essa demanda, porém, por se tratar da regularização do processo fiscal de emissão de notas a ideia é, futuramente, que à iniciativa desse projeto seja expandida para todos os parques do Brasil. \n\nO projeto envolve criação de novas plantas de industrialização, ajustes de SAP/Salesforce e alinhamento com fornecedores.",
  "tasks": [
    {
      "id": "i1pifm35",
      "title": "Realizar testes voltados à parte de Supply (ativação de demandas → retorno ao estoque, Main Components)",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Lucas - LAPSE"
    },
    {
      "id": "ih1ca1t8",
      "title": "Marcar reunião para efetuar os testes com Laís, Leonardo e Lucas",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Arthur - ATRRO"
    },
    {
      "id": "auaicgmd",
      "title": "Criação do novo tipo de movimento (Z89 e Z90) para checagem da etapa final do teste de emissão de NF",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Tathiane - THAVA"
    },
    {
      "id": "wuc9z1mh",
      "title": "Solicitar a criação da nova planta do WH de Simões Filho (5697)",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Vanusa - VACVE / Tathiane - THAVA / Leonardo - LEMLA"
    },
    {
      "id": "tlskydcn",
      "title": "Criação das plantas de Industrialização (56F9, 56G9, 56H0, 56H2, 56H3)",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Leonardo - LEMLA"
    },
    {
      "id": "h8p31p3h",
      "title": "Verificar custo e tributação presente na NF (ambiente de testes SAP) referente ao novo movimento",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Vanusa - VACVE"
    },
    {
      "id": "gdzy8izh",
      "title": "Envolver equipe de desenvolvimento do SF para checar comportamento do sistema",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Brenno - BADCA"
    },
    {
      "id": "becl53q1",
      "title": "Subir movimento para a PE1",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Tathiane - THAVA"
    },
    {
      "id": "gp1sbwhx",
      "title": "Definir parametrização de abastecimento da 5697 e alterar plantas antigas (espelhar 5694)",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Leonardo - LEMLA",
      "notes": "06.08) Todas as informações disponíveis, pendente apenas o green light para mudança.\n\n13.08) Ok do LAPSE, pode copiar configuração de 5694.\n\n10.09) Finalizado\n\n",
      "deadline": "2026-08-10"
    },
    {
      "id": "z4r53n3e",
      "title": "Separação de novo Main warehouse/storage location de industrialização 5697 (físico) — envolver Ayrton do WH",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Lucas - LAPSE / Ayrton - AYOLI",
      "notes": "- Lucas entrou em contato com Ayrton. Início de Agosto terá uma reunião sobre item. \n- Espaço disponível e fornecedor já informado (TPC)\n- Possibilidade de utilizar um sistema distinto pela TPC para evitar a mistura do uso e consumo da industrialização\n\n13.08) Reunião com o Warehouse + Supply sobre segregação de estoque físico.\n \nStock Keeper do parque será treinado em breve.\nSite: Cliente irá disponibilizar um container (muito provavelmente)\nData do treinamento: Setembro\n\n21.08) Execução não é complicada, espaço definido, aguardando o ok para seguir com o projeto para fechar quantidade/espaço.\n\n10.09) Alinhamentos realizados junto ao fornecedor, apenas colocar em prática.\n\n17.09) Alinhamentos realizados junto ao fornecedor, apenas colocar em prática. Risco sendo levantados pela equipe do WH. Identificação das entregas, risco de misturar materiais de industrialização + uso e consumo. Interessante identificar os volumes\n\n01.10) Reunião marcada dia 05.10 - feedback na reunião 08.10. Previsão de chegada de materiais Nov - Dez/2026",
      "deadline": "2026-10-22"
    },
    {
      "id": "pqkwl82h",
      "title": "Separação das novas plantas de industrialização no parque (físico)",
      "status": "em_andamento",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Arthur - ATRRO",
      "notes": "ATRRO solicitou comunicação ao cliente sobre aumento do escopo, englobando todos os materiais. Após isso, na reunião de alinhamento, o tópico será tratado.\n- 28.07 - Ciente envolvido, cogitou trazer um container\n\n10.09)\nFinalização prevista até fim de Setembro - informação do cliente. Previsão de chegada dos materiais no site - Dezembro/2026.\n\n01.10) Reunião com o cliente na data de hoje",
      "deadline": "2026-10-01"
    },
    {
      "id": "v7m5dpor",
      "title": "Nova análise de Compliance após migração final ao ambiente de produção",
      "status": "a_iniciar",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Vanessa - VADSG",
      "deadline": "2026-12-01"
    },
    {
      "id": "3ci5q75y",
      "title": "Configurar MRP de VdP para inserir os pedidos na planta 5697 1000",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Leonardo - LEMLA / Karol - KAVLE / Mauro - MUJSA",
      "notes": "30.07) KAVLE: Confirmar criação do SL e MRP\n\n- Setup para industrialização já criado \n\n- Processo em andamento, aguardando retorno de Global. Pendente configuração de 5697, após isso, é possível.\n\n06.08) LEMLA trabalhando nesse tópico - Lucas alinhar processo com o Léo\n\n13.08) Acompanhar no outro card sobre o tópico",
      "deadline": "2026-08-14"
    },
    {
      "id": "vy4ebcs4",
      "title": "Time de compras parametrizar as condições de compras na 5697 (copiar configuração da 5694)",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Bruna - BRBEI",
      "notes": "30.07) Necessário alinhamento com fornecedor \n(5697 - Price Net, 5694 - Price Gross)\n- Wave 1: 32x itens (YM01) W32 \n- Wave 2: 345x (Materiais consumidos) W33_W34\n- Wave 3:  Restante - depende da prev. de consumo, apoio da Karol\n\n06.08) Wave 1 = Net Price 22/32 feitos \n5x em processo junto ao fornecedor\n5x dependendo do global\nComunicação junto aos fornecedores: Bruna irá preparar um esboço para aprovação e distribuição.\n\n13.08) Wave 1 = Net Price 29/32 feitos\nWave 2 = Net Price ([188: Int] + [4: N/A] + [136 Ext]) / 345 feitos\n328/345 (75%)\n\nPrioridade alertada por LAPSE:\n222409\t1\t93\tProibido\n29119547\t1\t93\tSem disp. GWH\n60032042\t15\t1395\tRAG\n60059753\t1\t93\tSACO\nS096181\t10\t930\tPETROSOL\n\nPróximo passo: configurar o info record - Se atentar o modelo padrão enviado pelo Léo\n\n10.09) Bruna enviou um template > Template errado, procurement precisa reajustar a coluna de valor e NCM - Apenas para produtos Locais. e-mail enviado pelo LEMLA (pedir suporte da Thais).\n\nCondições Globais estão ok.\n\n17.09) Template ajustado e enviado pela Thais. Caso chegue algum item spot a demanda será alertada via Supply/Master Data.",
      "deadline": "2026-08-05"
    },
    {
      "id": "jvw8z7np",
      "title": "Lista e data por item de todos os materiais para enriquecimento/ajustes/configuração (≥15 dias p/ cadastro)",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Lucas - LAPSE / Laís - LIGOI",
      "notes": "De acordo com feedback recebido a lista foi enviada na W 28.\n\nCompartilhado pelo Lucas.",
      "deadline": "2026-07-13"
    },
    {
      "id": "oz6dxmx3",
      "title": "Realizar o teste no SF em ambiente de testes com novo movimento Z89/Z90",
      "status": "em_andamento",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Brenno - BADCA",
      "notes": "Feedback 30.07 - Testes ainda em andamento\nJulho (Férias Global)\nAgosto (Previsão de finalizar os testes)\nSetembro Produção (Go live - Sales Force)\n\n10.09) Confirmar com Brenno\n\n17.09) \nAgosto + Setembro (Previsão de finalizar os testes)\nOutubro - 12/10 - Produção (Go live - Sales Force)\n\n01.10) Data se mantém",
      "deadline": "2026-10-12"
    },
    {
      "id": "n3avczlk",
      "title": "Enviar lista dos NCMs de todos os materiais",
      "status": "finalizado",
      "createdAt": "2026-07-09T13:30:00.954Z",
      "attachments": [],
      "responsible": "Lucas - LAPSE",
      "notes": "Devido a mudança de escopo da atividade será preciso enviar a lista de todos os materiais e NCM's ao cliente. Lucas compartilhar com Arthur que irá enviar ao cliente.\n\nVer link enviado pelo Ayrton, confirmar posteriormente com o LAPSE.",
      "deadline": "2026-07-17"
    },
    {
      "id": "zgwkyq60",
      "title": "Subir movimento para a PE1 - Z89 e Z90",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Tathiane - THAVA",
      "notes": "Tathiane de férias, confirmar com Leonardo. Subiu, confirmado dia 16/07",
      "deadline": "2026-06-21"
    },
    {
      "id": "2ryli66s",
      "title": "Desenvolver Salesforce para a reserva de materiais da 5697",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Brenno - BADCA",
      "notes": "Feedback dia 30/07 - \"A reserva do material, a gente alterou a lógica, nao vamos fazer mais somente ym01. Vai ser tudo, então reserva de material não muda. \n\n- Para finalizar os testes precisa que o MRP do parque e da 5697 esteja totalmente parametrizado para finalizar o teste \"real\" \n\n17.09) Atrelado à tarefa \"Realizar o teste no SF...\"",
      "deadline": "2026-09-24"
    },
    {
      "id": "hffak3yk",
      "title": "Criar SL 1030 e MRP para todas as plantas (56E0, 56E1, 56E2, 56D8, 56D9)",
      "status": "finalizado",
      "createdAt": "2026-07-09T11:31:47.515Z",
      "attachments": [],
      "responsible": "Laís - LIGOI",
      "notes": "- Foi solicitada a criação dia 09/07 via e-mail - feito /\n- Laís marcar reunião p/ W 29 - feito /\n- Criação do SL e Shipping Point - Em andamento (20%) /\n- Marcar recorrência semanal para adiantar o tópico\n- Finalizado W30",
      "deadline": "2026-07-30"
    },
    {
      "id": "zqu7mp1x",
      "title": "Fazer levantamento de custos do estoque do parque",
      "status": "finalizado",
      "createdAt": "2026-07-09T13:44:07.041Z",
      "attachments": [],
      "responsible": "Laís - LIGOI",
      "notes": "Criar excel com:\nQuantidade, item number, descrição, planta, custo unitário e custo total.\n\nEnviado pela LIGOI",
      "deadline": "2026-07-10"
    },
    {
      "id": "rojfsamx",
      "title": "Definir plano de consumo de materiais - Fora de estoque",
      "status": "em_andamento",
      "createdAt": "2026-07-09T13:42:20.327Z",
      "attachments": [],
      "responsible": "Arthur - ATRRO",
      "notes": "Envolver planejamento, operações e coletar autorização formal do NAPRO.\n\nNAPRO envolvido - análise em andamento, checagem dos custos por operações. Ao fim da análise, ATRRO enviar feedback à equipe de Supply (Karol, Mauro, Lucas e Ayrton).\n\n10.09) Pendente ainda ajuste no preço da Yaw Gear Ren\n\n01.10) Reunião agendada para 08.10 com operações, supply, planejamento e stock keeper.",
      "deadline": "2026-10-30"
    },
    {
      "id": "f24jrnqn",
      "title": "Verificar a emissão de NF nas plantas",
      "status": "a_iniciar",
      "createdAt": "2026-07-10T12:10:19.834Z",
      "attachments": [],
      "responsible": "Vanusa - VACVE",
      "deadline": "2026-12-10"
    },
    {
      "id": "1rgo99ne",
      "title": "\"Direcionar\" pedidos das ordens YM01 para 5697",
      "status": "em_andamento",
      "createdAt": "2026-07-16T13:37:04.560Z",
      "attachments": [],
      "responsible": "Lucas - LAPSE / Laís - LIGOI",
      "notes": "18.07) ATRRO Compartilhar YM01 com Lucas - Compartilhado W29 / LAPSE - \"Puxar\" pedidos diretamente via SAP\n\n24.07) Lista compartilhada\n\n04.08) Aguardando configurações finais do MRP - 5697\n\n13.08) Em processo de forma manual. Diretamente atrelado à criação de ordens no SF e apontar para 5697 (acionar equipe de Plan).\n\n10.09) Em processo - como alguns ajustes ainda estão em andamento seria interessante alterar a \"planta base\" para 5697 no SAP para gerar demanda diretamente para 5697 - LIGOI utilizar IW32 no ambiente de produção.\n\n17.09) DN criada para materiais importados, previsão de chega em Dezembro/26\n\n01.10) 97% dos materiais YM01 já direcionadas, alguns materiais apresentaram problemas, mas não estão correlacionados com a nova parametrização e sim com sincronização SAP <> SF. \n\nREAVE irá alinhar os detalhes com LIGOI.",
      "deadline": "2026-10-01"
    },
    {
      "id": "nnxsnzw4",
      "title": "Valor inventário - Item incorreto - Yaw Gear - 29209455REN",
      "status": "em_andamento",
      "createdAt": "2026-07-16T13:39:25.422Z",
      "attachments": [],
      "responsible": "André - ANAEL",
      "notes": "23.07) LIGOI identificou um item específico com um custo muito acima do que o normal - Yaw gear REN. Ticket para modificação do valor precisa ser aberto.\n\nTicket aberto - Procurement envolvido para checagem dos custos - André envolvido\n\n30.07) Valor atualizado de acordo com o ticket (106k - REN) - muito acima ~ Yaw Gear Nova = 14k. \n\n06.08) Confirmado por André que o valor realmente está incorreto. Info record ajustado - necessário abrir ticket por procurement para ajustes finais\n\n13.08) André de férias, Bruna dará suporte na criação do ticket (compartilhado no chat pelo LEMLA)\n\n10.09) Foi ajustado o valor porém ainda consta divergência entre o preço do 5693 e 5694 - LEMLA mandar um reminder para checagem do preço \n\n17.09) Procurement - André Bollos deverá abrir novo ticket\n\n01.10) ANAEL informado, no aguardo de um feedback. Como solução provisória as Yaw Gears serão consumidas apenas quando o valor for ajustado",
      "deadline": "2026-07-30"
    },
    {
      "id": "lt4ykooy",
      "title": "Enriquecimento dos materiais na 5697 (consumíveis via global; corretivas priorizar locais)",
      "status": "finalizado",
      "createdAt": "2026-07-17T11:07:02.684Z",
      "attachments": [],
      "responsible": "Bruna - BRBEI / Leonardo - LEMLA / Lucas - LAPSE",
      "notes": "06.08) Tarefa não dependente do SL\n- Itens Global - OK\n- Itens locais - LAPSE inserir LEMLA no looping para adiantar o processo (aguardando definição da KAVLE sobre custos de inventário na planta)\n\n13.08) Materiais em sua grande parte cadastrados.\nPendência: User Calendar - e-mail compartilhado pelo LEMLA para suporte do LAPSE - Uma planta específica 56E1.\n- Itens locais - LAPSE inserir LEMLA no looping para adiantar o processo (aguardando definição da KAVLE sobre custos de inventário na planta)\n\n27.08) Custos do inventário serão assumidos localmente, inicialmente. Planning Calendar - Ainda não foi criado\n\n10.09) \n- MRP 5697 - 4573 itens já registrados\n- PDT - 112 days\n- Planning Calendar - OK\n- Link Y4 - Itens locais alterar para Y20\n\nEnriquecimento no 5697 finalizado",
      "deadline": "2026-08-06"
    },
    {
      "id": "1mdq63ra",
      "title": "Alinhar com buyer alteração do cabeçalho da PO",
      "status": "finalizado",
      "createdAt": "2026-07-23T10:30:50.009Z",
      "attachments": [],
      "responsible": "Lucas - LAPSE / Leonardo - LEMLA",
      "notes": "Informar no cabeçalho da PO se é um item adquirido via industrialização ou uso e consumo para que ele saiba se deverá inserir o net price ou o gross price. 5697 = Price Net, 5694 = Price Gross\n\n- Leo testar inserir a planta no endereço para análise (teste a ser iniciado W30)\n- Outro increment - inserir a informação de \"faturar net price\" na PO\n\n13.08) Deixar para avaliar internamente/com os buyers\n\n10.09) Envolver Thaís na ausência da Bruna\n\n17.09) Não iremos seguir por esse caminho, apenas com o ajuste no endereço da PO e em campos específicos",
      "deadline": "2026-09-30"
    },
    {
      "id": "f9naznky",
      "title": "Solicitar a criação da nova planta de industrialização do WH de Parnamirim (569X)",
      "status": "finalizado",
      "createdAt": "2026-07-23T11:05:22.146Z",
      "attachments": [],
      "responsible": "Tathiane - THAVA / Vanusa - VACVE / Leonardo - LEMLA",
      "notes": "Essa nova planta será utilizada para os novos projetos e parques atuais da CdV, conforme informado pela Simone (SIAEG) e o Niafe (NAPRO) em reunião no dia 22/07.\n\n24.09) Não será mais necessário, a Vanusa compartilhou que todos os demais sites usarão a mesma configuração de planta que existe atualmente.",
      "deadline": "2026-10-01"
    },
    {
      "id": "mz7hmq8r",
      "title": "Configuração MRP - 5697",
      "status": "finalizado",
      "createdAt": "2026-07-30T11:09:45.065Z",
      "attachments": [],
      "responsible": "Lucas - LAPSE / Karol - KAVLE",
      "notes": "30.07) Equipe de Global informou que o MRP ainda não está completamente configurado. KAVLE no circuito para finalizar a configuração do MRP\n\n06.08) Questões de inventário - setup em processo de alinhamento. Novo prazo 13/08\n\n13.08) Configuração da planta ok, interface entre 5697 <> Global - Ok\n# Indefinido - custo do inventário (Global ou Regional)\n# Pendência: Tipo do movimento da PO para finalizar toda a parametrização (ticket criado)\n\n27.08) Adiar a reunião de configuração do MRP 5697 do dia 28.08 para dia 31.08 devido a indefinição do projeto\n\n10.09) MRP ok, finalizado. \nIndefinição - se terá APO ou não (conexão PO <> Estoque). Todas as plantas atualmente no BR possuem essa conexão - LAPSE entrará em contato com a pessoa responsável\n\n01.10) APO funcionando - DN de 98% dos materiais gerada",
      "deadline": "2026-08-04"
    },
    {
      "id": "ogj8trk8",
      "title": "Teste alteração do endereço/Cabeçalho e infos na PO",
      "status": "finalizado",
      "createdAt": "2026-07-30T14:30:51.551Z",
      "attachments": [],
      "responsible": "Leonardo - LEMLA / Lucas - LAPSE",
      "notes": "#Teste local feito - padrão aprovado \n#Enviar também para Global para validação\n\n13.08) Para início da implementação será manual (via LEMLA), posteriormente global deve fazer de forma automática. Global deverá ser acionado para mudar o info record - Bruna checar se existe algum formulário padrão para vir automático, caso contrário, ver qual campo é preciso alterar para LEMLA inserir no scrip dele.\n\n10.09) Operacionalizar o que foi obtido no teste (sucesso) pela equipe de procurement.\n\n17.09) Comunicado enviado por Procurement aos fornecedores",
      "deadline": "2026-09-21"
    },
    {
      "id": "agy09udd",
      "title": "Procurement identificar quantidade de materiais assignados aos vendors externos",
      "status": "finalizado",
      "createdAt": "2026-08-06T17:49:37.533Z",
      "attachments": [],
      "responsible": "Bruna - BRBEI / Thaís - TASDE",
      "notes": "06.08) Identificar no sistema quantidade de materiais assignados aos vendors externos\n\n13.08) Feito",
      "deadline": "2026-08-13"
    },
    {
      "id": "hlbiozaw",
      "title": "Parametrizar informações dos Materiais no sistema",
      "status": "finalizado",
      "createdAt": "2026-09-17T14:06:11.192Z",
      "attachments": [],
      "responsible": "Leonardo - LEMLA",
      "notes": "17.09) Procurement enviou a planilha com os campos ajustados para que Leo insira as informações no sistema\n\n24.09) Alguns ajustes na planilha ainda pendentes por parte de procurement, Léo vai falar diretamente com a Thaís para suportar.\n\n01.10) Procurement ajustou a planilha. ",
      "deadline": "2026-09-25"
    },
    {
      "id": "k9a3x9iq",
      "title": "Revisar lista de materiais críticos para configuração",
      "status": "em_andamento",
      "createdAt": "2026-10-01T13:42:33.950Z",
      "attachments": [],
      "responsible": "Leonardo - LEMLA / Lucas - LAPSE / Bruna - BRBEI",
      "notes": "01.10) Identificado que existem algumas listas distintas de materiais, fazer uma reanálise se realmente os materiais prioritários estão todos englobados nas configurações iniciais. \n# Principalmente (não contemplados): 222409, 60059753, 29351146, 29448378, 29096779, 29180316.\n# Em tratativa no momento: 29119547, 60032042, S096181\n# Itens REN não estão contemplados",
      "deadline": "2026-10-08"
    },
    {
      "id": "2ynj84w2",
      "title": "Itens REN a serem priorizados parametrização no sistema",
      "status": "a_iniciar",
      "createdAt": "2026-10-01T14:00:41.644Z",
      "attachments": [],
      "responsible": "André - ANAEL",
      "notes": "NOTA INFORMATIVA\nPriorizar a configuração dos itens REN - Stack e Yaw Gear\n\nSTACK:\n29130854REN\n29130855REN\n29152846REN\n29152847REN\n29152849REN\n\nYAW GEAR\n29209455REN",
      "deadline": "2026-12-31"
    },
    {
      "id": "r07fdev1",
      "title": "Fluxo de Def - NFs de devolução",
      "status": "a_iniciar",
      "createdAt": "2026-10-07T12:00:00.000Z",
      "attachments": [],
      "responsible": "Brenno - BADCA / Vanusa - VACVE",
      "deadline": "2026-11-01"
    },
    {
      "id": "r07qe2n1",
      "title": "Teste - Gerar NF em QE2",
      "status": "a_iniciar",
      "createdAt": "2026-10-07T12:00:01.000Z",
      "attachments": [],
      "responsible": "Vanusa - VACVE / Tathiane - THAVA / Brenno - BADCA"
    },
    {
      "id": "r07pfis1",
      "title": "Parametrização fiscal para recebimento de material",
      "status": "caminho_critico",
      "createdAt": "2026-10-07T12:00:02.000Z",
      "attachments": [],
      "responsible": "Vanusa - VACVE / Tathiane - THAVA",
      "deadline": "2026-10-29"
    }
  ],
  "risks": [
    {
      "id": "hncqjg2c",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Criar travas sistêmicas para evitar consumos de materiais em plantas erradas"
    },
    {
      "id": "sud326le",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Surplus — Planejamento deverá ter total atenção para evitar que ocorra"
    },
    {
      "id": "6xpijs6e",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Risco da reforma tributária — mudar conceito; avaliar cost out efetivo posteriormente"
    },
    {
      "id": "qf5gnb07",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Ativação da demanda de materiais de industrialização para planta de consumo e vice-versa"
    },
    {
      "id": "99az90gu",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Sincronização de parâmetros e configuração entre SAP > Salesforce"
    },
    {
      "id": "y14br66m",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Necessidade de mão de obra adicional para operacionalizar o novo processo"
    },
    {
      "id": "fdylr8qb",
      "comments": [],
      "resolved": true,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Possibilidade de atrelar o mesmo serial em duas plantas distintas (Uso e Consumo e Industrialização)"
    },
    {
      "id": "j7a5scfq",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Ordens precisam ter custo e consumo atrelados — verificar se novo movimento mantém sistemática atual"
    },
    {
      "id": "ol0tfcn8",
      "comments": [],
      "resolved": true,
      "createdAt": "2026-07-09T11:31:47.515Z",
      "description": "Limitação sistêmica ao criar novas plantas de industrialização atreladas ao mesmo SC das plantas de uso e consumo"
    },
    {
      "id": "vvnexts9",
      "comments": [
        {
          "id": "8r9p5kb1",
          "date": "2026-07-23T14:06:44.097Z",
          "text": "Ajustar no endereço"
        },
        {
          "id": "6gp4ake6",
          "date": "2026-08-13T12:47:26.388Z",
          "text": "Endereço ajustado, documento gerado e aprovado por procurement"
        }
      ],
      "resolved": false,
      "createdAt": "2026-07-23T14:06:30.777Z",
      "description": "Fornecedor faturar de maneira incorreta pela falta da planta no cabeçalho da PO - Industrialização/Uso e consumo"
    },
    {
      "id": "0tu7d0oe",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-08-06T13:57:56.965Z",
      "description": "SURPLUS para WH Global - Não é possível, risco de estoque inflado"
    },
    {
      "id": "9gibl435",
      "comments": [
        {
          "id": "8t570qhv",
          "date": "2026-09-17T13:54:29.982Z",
          "text": "Interessante identificar os volumes. Envolver Transporte + Procurement + Fornecedores"
        }
      ],
      "resolved": false,
      "createdAt": "2026-09-17T13:52:31.172Z",
      "description": "Misturar materiais de industrialização + uso e consumo durante entrega"
    },
    {
      "id": "q3kqbmsz",
      "comments": [],
      "resolved": false,
      "createdAt": "2026-10-01T14:05:48.156Z",
      "description": "Risco de chegada de parte do material de Service em Janeiro/2027 - mudança do regime fiscal"
    }
  ],
  "meetings": [
    {
      "id": "9i3r0xgc",
      "date": "2026-07-23",
      "title": "FAQ",
      "attendees": "",
      "followUp": "",
      "createdAt": "2026-10-01T13:50:37.558Z",
      "summary": "1)  Foram criadas novas plantas para Auren ou apenas mudada a parametrização delas para serem utilizadas como plantas de industrialização?\nR: Não foram criadas novas plantas e sim novos MRP's, sem alterar a configuração da planta\n\n2) É possível transferir o custo de uma ordem YM02 uso e consumo (baixa do estoque atual) para uma ordem YM05 industrialização quando \"virar\" o sistema para industrialização?\nR: Possivelmente sem impacto mas confirmar com BADCA\n\n3) Qual o custo atual do estoque? Ele será todo consumido ou parte do material irá voltar via Surplus para 5694?\nR1: Custo do Estoque = R$ 3.261.115,10 (10x Yaw Gears = R$ 1M) - custo incorreto, necessário ajuste por parte de Procurement\nR2: Parte do material será consumido e parte será retornado via Surplus\n\n4) Foi necessária criação de um novo MRP para as plantas Auren?\nR: Sim, foi criado um novo MRP, para as mesmas plantas, com o SL 1030\n\n5) É possível devolver materiais de industrialização para o WH Global?\nR: Global informou que não\n\n6) Se a reforma fiscal confirmar que automaticamente o setup padrão será industrialização, automaticamente o stock da 5694 \"vira\" 5697?\nR: Existem requisitos a serem seguidos antes de permitir tal mudança.\n\n7) Podemos utilizar um material REN no projeto da Auren - VPD?\nNão, já que ele foi adquirido via uso e consumo. A única opção de utilizar esse material é se ele for um item reparado vindo da Auren - 5697.",
      "decisions": "Não será aberto um novo CNPJ para a 5697 devido aos riscos. Decisão tomada após alinhamento entre equipes de TAX, Master Data e Supply Chain (16/07)\nCrédito fiscal será direcionado na sua integridade para a BA já que a compra será via 5697, cadastrado em Simões Filho - BA\n"
    }
  ],
  "history": [
    {
      "id": "rest0001",
      "date": "2026-10-13T19:19:20.426Z",
      "text": "Dados reconstruídos a partir do backup de 06/10 e da ata de 07/10 (histórico anterior e anexos não recuperados)."
    },
    {
      "id": "r07h0003",
      "date": "2026-10-07T12:00:02.000Z",
      "text": "Nova tarefa criada: \"Parametrização fiscal para recebimento de material\" — Vanusa - VACVE / Tathiane - THAVA [Caminho crítico]"
    },
    {
      "id": "r07h0002",
      "date": "2026-10-07T12:00:01.000Z",
      "text": "Nova tarefa criada: \"Teste - Gerar NF em QE2\" — Vanusa - VACVE / Tathiane - THAVA / Brenno - BADCA [A iniciar]"
    },
    {
      "id": "r07h0001",
      "date": "2026-10-07T12:00:00.000Z",
      "text": "Nova tarefa criada: \"Fluxo de Def - NFs de devolução\" — Brenno - BADCA / Vanusa - VACVE [A iniciar]"
    }
  ],
  "responsibles": [
    "André - ANAEL",
    "Arthur - ATRRO",
    "Ayrton - AYOLI",
    "Brenno - BADCA",
    "Bruna - BRBEI",
    "Equipe SF",
    "Karol - KAVLE",
    "Laís - LIGOI",
    "Leonardo - LEMLA",
    "Lucas - LAPSE",
    "Mauro - MUJSA",
    "Nialfe - NAPRO",
    "Tathiane - THAVA",
    "Thaís - TASDE",
    "Vanessa - VADSG",
    "Vanusa - VACVE"
  ],
  "schedule": [
    {
      "id": "sc1",
      "wbs": "1",
      "name": "Iniciação",
      "status": "finalizada",
      "duration": "23 days",
      "isGroup": true
    },
    {
      "id": "sc1_1",
      "wbs": "1.1",
      "name": "Criar TAP",
      "status": "finalizada",
      "duration": "8 days",
      "start": "2025-10-16",
      "finish": "2025-10-23"
    },
    {
      "id": "sc1_2",
      "wbs": "1.2",
      "name": "Definir quais stakeholders e departamentos serão envolvidos",
      "status": "finalizada",
      "duration": "8 days",
      "start": "2025-10-16",
      "finish": "2025-10-23"
    },
    {
      "id": "sc1_3",
      "wbs": "1.3",
      "name": "Criação de cronograma preliminar",
      "status": "finalizada",
      "duration": "15 days",
      "start": "2025-10-24",
      "finish": "2025-11-07"
    },
    {
      "id": "sc2",
      "wbs": "2",
      "name": "Planejamento",
      "status": "finalizada",
      "duration": "50 days",
      "isGroup": true
    },
    {
      "id": "sc2_1",
      "wbs": "2.1",
      "name": "Desenhar mapeamento do processo fiscal atual (“as-is”)",
      "status": "finalizada",
      "duration": "8 days",
      "start": "2025-10-31",
      "finish": "2025-11-07"
    },
    {
      "id": "sc2_2",
      "wbs": "2.2",
      "name": "Desenhar mapeamento do novo processo fiscal requerido (“to-be”)",
      "status": "finalizada",
      "duration": "8 days",
      "start": "2025-10-31",
      "finish": "2025-11-07"
    },
    {
      "id": "sc2_3",
      "wbs": "2.3",
      "name": "Desenhar mapeamento do novo processo logístico requerido (“to-be”)",
      "status": "finalizada",
      "duration": "12 days",
      "start": "2025-11-10",
      "finish": "2025-11-21"
    },
    {
      "id": "sc2_4",
      "wbs": "2.4",
      "name": "Definir quais materiais serão cobertos pelo projeto",
      "status": "finalizada",
      "duration": "10 days",
      "start": "2025-11-24",
      "finish": "2025-12-03"
    },
    {
      "id": "sc2_5",
      "wbs": "2.5",
      "name": "Definir modelo de emissão de Nota Fiscal para novas compras e itens reparados",
      "status": "finalizada",
      "duration": "8 days",
      "start": "2025-10-31",
      "finish": "2025-11-07"
    },
    {
      "id": "sc2_6",
      "wbs": "2.6",
      "name": "Alinhar modelo de emissão de Nota Fiscal de reparo com o cliente",
      "status": "finalizada",
      "duration": "5 days",
      "start": "2025-12-08",
      "finish": "2025-12-12"
    },
    {
      "id": "sc2_7",
      "wbs": "2.7",
      "name": "Alinhar quais atividades farão parte do projeto",
      "status": "finalizada",
      "duration": "8 days",
      "start": "2025-10-31",
      "finish": "2025-11-07"
    },
    {
      "id": "sc2_8",
      "wbs": "2.8",
      "name": "Escolher as plantas que farão parte do projeto",
      "status": "finalizada",
      "duration": "8 days",
      "start": "2025-10-31",
      "finish": "2025-11-07"
    },
    {
      "id": "sc2_9",
      "wbs": "2.9",
      "name": "Definir quantidade de recursos adicionais para controlar a operação após projeto",
      "status": "finalizada",
      "duration": "16 days",
      "start": "2025-12-04",
      "finish": "2025-12-19"
    },
    {
      "id": "sc3",
      "wbs": "3",
      "name": "Execução",
      "status": "em_andamento",
      "duration": "323 days",
      "isGroup": true
    },
    {
      "id": "sc3_1",
      "wbs": "3.1",
      "name": "Parametrizar os sistemas, principalmente SAP",
      "status": "finalizada",
      "duration": "92 days",
      "start": "2026-01-12",
      "finish": "2026-04-13"
    },
    {
      "id": "sc3_2",
      "wbs": "3.2",
      "name": "Criar Plantas/Storage Location para os parques envolvidos nos Estados corretos",
      "status": "finalizada",
      "duration": "92 days",
      "start": "2026-01-12",
      "finish": "2026-04-13"
    },
    {
      "id": "sc3_3",
      "wbs": "3.3",
      "name": "Ajustar parâmetro de Special Procurement key",
      "status": "finalizada",
      "duration": "11 days",
      "start": "2026-04-14",
      "finish": "2026-04-24"
    },
    {
      "id": "sc3_4",
      "wbs": "3.4",
      "name": "Configurar Master Data da nova Planta",
      "status": "finalizada",
      "duration": "11 days",
      "start": "2026-04-14",
      "finish": "2026-04-24"
    },
    {
      "id": "sc3_5",
      "wbs": "3.5",
      "name": "Configurar sistemas fiscais para entrega de obrigações acessórias",
      "status": "finalizada",
      "duration": "19 days",
      "start": "2026-04-27",
      "finish": "2026-05-15"
    },
    {
      "id": "sc3_6",
      "wbs": "3.6",
      "name": "Realizar testes e simulações sistêmicas",
      "status": "em_andamento",
      "duration": "22 days",
      "start": "2026-05-18",
      "finish": "2026-06-08"
    },
    {
      "id": "sc3_7",
      "wbs": "3.7",
      "name": "Criar separação física no Warehouse",
      "status": "em_andamento",
      "duration": "22 days",
      "start": "2026-06-09",
      "finish": "2026-06-30"
    },
    {
      "id": "sc3_8",
      "wbs": "3.8",
      "name": "Treinar stakeholders e departamentos envolvidos",
      "status": "em_andamento",
      "duration": "22 days",
      "start": "2026-06-09",
      "finish": "2026-06-30"
    },
    {
      "id": "sc3_9",
      "wbs": "3.9",
      "name": "Comunicar o novo procedimento aos departamentos e ao cliente",
      "status": "em_andamento",
      "duration": "1 day",
      "start": "2026-07-01",
      "finish": "2026-07-01"
    },
    {
      "id": "sc3_10",
      "wbs": "3.10",
      "name": "Iniciar operação de compra",
      "status": "finalizada",
      "duration": "1 day",
      "start": "2026-07-02",
      "finish": "2026-07-02"
    },
    {
      "id": "sc3_11",
      "wbs": "3.11",
      "name": "Solicitar a primeira compra com o novo procedimento",
      "status": "finalizada",
      "duration": "124 days",
      "start": "2026-07-03",
      "finish": "2026-11-03"
    },
    {
      "id": "sc3_12",
      "wbs": "3.12",
      "name": "Emitir primeira nota fiscal ao cliente",
      "status": "nao_iniciada",
      "duration": "27 days",
      "start": "2026-11-04",
      "finish": "2026-11-30"
    },
    {
      "id": "sc4",
      "wbs": "4",
      "name": "Monitoramento e Controle",
      "status": "em_andamento",
      "duration": "323 days",
      "isGroup": true
    },
    {
      "id": "sc4_1",
      "wbs": "4.1",
      "name": "Monitorar performance dos recursos de controle contratados",
      "status": "em_andamento",
      "duration": "323 days",
      "start": "2026-01-12",
      "finish": "2026-11-30"
    },
    {
      "id": "sc4_2",
      "wbs": "4.2",
      "name": "Monitorar os benefícios fiscais do novo procedimento",
      "status": "em_andamento",
      "duration": "323 days",
      "start": "2026-01-12",
      "finish": "2026-11-30"
    },
    {
      "id": "sc4_3",
      "wbs": "4.3",
      "name": "Fazer reunião de follow up",
      "status": "em_andamento",
      "duration": "323 days",
      "start": "2026-01-12",
      "finish": "2026-11-30"
    },
    {
      "id": "sc4_4",
      "wbs": "4.4",
      "name": "Identificar desvios de Notas Fiscais",
      "status": "em_andamento",
      "duration": "323 days",
      "start": "2026-01-12",
      "finish": "2026-11-30"
    },
    {
      "id": "sc4_5",
      "wbs": "4.5",
      "name": "Monitorar desempenho dos sistemas após parametrização",
      "status": "em_andamento",
      "duration": "323 days",
      "start": "2026-01-12",
      "finish": "2026-11-30"
    },
    {
      "id": "sc5",
      "wbs": "5",
      "name": "Encerramento",
      "status": "em_andamento",
      "duration": "31 days",
      "isGroup": true
    },
    {
      "id": "sc5_1",
      "wbs": "5.1",
      "name": "Avaliar desempenho dos sistemas",
      "status": "em_andamento",
      "duration": "31 days",
      "start": "2026-12-01",
      "finish": "2026-12-31"
    },
    {
      "id": "sc5_2",
      "wbs": "5.2",
      "name": "Identificar lições aprendidas e pontos de melhorias",
      "status": "em_andamento",
      "duration": "31 days",
      "start": "2026-12-01",
      "finish": "2026-12-31"
    },
    {
      "id": "sc5_3",
      "wbs": "5.3",
      "name": "Encerrar projeto",
      "status": "nao_iniciada",
      "duration": "31 days",
      "start": "2026-12-01",
      "finish": "2026-12-31"
    }
  ]
};
