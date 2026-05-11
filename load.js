import { AzureOpenAIEmbeddings, AzureChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

const model = new AzureChatOpenAI({
    temperature: 0.2
})

const vectorStore = await FaissStore.load("./vectordb", embeddings);
console.log("✅ vector store loaded!")

export async function ask(prompt) {
    const relevantDocs = await vectorStore.similaritySearch(prompt);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
    console.log(`Found ${relevantDocs.length} relevant documents`);

    console.log("sending to chatgpt")
    const response = await model.invoke(`je krijgt de volgende vraag: ${prompt}, heef het antwoord door deze tekst te lezen ${context}. als het antwoord hier niet in staat geef dat ook aan. Vat het kort samen. Vraag aan het einde of je een stappenplan moet maken.`);
    console.log(response.content);
    return {
        answer: response.content,
        relevantDocs
    };
}

