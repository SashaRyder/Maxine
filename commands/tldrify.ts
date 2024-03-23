import _ from "underscore";
import { ApplicationCommandType, CacheType, CommandInteraction, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";
import { chatGPT } from "../chatGPT";

const data = new ContextMenuCommandBuilder()
  .setName("tldrify").setType(ApplicationCommandType.Message);

const execute = async (interaction: CommandInteraction) => {
  if (!interaction.isMessageContextMenuCommand) return;
  const api = chatGPT();

  if(!api) {
    interaction.reply("Chat GPT API key not provided.");
    return;
  }

  const msg = (interaction as MessageContextMenuCommandInteraction<CacheType>).targetMessage.content;

  const result = await api.sendMessage(`TLDR the following: ${msg}`);
  await interaction.reply(result.text);
};

export { data, execute };