import { BlobServiceClient } from "@azure/storage-blob";

const { AZURE_STORAGE_CONNECTION_STRING, EMBED_URL } = process.env;

const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
);

const containerName = "media"
const containerClient = blobServiceClient.getContainerClient(containerName);
containerClient.createIfNotExists({ access: "container" });


const uploadFile = async (filePath: string) => {
    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadFile(filePath);
    return `${EMBED_URL}${fileName.substring(0, fileName.indexOf("."))}`
}

export {
    uploadFile
}