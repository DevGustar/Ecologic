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

A **EcoLogic 2.0** eleva este conceito a uma **aplicação web completa (SaaS)**. A nova plataforma integra a análise de risco estrutural com dados meteorológicos dinâmicos em tempo real para calcular uma **"Nota de Risco Dinâmico"**, fornecendo insights e alertas acionáveis para diversos setores da economia.

## 🎯 **Objetivos**
- **Construir um "Motor de Risco":** Desenvolver um backend robusto capaz de ingerir dados de múltiplas APIs e calcular uma nota de risco proprietária em tempo real.
- **Visualização Intuitiva:** Criar um frontend interativo com um mapa dinâmico que traduza dados complexos numa visão clara do risco.
- **Entregar Inteligência Acionável:** Fornecer alertas e análises que permitam a tomada de decisão antecipada, mitigando perdas financeiras e operacionais.
- **Validar o Modelo de Negócio:** Apresentar um MVP funcional a parceiros estratégicos e clientes para validar o valor da solução.

## 🚀 **Funcionalidades do MVP Entregue**
- **Dashboard Interativo:** Uma interface principal com um mapa cloroplético do Brasil, exibindo uma nota de risco estática por município e a localização de todos os ativos da empresa.
- **KPIs Dinâmicos:** Painel de indicadores (Risk Score, Alertas Críticos, Zonas em Atenção) que se atualiza dinamicamente para refletir o risco agregado, seja em âmbito nacional ou focado apenas nos ativos do utilizador.
- **Gestão de Ativos:** Funcionalidade completa para criar novos ativos (com nome e coordenadas), com comunicação direta com o backend e persistência em banco de dados.
- **Centro de Análise Detalhada:** Uma página dedicada para cada ativo, acessível através do mapa, que oferece:
    - **Análise de Risco em Tempo Real:** Chamada de API que busca e exibe a nota de risco atualizada e a previsão do tempo detalhada.
    - **Gráfico de Tendência:** Visualização da previsão de risco para os próximos dias, permitindo a análise de tendências.
    - **Mapa Focado:** Um mapa de localização que destaca o ativo no seu contexto geográfico imediato.

## 🛠️ **Tecnologias**
| Área          | Tecnologia Utilizada |
| :------------ | :------------------- |
| **Backend** | Python, FastAPI, SQLAlchemy, Pandas |
| **Frontend** | React (com Vite), Leaflet, CSS Modules |
| **Base de Dados**| SQLite (para o MVP) |

## 📁 **Estrutura do Projeto (Monorepo)**
```
EcoLogic/
├── 📁 docs/                   # Documentação Estratégica
│   ├── Project_Charter.md    # Documento de fundação e objetivos.
│   └── ROADMAP.md            # Visão de futuro e próximas funcionalidades.
│
├── 📁 src/                    # Código-Fonte da Aplicação
│   ├── backend/              # Projeto do Backend (Python, FastAPI).
│   └── frontend/             # Projeto do Frontend (React, Vite).
│
├── .gitignore                # Ficheiro para ignorar ficheiros e pastas.
└── README.md                 # Descrição principal do projeto (este ficheiro).
```

---

## 🚀 **Como Começar (Ambiente de Desenvolvimento)**
Siga os passos abaixo para configurar e executar o projeto. Você precisará de **dois terminais abertos simultaneamente**.

### 1. Configurando o Backend (Terminal 1)
```bash
# Navegue para a pasta do backend
cd src/backend

# Crie e ative o ambiente virtual
# No Windows:
py -m venv venv
.\venv\Scripts\activate
# No macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
uvicorn main:app --reload
```
O backend estará a rodar em `http://127.0.0.1:8000`.

### 2. Configurando o Frontend (Terminal 2)
```bash
# Navegue para a pasta do frontend
cd src/frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```
O frontend estará a rodar em `http://localhost:5173`.

---

## 👨‍💻 **Equipa e Contribuições**

### Papéis e Contribuições
Este projeto foi desenvolvido com as seguintes responsabilidades principais:

* **Anderson Fernandez:**
    * **Gestão de Produto e Estratégia:** Idealização e autoria do Project Charter, definição do escopo do MVP e do roadmap de futuras implementações.
    * **Desenvolvimento Backend:** Arquitetura e implementação da API em FastAPI, incluindo os endpoints de CRUD de ativos, a lógica de análise de risco e a integração com a base de dados.
    * **Desenvolvimento Frontend:** Construção completa da interface do utilizador em React, incluindo o dashboard principal, o mapa interativo, a página de análise detalhada e todos os componentes visuais.
    * **Design de UX/UI:** Definição da experiência do utilizador, layout das páginas e identidade visual da aplicação.

* **Dandara, Enzo, Gabriel, Gustavo, Nathan:**
    * Participação na fase de ideação inicial do projeto e suporte consultivo.

|           Nome           |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    Perfil                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| :------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| Anderson             | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anderson-fernandez-2aa13924b/)                                                                                                                                                                                                                                                                                                                              |
| Dandara              | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dandaramonike/)                                                                                                                                                                                                                                                                                                                                              |
| Enzo                 | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/enzohenrique777/)                                                                                                                                                                                                                                                                                                                                            |
| Gabriel              | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gabriel-pires-2082b473/)                                                                                                                                                                                                                                                                                                                                      |
| Gustavo              | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gustavo-roberto-0aa488288/)                                                                                                                                                                                                                                                                                                                                    |
| Nathan               | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nathan-leandro-8bb064208/)                                                                                                                                                                                                                                                                                                                                      |

## 👨‍🏫 **Orientador**
- [`Dr. Victor Rosetti de Quiroz`](https://www.linkedin.com/in/victorbarq/?originalSubdomain=br)

## 🙏 **Agradecimento**
Muito obrigado por acompanhar o nosso projeto! Esperamos que esta iniciativa contribua para criar soluções resilientes e inovadoras para os desafios climáticos do Brasil.

Feito com ❤️,<br>
**Equipa EcoLogic**