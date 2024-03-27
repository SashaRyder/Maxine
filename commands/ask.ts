import { sleep } from "bun";
import { AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";
import OpenAI from "openai";
import { TextContentBlock } from "openai/resources/beta/threads/index.mjs";

const data = new SlashCommandBuilder()
  .setName("ask")
  .setDescription("Ask me anything :)")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Query to ask")
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

  const msg = interaction.options.get("query").value as string;

  const assistantId = process.env.CHATGPT_ASSISTANT_ID;

  if (!assistantId) {
    return await interaction.reply("Assistant ID not provided.");
  }

  await interaction.deferReply();

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: msg,
      },
    ],
  });

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
    additional_instructions: `Please address the user as ${interaction.user.displayName}.`,
  });

  let response: { type: 'text' | 'image', content: string } = null;

  while (true) {
    const result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    if (result.status == 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id, { order: "desc" });
      const content = messages.data[0].content[0];
      response = content.type === "text" ? { content: content.text.value, type: "text" } : { content: content.image_file.file_id, type: "image" };
      break;
    } else {
      console.log('Waiting for completion. Current status: ' + result.status);
      await sleep(5000);
    }
  }

  if (response.type === 'text') {
    return await interaction.followUp(response.content);
  }

  const file = await openai.files.content(response.content);
  const img = Buffer.from(await file.arrayBuffer());
  return await interaction.followUp({ files: [new AttachmentBuilder(img)] });
};

export { data, execute };