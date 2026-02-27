const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Banco de Dados
const DATA_FILE = path.join(__dirname, 'db.json');

// Garante que o arquivo JSON existe ao iniciar
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Rota para servir a página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Rota para buscar os dados do JSON (API)
app.get('/api/desejos', (req, res) => {
    const dados = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(dados);
});

// Rota para salvar novo item no JSON
app.post('/adicionar', (req, res) => {
    const { item, preco } = req.body;
    
    // 1. LER o arquivo atual
    const dados = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // 2. ADICIONAR o novo objeto
    const novoItem = { id: Date.now(), item, preco: parseFloat(preco) };
    dados.push(novoItem);
    
    // 3. SALVAR de volta no arquivo
    fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
    
    res.redirect('/'); // Recarrega a página para mostrar a lista atualizada
});

app.get('/enviar', (req, res) => {
  res.send(`
    <form action="/contato" method="POST">
      <input type="text" name="email" placeholder="Seu Email">
      <textarea name="mensagem" placeholder="Sua mensagem"></textarea>
      <button type="submit">Enviar</button>
    </form>
  `);
});

app.post('/contato', (req, res) => {
  const { email, mensagem } = req.body;

  if (!email || !mensagem) {
    return res.status(400).send('<h1>Erro: Preencha todos os campos!</h1>');
  }

  console.log(`Novo contato: ${email} disse: ${mensagem}`);
  res.send(`<h1>Obrigado, ${email}! Recebemos sua mensagem.</h1>`);
});

// Middlewares para aceitar JSON e dados de Formulários (importante!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para mostrar o formulário no navegador
app.get('/comprar', (req, res) => {
    res.send(`
        <h2>Registrar Nova Compra</h2>
        <form action="/registrar-compra" method="POST">
            <input type="text" name="produto" placeholder="Nome do Produto" required><br><br>
            <input type="number" name="preco" placeholder="Preço (ex: 50)" required><br><br>
            <button type="submit">Salvar no Log</button>
        </form>
        <p><a href="/ver-logs">Ver logs gravados</a></p>
    `);
});

// Rota POST que realmente salva o arquivo
app.post('/registrar-compra', (req, res) => {
    const { produto, preco } = req.body;
    
    // Validação simples
    if (!produto || !preco) {
        return res.status(400).send('Erro: Faltam dados do produto.');
    }

    const dataHora = new Date().toLocaleString('pt-BR');
    const linhaLog = `[${dataHora}] Produto: ${produto} | Preço: R$ ${preco}\n`;

    // fs.appendFile cria o arquivo se ele não existir e adiciona a linha no final
    fs.appendFile(path.join(__dirname, 'compras.log'), linhaLog, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao gravar no arquivo.');
        }
        
        console.log(`✅ Log salvo: ${produto}`);
        res.send(`<h3>Sucesso!</h3><p>${produto} foi registrado.</p><a href="/">Voltar</a>`);
    });
});

// Rota extra para ler os logs direto no navegador
app.get('/ver-logs', (req, res) => {
    if (!fs.existsSync('compras.log')) return res.send('Nenhum log encontrado.');
    const conteudo = fs.readFileSync('compras.log', 'utf-8');
    res.send(`<pre>${conteudo}</pre><a href="/">Voltar</a>`);
});


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
});


//  Rotas:
//
//  /enviar  
//  /comprar
//  /ver-logs
//  /registrar-compra
//  /contato