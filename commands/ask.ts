import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { chatGPT } from "../chatGPT";

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
  const api = chatGPT();

  if(!api) {
    interaction.reply("Chat GPT API key not provided.");
    return;
  }

  const msg = interaction.options.get("query").value;
  const result = await api.sendMessage(msg as string);
  await interaction.reply(result.text);
};

export { data, execute };