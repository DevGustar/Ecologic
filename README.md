# 🎓 FECAP - Fundação Escola de Comércio Álvares Penteado

<p align="center">
  <a href="https://www.fecap.br/">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP" />
  </a>
</p>

# 🟡  EY   - Ernst & Young

<p align="center">
  <a href="https://www.ey.com/pt_br/about-us">
    <img src="https://www.ey.com/content/dam/content-fragments/ey-unified-site/ey-com/people/local/pt_br/images/a/ey-logo.png" alt="EY" />
  </a>
</p>

## 🧠 Projeto

### **Dashboard interativo para mitigação de impacto de inundações e, se possível, secas nas cidades e no agronegócio.**

## 👨‍💻 Equipe: `EcoLogic`

|        Nome          |                          Perfil                                                                                                                                          |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Anderson             | [LinkedIn](https://www.linkedin.com/in/anderson-fernandez-2aa13924b/)                                                                                                    |
| Dandara              | [LinkedIn](https://www.linkedin.com/in/dandaramonike/)                                                                                                                   |
| Enzo                 | [LinkedIn](https://www.linkedin.com/in/enzohenrique777/)                                                                                                                 |
| Gabriel              | [LinkedIn](https://www.linkedin.com/in/gabriel-pires-2082b473/)                                                                                                          |
| Gustavo              | [LinkedIn](https://www.linkedin.com/in/gustavo-roberto-0aa488288/)                                                                                                       |
| Nathan               | [LinkedIn](https://www.linkedin.com/in/nathan-leandro-8bb064208/)                                                                                                        |

## 👨‍🏫 Orientadores

- [`Dr. Eduardo Savino Gomes`](https://www.linkedin.com/in/eduardo-savino-gomes-77833a10/)
- [`Me. Francisco de Souza Escobar`](https://www.linkedin.com/in/francisco-escobar/)
- [`Me. Aimar Martins Lopes`](https://www.linkedin.com/in/aimarlopes/)
- [`Dr. Jose Carlos Buesso Junior`](https://www.linkedin.com/in/jbuesso/)
- [`Dr. Victor Rosetti de Quiroz`](https://www.linkedin.com/in/victorbarq/?originalSubdomain=br)

## 📝 Descrição do Projeto

O **Instituto Criativo** enfrenta dificuldades na gestão de seus projetos educacionais devido à descentralização de informações, dificultando o monitoramento do progresso e a tomada de decisões.

Para resolver esse problema, desenvolvemos uma aplicação completa com dashboard interativo e funcionalidades como:

- Gestão e visualização de eventos com compra de ingressos
- Registro de doações
- Acompanhamento de projetos educacionais
- Relatórios e indicadores de desempenho (KPIs)
- Interface intuitiva e responsiva
- Integração com redes sociais (futuramente)

> 🧰 Tecnologias utilizadas:
> - Backend: `Express + JavaScript`
> - Frontend: `React`
> - Banco de Dados: `MySQL`

<p align="center">
  <img src="/code/client/src/pages/Homepage/interacao_descontraida.jpg" alt="Interação entre pessoas" width="1000px">
</p>

## 📁 Estrutura do Projeto

```
instituto-criativo/
├── backend/
│   ├── Controllers/
│   ├── DTOs/
│   ├── Models/
│   ├── Services/
│   ├── Repositories/
│   │   └── Implementations/
│   ├── Data/
│   ├── Helpers/
│   ├── Middleware/
│   ├── Migrations/
│   ├── appsettings.json
│   ├── Program.cs
│   ├── Startup.cs
│   └── InstitutoCriativoAPI.csproj
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/images/
│   │   ├── components/{events, donations, dashboard, common, auth}
│   │   ├── pages/{Home, Events, Dashboard, Login, Register, Donations, NotFound}.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   ├── InstitutoCriativo_ER_Diagram.png
│   └── InstitutoCriativo_DB_Script.sql
│
├── docs/
│   └── Desenvolvimento do Sistema Web para o Instituto Criativo.pdf
│
├── .gitignore
└── README.md
```

## 🗓️ Cronograma de Desenvolvimento

| Semana | Atividade                                   | Responsável               |
|--------|---------------------------------------------|---------------------------|
| 1      | Documento de abertura do projeto            | Todos                     |
| 1      | Wireframe navegável (Figma)                 | Eriane                    |
| 2      | Estrutura de Dados / POO                    | Lucas, Gustavo H.         |
| 2      | Desenvolvimento Web FullStack               | Gustavo R.                |
| 3      | Setup do backend + integração com frontend  | Gustavo R.                |
| 3–7    | Funcionalidades avançadas                   | Toda a equipe             |
| 1–7    | Melhorias, testes e documentação            | Toda a equipe             |
| 7      | Apresentação e entrega final                | Toda a equipe             |

## 👥 Tabela de Funções

| Membro           | Função Principal      | Atividades Secundárias                                      |
|------------------|-----------------------|-------------------------------------------------------------|
| Eriane           | Designer UX/UI        | Codificação, responsividade e testes de usabilidade         |
| Gustavo R.       | Dev Full Stack        | API, funcionalidades e integração frontend/backend          |
| Gustavo H.       | Estrutura de Dados    | Apoio backend, testes, documentação                         |
| Lucas            | Estrutura de Dados    | Arquitetura, otimizações e infraestrutura                   |
| Todos            | Colaboração Geral     | Comunicação, testes, revisão e ajustes finais               |

## ⚙️ Como Executar o Projeto

### 🔧 Pré-requisitos
- [Visual Studio Code](https://code.visualstudio.com/)
- [GitHub Desktop](https://desktop.github.com/)
- [.NET SDK](https://dotnet.microsoft.com/en-us/download)
- [Node.js + npm](https://nodejs.org/)
- MySQL Server + MySQL Workbench

### 🚀 Passos

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/2025-1-NADS2/Projeto1
   ```

2. **Backend (.NET)**
   ```bash
   cd instituto-criativo/backend
   dotnet restore
   dotnet ef database update  # aplica as migrations
   dotnet run
   ```

3. **Frontend (React)**
   ```bash
   cd instituto-criativo/frontend
   npm install
   npm run dev
   ```

## 📚 Referências

- [Site do Instituto Criativo](https://institutocriativo.com.br/)
- [Favicon Instituto Criativo](https://www.institutocriativo.com.br/images/favicon.png)

## 🙏 Agradecimento

Muito obrigado por acompanhar nosso projeto!  
Esperamos que esta iniciativa contribua para transformar positivamente a gestão educacional da ONG 💡

Feito com ❤ por **TechTeam**
