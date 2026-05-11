import { AzureChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { retrieveStudyMaterial, summarizeStudyMaterial, createStudyPlan } from "./tools.js";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod";

const myToolResponse = z.object({
    message: z.string(),
    toolsUsed: z.array(z.string()).describe("List with names of tools used in the response, without the word function"),
});

const checkpointer = new MemorySaver();
const model = new AzureChatOpenAI({ temperature: 0.2 });

const agent = createAgent({
    model,
    tools: [retrieveStudyMaterial, summarizeStudyMaterial, createStudyPlan],
    responseFormat: myToolResponse,
    checkpointer,
    system: `Je bent StudyBuddy, een vriendelijke en duidelijke studie-assistent.
    Je helpt studenten met het begrijpen, samenvatten en plannen van studiemateriaal.
    Gebruik tools wanneer je informatie uit documenten moet zoeken.
    Geef altijd terug welke tools je hebt gebruikt.`,
});

export async function callAgent(prompt, userid = "anonymous") {
    const result = await agent.invoke(
        {
            messages: [{ role: "user", content: prompt }],
        },
        {
            configurable: { thread_id: userid },
        }
    );
    return result.structuredResponse;
}