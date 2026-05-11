import express from "express";
import { ask } from "./load.js";
import { callAgent } from "./agent.js";


const app = express();

app.use(express.json());
app.use(express.static("public"));

app.get("/api/test", async (req, res) => {
    const result = await ask("Hoe krijg ik Gevorderd volgens de Evaluatiecriteria?") ;
    res.json(result);
});

app.post('/api/chat', async (req, res) => {
    const { prompt, userid } = req.body;
    console.log(`User asked for: ${prompt}`);
    // const response = await ask(prompt);
    const response = await callAgent(prompt, userid);
    console.log("Agent answer:", response.message);
    console.log("Tools used:", response.toolsUsed);
    res.json({
        answer: response.message,
        relevantDocs: [],
        toolsUsed: response.toolsUsed
    });
    // res.json(response);
});


app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});