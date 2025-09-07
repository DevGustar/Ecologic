# 🗺️ **Roadmap de Evolução do Ecologic**

Com o MVP (Produto Mínimo Viável) funcional estabelecido, o roadmap do Ecologic foca-se em aprofundar a precisão da análise de risco e expandir as funcionalidades de inteligência acionável, transformando a plataforma num verdadeiro consultor de risco digital.

---

## **Versão 2.1: Análise Hiperlocal e Contexto Aprimorado**

O foco desta fase é aumentar a granularidade e o contexto da análise de risco.

### 1. Análise de Risco Hiperlocal por Raio

* **Conceito:** Em vez de associar um ativo ao risco geral do município, o sistema calculará o risco numa área específica (ex: um raio de 5km) em redor das coordenadas exatas do ativo.
* **Valor:** Aumenta drasticamente a precisão da análise, tornando-a relevante para ativos específicos como uma única fábrica ou fazenda, em vez de depender da média do município.

> **Abordagem Técnica:**
> * **Backend:** A API de `risk_analysis` seria aprimorada para aceitar um parâmetro de `raio`. Ela buscaria dados geoespaciais (rios, relevo) apenas dentro desse raio para um cálculo mais preciso.
> * **Frontend:** Na página de detalhes, o mapa focado exibiria visualmente este raio, talvez como um círculo semitransparente.

### 2. Camadas de Dados Adicionais (Rios e Relevo)

* **Conceito:** Permitir que o utilizador sobreponha diferentes camadas de dados no mapa para uma análise visual mais rica, recuperando o poder do Ecologic 1.0.
* **Valor:** Oferece um contexto visual poderoso, permitindo que o utilizador entenda *porquê* o risco de uma área é alto (ex: "o meu ativo está perto de um grande rio e numa zona de baixo relevo").

> **Abordagem Técnica:**
> * **Backend:** Criar novos endpoints (ex: `GET /layers/rivers`) que retornem dados GeoJSON otimizados.
> * **Frontend:** Adicionar um controlo de camadas no mapa (um menu com checkboxes) para ligar e desligar a visualização de rios, áreas de declive, etc.

### 3. Gráficos de Histórico de Risco

* **Conceito:** Na página de detalhes do ativo, além da previsão futura, mostrar um gráfico com a evolução da nota de risco nos últimos 7, 30 ou 90 dias.
* **Valor:** Permite a identificação de tendências sazonais ou de longo prazo, crucial para o planeamento estratégico.

> **Abordagem Técnica:**
> * **Backend:** Criar uma nova rota (`GET /assets/{uuid}/history`) que consulta o banco de dados (que precisaria de guardar snapshots diários do risco) e retorna os dados históricos.
> * **Frontend:** Adicionar uma nova "aba" de filtro na página de detalhes para "Histórico", que renderizaria um novo componente de gráfico.

---

## **Versão 2.2: Monitorização Proativa**

Esta fase transforma o Ecologic de uma ferramenta de análise para uma ferramenta de monitorização ativa.

### 4. Sistema de Alertas e Notificações Configuráveis

* **Conceito:** Permitir que o utilizador defina um "limiar de risco" personalizado para cada ativo (ex: "avise-me por email se a nota de risco da 'Fábrica de Campinas' passar de 7.0").
* **Valor:** Transforma a plataforma de reativa para **proativa**, notificando os utilizadores sobre potenciais ameaças antes que elas se tornem críticas.

> **Abordagem Técnica:**
> * **Backend:** Desenvolver um serviço agendado (ex: Celery, APScheduler) que, periodicamente, verifica o risco de todos os ativos e dispara notificações (ex: via SendGrid para emails) se um limiar for ultrapassado.
> * **Frontend:** Criar uma interface na página de detalhes para o utilizador configurar este limiar.

---

## **A Próxima Fronteira: O Motor Preditivo com IA**

Esta é a evolução de longo prazo que posicionará o Ecologic como líder de mercado.

### 5. Análise Preditiva e Prescritiva com Inteligência Artificial

* **Conceito:** Ir além da previsão (o que *vai* acontecer) e entrar na **prescrição** (o que o utilizador *deve fazer* a respeito). Utilizar modelos de Machine Learning para gerar relatórios automatizados e recomendações de mitigação.
* **Exemplo de Relatório de IA:**
    > *"Com base na tendência de chuva para os próximos dias e na elevação do seu ativo 'Fábrica de Campinas', o nosso modelo prevê um aumento de 40% no risco de alagamento a partir de terça-feira. **Recomendações:** 1. Verificar os sistemas de drenagem. 2. Considerar a movimentação de stock do armazém inferior."*
* **Valor:** Transforma o Ecologic de uma ferramenta de dados num **consultor de risco digital**, a entregar inteligência de alto valor e recomendações práticas que otimizam operações.

> **Abordagem Técnica:**
> * **Backend:** Desenvolver um serviço que utiliza modelos de ML (ex: RandomForest, LSTM para séries temporais) treinados com dados históricos. A geração do relatório em linguagem natural pode ser feita com a ajuda de um LLM (como o GPT) alimentado com os resultados do modelo.