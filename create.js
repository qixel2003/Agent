import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiEmbeddingsDeploymentName:
    process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME,
});

async function loadFile(path) {
    if (path.endsWith(".txt")) {
        return await new TextLoader(path).load();
    }

    if (path.endsWith(".pdf")) {
        return await new PDFLoader(path).load();
    }

    if (path.endsWith(".pptx")) {
        return await new PPTXLoader(path).load();
    }

    throw new Error(`Bestandstype niet ondersteund: ${path}`);
}

const files = [
    // "./public/example.txt",
    // "./public/presentatie.pptx",
    // "./public/artikel.pdf",
    // "./public/Agent.txt",
    "./public/Cursushandleiding.pdf",
    "./public/Programma.pdf",
];

let docs = [];

for (const file of files) {
    const loadedDocs = await loadFile(file);
    docs.push(...loadedDocs);
}

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await textSplitter.splitDocuments(docs);

const vectorStore = new FaissStore(embeddings, {});
await vectorStore.addDocuments(chunks);
await vectorStore.save("./vectordb");

console.log("✅ Vector database gemaakt met meerdere bestandstypes!");