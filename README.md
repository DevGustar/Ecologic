# 🎓 **Fundação Escola de Comércio Álvares Penteado (FECAP)**

<p align="center">
  <a href="https://www.fecap.br/">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP" />
  </a>
</p>

# 🟡 **Ernst & Young (EY)**

<p align="center">
  <a href="https://www.ey.com/pt_br/about-us">
    <img src="https://tse1.mm.bing.net/th/id/OIP.bc36gRicjZbcvILUXv-uMAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="EY" width="225"/>
  </a>
</p>

# 🧠 **Projeto: Plataforma de Inteligência Climática Dinâmica (EcoLogic 2.0)**

### Transformando Risco Climático em Inteligência Acionável.

---

## 📝 **Descrição do Projeto**

O Brasil enfrenta perdas anuais de mais de R$ 200 bilhões devido a eventos climáticos extremos. A EcoLogic 2.0 é uma **plataforma de inteligência climática** projetada para mover empresas da gestão reativa de perdas para a **gestão proativa de risco**.

Este projeto representa a evolução do **EcoLogic 1.0**, um sofisticado painel de Business Intelligence em Power BI que validou a nossa capacidade de transformar dados públicos da ANA (Agência Nacional de Águas) num modelo proprietário de "Nota de Risco" para inundações.

A **EcoLogic 2.0** eleva este conceito a uma **aplicação web completa (SaaS)**. A nova plataforma integra a análise de risco estrutural (relevo, proximidade de rios, uso do solo) com dados meteorológicos dinâmicos em tempo real (chuva, vento, pressão) para calcular uma **"Nota de Risco Dinâmico"**, fornecendo insights e alertas acionáveis para diversos setores da economia.

## 🎯 **Objetivos**

- **Construir um "Motor de Risco":** Desenvolver um backend robusto capaz de ingerir dados de múltiplas APIs e calcular uma nota de risco proprietária em tempo real.
- **Visualização Intuitiva:** Criar um frontend interativo com um mapa dinâmico que traduza dados complexos numa visão clara do risco.
- **Entregar Inteligência Acionável:** Fornecer alertas e análises que permitam a tomada de decisão antecipada, mitigando perdas financeiras e operacionais.
- **Validar o Modelo de Negócio:** Apresentar um MVP funcional a parceiros estratégicos e clientes para validar o valor da solução e definir os próximos passos para um projeto-piloto.

## 🚀 **Funcionalidades do MVP**

- **API de Risco:** Um backend FastAPI que serve os dados processados.
- **"Sandbox" de Risco Dinâmico:** Uma ferramenta interativa no dashboard que permite ao utilizador criar um "ativo" em qualquer ponto do mapa e receber uma análise de risco instantânea.
- **Mapa de Risco em Camadas:** Visualização geoespacial com sobreposição de dados de risco, ativos do cliente e radar meteorológico em tempo real.
- **Alertas Configuráveis:** Sistema que permite ao utilizador definir limiares de risco para receber notificações.

## 👥 **Público-Alvo Estratégico**

A plataforma é agnóstica de setor, mas o foco inicial de validação será em mercados de alto impacto:
- **Logística e Cadeia de Suprimentos**
- **Seguros (Subscrição e Sinistros)**
- **Retalho e Bens de Consumo**
- **Agronegócio**
- **Gestão Pública e Defesa Civil**

## 🛠️ **Tecnologias**

| Área | Tecnologia Proposta |
| :--- | :--- |
| **Backend** | Python, FastAPI, Pandas, GeoPandas |
| **Frontend**| React (com Vite), Leaflet / Mapbox |
| **Base de Dados**| PostgreSQL com PostGIS |
| **Análise Inicial**| Power BI |

---

## 👨‍💻 **Equipa:** `EcoLogic`

|         Nome         |                                                                                                                                                                                                                                             Perfil                                                                                                                                                                                                                                              |
| :------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| Anderson             | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anderson-fernandez-2aa13924b/)                                                                                                                                                                                                                                      |
| Dandara              | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dandaramonike/)                                                                                                                                                                                                                                                        |
| Enzo                 | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/enzohenrique777/)                                                                                                                                                                                                                                                        |
| Gabriel              | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gabriel-pires-2082b473/)                                                                                                                                                                                                                                                    |
| Gustavo              | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gustavo-roberto-0aa488288/)                                                                                                                                                                                                                                            |
| Nathan               | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nathan-leandro-8bb064208/)                                                                                                                                                                                                                                                |

## 👨‍🏫 **Orientador**

- [`Dr. Victor Rosetti de Quiroz`](https://www.linkedin.com/in/victorbarq/?originalSubdomain=br)

## 📁 **Estrutura do Projeto (Monorepo)**

A EcoLogic 2.0 é desenvolvida usando uma arquitetura de Monorepo, que organiza o código-fonte e a documentação num único repositório para uma gestão simplificada e consistente.

## 📁 **Estrutura do Projeto**

```
EcoLogic/
├── 📁 docs/               # Documentação Estratégica do Projeto
│   ├── Project_Charter.md  # O documento de fundação e objetivos do projeto.
│   └── research/           # Dossiês de pesquisa de mercado e impacto.
│
├── 📁 src/                # Código-Fonte da Aplicação ("Source")
│   ├── backend/            # Projeto do Backend (Python, FastAPI). O "cérebro".
│   └── frontend/           # Projeto do Frontend (React, Vite). O "rosto".
│
├── .gitignore              # Ficheiro para ignorar ficheiros e pastas desnecessários.
└── README.md               # Descrição principal do projeto (este ficheiro).
```

## 🚀 **Como Começar (Ambiente de Desenvolvimento)**

### Backend

1.  Navegue até à pasta do backend: `cd src/backend`
2.  Crie e ative o ambiente virtual:
    ```bash
    py -m venv venv
    .\venv\Scripts\activate
    ```
3.  Instale as dependências: `pip install -r requirements.txt`
4.  Inicie o servidor: `uvicorn main:app --reload`
5.  O backend estará a rodar em `http://127.0.0.1:8000`.

### Frontend

1.  Navegue até à pasta do frontend: `cd src/frontend`
2.  Instale as dependências: `npm install`
3.  Inicie o servidor de desenvolvimento: `npm run dev`
4.  O frontend estará a rodar em `http://localhost:5173`.

## 📚 **Referências**

>- [ANA (Agência Nacional de Águas)](https://dadosabertos.ana.gov.br/)
>- [OpenWeatherMap API](https://openweathermap.org/api)
>- [Open-Meteo API](https://open-meteo.com/)
>- [MapBiomas](https://mapbiomas.org/)

## 🙏 **Agradecimento**

Muito obrigado por acompanhar o nosso projeto! Esperamos que esta iniciativa contribua para criar soluções resilientes e inovadoras para os desafios climáticos do Brasil.

Feito com ❤️,<br>
**Equipa EcoLogic**