import { AzureOpenAIEmbeddings, AzureChatOpenAI } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { tool } from "@langchain/core/tools";

const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiEmbeddingsDeploymentName:
    process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME,
});

const model = new AzureChatOpenAI({
    temperature: 0.2,
});

const vectorStore = await FaissStore.load("./vectordb", embeddings);

export const retrieveStudyMaterial = tool(
    async ({ query }) => {
        console.log("Zoeken in studiemateriaal...");

        const relevantDocs = await vectorStore.similaritySearch(query, 3);

        if (relevantDocs.length === 0) {
            return "Ik kon geen relevante informatie vinden in de documenten.";
        }

        return relevantDocs.map((doc) => doc.pageContent).join("\n\n");
    },
    {
        name: "retrieve_study_material",
        description:
            "Zoekt relevante informatie in geüploade studiedocumenten zoals PDF's, PowerPoints en aantekeningen.",
        schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "De vraag of het onderwerp waarnaar gezocht moet worden.",
                },
            },
            required: ["query"],
        },
    }
);

export const summarizeStudyMaterial = tool(
    async ({ topic }) => {
        console.log("Samenvatting maken...");

        const relevantDocs = await vectorStore.similaritySearch(topic, 4);
        const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

        if (!context) {
            return "Ik kon geen informatie vinden om samen te vatten.";
        }

        const response = await model.invoke(`
Je bent StudyBuddy, een studie-assistent.

Maak een korte, duidelijke samenvatting over dit onderwerp:
${topic}

Gebruik alleen deze informatie:
${context}

Structuur:
- Kernidee
- Belangrijkste punten
- Wat de student moet onthouden
`);

        return response.content;
    },
    {
        name: "summarize_study_material",
        description:
            "Maakt een korte en duidelijke samenvatting van een onderwerp uit het studiemateriaal.",
        schema: {
            type: "object",
            properties: {
                topic: {
                    type: "string",
                    description: "Het onderwerp dat samengevat moet worden.",
                },
            },
            required: ["topic"],
        },
    }
);

export const createStudyPlan = tool(
    async ({ subject, deadline, hoursAvailable }) => {
        console.log("Studieplanning maken...");

        const response = await model.invoke(`
Je bent StudyBuddy, een vriendelijke studiecoach.

Maak een realistische studieplanning.

Vak/onderwerp: ${subject}
Deadline: ${deadline}
Beschikbare uren: ${hoursAvailable}

Maak een korte planning met:
- verdeling van de leerstof
- herhaalmomenten
- advies voor efficiënt leren
`);

        return response.content;
    },
    {
        name: "create_study_plan",
        description:
            "Maakt een studieplanning op basis van onderwerp, deadline en beschikbare studietijd.",
        schema: {
            type: "object",
            properties: {
                subject: {
                    type: "string",
                    description: "Het vak of onderwerp waarvoor geleerd moet worden.",
                },
                deadline: {
                    type: "string",
                    description: "De deadline of toetsdatum.",
                },
                hoursAvailable: {
                    type: "string",
                    description: "Hoeveel tijd de student beschikbaar heeft.",
                },
            },
            required: ["subject", "deadline", "hoursAvailable"],
        },
    }
);

export const tools = [
    retrieveStudyMaterial,
    summarizeStudyMaterial,
    createStudyPlan,
];