
import express from "express";

const app = express();
app.use(express.json());

app.post("/parse", (req, res) => {
  const input = req.body;
  let texto = "";

  if (input.transcricao) {
    texto = input.transcricao.toLowerCase();
  } else if (input.text) {
    texto = input.text.toLowerCase();
  } else {
    return res.status(400).json({ error: "Nenhum campo 'transcricao' ou 'text' encontrado." });
  }

  const user_id = input.user_id || "usuario@desconhecido.com";

  const aproximados = {
    "meia hora": 30,
    "meio hora": 30,
    "uma hora": 60,
    "umas duas horas": 120,
    "duas horas": 120,
    "três horas": 180,
    "quarenta e cinco minutos": 45,
    "vinte minutos": 20
  };

  const mapaTarefas = {
    "relatório": "relatório",
    "reunião": "reunião",
    "petição": "petição",
    "revisão": "revisão",
    "consulta": "consulta",
    "contrato": "contrato",
    "análise": "análise",
    "alinhamento": "alinhamento",
    "ligação": "ligação",
    "email": "email",
    "memorial": "memorial",
    "despacho": "despacho",
    "protocolo": "protocolo",
    "audiência": "audiência",
    "pesquisa jurisprudencial": "pesquisa jurisprudencial"
  };

  function minutosParaHHMMSS(minutos) {
    const h = Math.floor(minutos / 60).toString().padStart(2, '0');
    const m = Math.floor(minutos % 60).toString().padStart(2, '0');
    return `${h}:${m}:00`;
  }

  const frases = texto.split(/(?:\.|\n|\s+e\s+)/).map(f => f.trim()).filter(f => f.length > 10);

  const dataRegex = /(?:dia\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/;
  const dataMatch = texto.match(dataRegex);

  let data_inicio;
  if (dataMatch) {
    data_inicio = dataMatch[1];
  } else {
    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, '0');
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const yyyy = hoje.getFullYear();
    data_inicio = `${dd}/${mm}/${yyyy}`;
  }

  const tarefas = [];

  for (const frase of frases) {
    const clienteMatch = frase.match(/(?:cliente\s+)([a-z0-9\s\-&]+)/);
    const cliente = clienteMatch ? clienteMatch[1].trim() : "não identificado";

    let tempoMin = null;
    const tempoExplicito = frase.match(/(\d+)\s*(minutos|min|hora|h)/);
    if (tempoExplicito) {
      const valor = parseInt(tempoExplicito[1]);
      const unidade = tempoExplicito[2];
      tempoMin = unidade.startsWith('h') ? valor * 60 : valor;
    } else {
      for (const chave in aproximados) {
        if (frase.includes(chave)) {
          tempoMin = aproximados[chave];
          break;
        }
      }
    }

    const tempo = tempoMin ? minutosParaHHMMSS(tempoMin) : "00:00:00";

    let tarefa = "não identificada";
    for (const chave in mapaTarefas) {
      if (frase.includes(chave)) {
        tarefa = mapaTarefas[chave];
        break;
      }
    }

    tarefas.push({
      user_id,
      cliente,
      tarefa,
      tempo,
      data_inicio,
      transcricao: frase
    });
  }

  return res.json(tarefas);
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000/parse");
});
