import { sleep } from "bun";
import { AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";
import OpenAI from "openai";

const data = new SlashCommandBuilder()
    .setName("draw")
    .setDescription("Draw a photo")
    .addStringOption((option) =>
        option
            .setName("thing")
            .setDescription("Thing to draw")
            .setRequired(true)
    );

const execute = async (interaction: CommandInteraction) => {
    const openai = new OpenAI({
        apiKey: process.env.CHATGPT_API_KEY
    });

    if (!openai.apiKey) {
        interaction.followUp("Chat GPT API key not provided.");
        return;
    }

    const thing = interaction.options.get("thing").value as string;

    await interaction.deferReply();

    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: thing,
        n: 1,
        size: "1024x1024",
        quality: 'standard',
        response_format: 'b64_json'
    });
    const base64 = response.data[0].b64_json;
    const buffer = Buffer.from(base64, "base64");

    return await interaction.followUp({ files: [new AttachmentBuilder(buffer, { name: "generation.png" })] });
};

export { data, execute };