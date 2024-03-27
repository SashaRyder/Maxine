import { sleep } from "bun";
import { AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";
import OpenAI from "openai";

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

  let result: OpenAI.Beta.Threads.Runs.Run = null;
  let interval = 0;
  do {
    result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log('Waiting for completion. Current status: ' + result.status);
    interval++;
    await sleep(5000);
  } while (result.status !== 'completed' && interval <= 10);

  if (result.status !== 'completed') {
    await openai.beta.threads.runs.cancel(thread.id, run.id);
    return await interaction.followUp('Request timed out.');
  }

  const messages = await openai.beta.threads.messages.list(thread.id, { order: "desc" });
  const content = messages.data[0].content[0];
  const response = content.type === "text" ? { content: content.text.value, type: "text" } : { content: content.image_file.file_id, type: "image" };

  if (response.type === 'text') {
    return await interaction.followUp(response.content);
  }

  const file = await openai.files.content(response.content);
  const img = Buffer.from(await file.arrayBuffer());
  return await interaction.followUp({ files: [new AttachmentBuilder(img, { name: "generation.png" })] });
};

export { data, execute };