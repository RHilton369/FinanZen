# 📦 Empacotamento do FinanZen (Standalone)

Transformar o FinanZen em um executável limpo para Windows (um "Instalador") exige que isolemos o ambiente e removamos arquivos desnecessários (como pastas gigantescas `node_modules` de desenvolvimento) para criar um instalador leve e profissional.

Utilizaremos a estratégia do **Next.js Standalone** + **Inno Setup**.

---

## 🚀 Passo a Passo para Gerar o `Instalador_FinanZen.exe`

### Passo 1: Instalar o Inno Setup
Para compilar nosso script de instalação, você precisa do **Inno Setup**.
1. Acesse o site oficial: [jrsoftware.org/isinfo.php](https://jrsoftware.org/isinfo.php)
2. Baixe e instale a versão mais recente do "Inno Setup Compiler".

### Passo 2: Otimizar o Frontend (Next.js Standalone)
Já configurei o arquivo `next.config.ts` no frontend com a opção `output: 'standalone'`. Isso faz com que o Next.js agrupe apenas os arquivos estritamente necessários para rodar a aplicação em produção.
1. Já realizamos o comando no seu ambiente, mas se houver futuras mudanças, sempre rode:
   ```bash
   cd frontend
   npm run build
   ```
2. Após o build, a pasta `frontend/.next/standalone` conterá o servidor minimalista pronto para rodar.

### Passo 3: Limpar o Backend (Opcional, mas recomendado)
Para evitar que o instalador fique muito pesado, você pode deletar a pasta `node_modules` do backend e rodar apenas `npm install --omit=dev` para instalar apenas as dependências de produção.
*Como no momento dependemos do Prisma e do Fastify, certifique-se de que o Prisma Client foi gerado (`npx prisma generate`).*

### Passo 4: Compilar o Executável
1. Abra o **Inno Setup Compiler**.
2. Clique em **File > Open** e selecione o arquivo **`setup.iss`** que está na raiz da pasta `FinanZen`.
3. Clique no botão verde de **Run / Compile** (ou pressione `Ctrl+F9`).
4. O Inno Setup irá varrer as pastas do frontend `standalone`, do backend e os scripts VBS. 
5. Em alguns minutos, ele gerará uma pasta chamada `Output` com o arquivo `Instalador_FinanZen.exe`.

### Passo 5: Distribuir e Instalar
- Agora você tem um único arquivo `.exe`! 
- Ao enviar para o computador do cliente/empresa, basta rodar o instalador. Ele colocará o sistema em `C:\Program Files\FinanZen`, criará o atalho na Área de Trabalho com o seu Ícone, e utilizará o nosso silencioso `FinanZen.vbs` para subir os servidores automaticamente em segundo plano quando o usuário clicar!

---
*Dica de Cloud: Se você preferir hospedar o sistema na nuvem em vez de um ".exe" local no futuro (Supabase + Vercel), a estratégia do `standalone` que ativamos hoje também é exigida para subir a aplicação em contêineres Docker profissionais!*
