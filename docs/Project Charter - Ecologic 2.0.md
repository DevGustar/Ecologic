### **Project Charter: Plataforma de Inteligência Climática Dinâmica (EcoLogic 2.0)**

| Nome do Projeto: | Plataforma de Inteligência Climática Dinâmica (EcoLogic 2.0) |
| :---- | :---- |
| **Data:** | 28 de Agosto de 2025 |
| **Versão:** | 4.0 |
| **Equipe Responsável:** | Ecologic |

#### **1\. Justificativa (Business Case)**

Eventos climáticos extremos, como enchentes e chuvas intensas, representam um prejuízo sistêmico e recorrente para a economia brasileira, totalizando mais de R$ 215 bilhões em perdas na última década. As soluções atuais de mercado são reativas ou fornecem dados meteorológicos genéricos, falhando em traduzir a previsão do tempo em inteligência de negócio acionável. A oportunidade reside em criar uma plataforma que mova as empresas da **gestão de perdas** para a **gestão proativa de risco**, transformando uma ameaça incontrolável em uma variável gerenciável e gerando um **valor mensurável** através da redução de prejuízos.

#### **2\. Objetivos do Projeto**

Desenvolver um MVP (Mínimo Produto Viável) de uma plataforma SaaS com o objetivo de demonstrar a viabilidade técnica e o valor de negócio da solução, servindo como a principal ferramenta para apresentação a potenciais clientes e parceiros. O MVP deverá:

* **Integrar** a análise de risco estrutural com dados meteorológicos dinâmicos em tempo real.  
* **Calcular** uma "Nota de Risco Dinâmico" para qualquer coordenada geográfica no Brasil.  
* **Disponibilizar** esses dados através de um dashboard web funcional com três módulos essenciais: Mapa Interativo, Análise de Ativo e Alertas Configuráveis.

#### **3\. Escopo Principal (Estratégia "Plataforma-Primeiro")**

**DENTRO DO ESCOPO:**

* **O "Motor" da Plataforma:** Backend para ingestão de dados, algoritmo da "Nota de Risco Dinâmico" e banco de dados.  
* **A "Interface" da Plataforma:** Frontend web com os três módulos essenciais, de forma agnóstica de setor.

**FORA DO ESCOPO (Nesta Fase):**

* Customizações setoriais específicas.  
* Integrações diretas com sistemas de terceiros (ERPs, PDVs).  
* Aplicativo Mobile Nativo.

#### **4\. Partes Interessadas (Stakeholders)**

* **Equipe de Projeto:** O grupo Ecologic, atuando como Donos do Produto e Desenvolvedores.  
* **Parceiro Estratégico:** EY, atuando como um canal consultivo e facilitador de acesso ao mercado.  
* **Clientes Finais Potenciais:** Empresas do portfólio da EY, que participarão de sessões de apresentação e validação.

#### **5\. Dependências e Restrições**

* **Dependência Chave:** O sucesso da validação de mercado do MVP depende da oportunidade de apresentá-lo a um público qualificado.  
* **Premissa:** As APIs de clima selecionadas manterão a disponibilidade e a precisão dos dados.  
* **Restrição:** O desenvolvimento se concentrará na plataforma central, com customizações sendo planejadas apenas após a validação do MVP.

#### **6\. Riscos Iniciais de Alto Nível**

* **Risco de Mercado:** A natureza agnóstica da plataforma pode dificultar a demonstração de valor profundo para um setor específico.  
* **Risco Técnico:** A complexidade de integrar e processar múltiplos feeds de dados geoespaciais em tempo real pode ser maior que a estimada.  
* **Risco de Validação:** O valor percebido pelos potenciais clientes pode não ser suficiente para justificar o engajamento em um projeto-piloto.

#### **7\. Fases do Projeto (Cronograma Orientado por Entregas)**

O projeto será desenvolvido em fases, com o avanço para a fase seguinte ocorrendo após a conclusão satisfatória da anterior.

* **Fase 1: Construção do Backend e Pipeline de Dados.**  
* **Fase 2: Construção do Frontend e Módulos Essenciais.**  
* **Fase 3: Integração e Testes.**  
* **Fase 4: Validação de Mercado.**

#### **8\. Arquitetura e Diretrizes Tecnológicas**

A plataforma será construída sobre princípios de arquitetura modernos, priorizando a escalabilidade e a performance, utilizando um backend de alta performance, um banco de dados com suporte geoespacial e um frontend moderno para uma SPA (Single-Page Application).

#### **9\. Abordagem de Segurança para o MVP**

A segurança é um pilar de design inegociável, com a implementação de Controle de Acesso Baseado em Funções (RBAC), política de senhas fortes com hashing, criptografia de dados em trânsito (TLS) e em repouso, e uma rotina de backups diários.

#### **10\. Modelo de Negócio e Estratégia de Mercado (Go-to-Market)**

* **Objetivo do MVP:** O propósito primário do MVP é servir como uma **Prova de Conceito (PoC)** robusta. Ele é uma ferramenta para iniciar conversas estratégicas, demonstrar a capacidade técnica da equipe e o valor potencial da solução, com o objetivo de **validar o interesse do mercado e identificar um parceiro para um projeto-piloto**.  
* **Estratégia de Monetização (Visão de Produto):** A visão de longo prazo é um modelo **SaaS (Software as a Service) B2B**, estruturado em pacotes de serviço para atender a diferentes perfis de clientes e orçamentos. A estratégia de pacotes permite um caminho de crescimento claro para os clientes e para a receita da plataforma.  
  * **Plano Essencial:** Focado em pequenos negócios, oferecendo monitoramento de um número limitado de ativos e alertas básicos. O objetivo é ser a porta de entrada, resolvendo a dor mais imediata com um custo acessível.  
  * **Plano Profissional:** Direcionado a médias empresas, com um número maior de ativos, múltiplos usuários e a inclusão de **módulos de relatórios analíticos e histórico de dados**. O valor aqui é a otimização de operações e o ROI mensurável.  
  * **Plano Enterprise:** Desenhado para grandes corporações e clientes governamentais, oferecendo monitoramento ilimitado, suporte dedicado e, crucialmente, **acesso à API da plataforma** para integração com os sistemas internos do cliente (ERPs, plataformas de risco, etc.).  
* **Estratégia de Rollout:** O plano é iterativo: 1\. **Construir** o MVP \-\> 2\. **Validar** com o mercado através da parceria com a EY \-\> 3\. **Aprender** com o feedback \-\> 4\. **Direcionar** os próximos passos, que podem ser um projeto-piloto remunerado, um projeto de co-desenvolvimento ou o licenciamento da tecnologia.