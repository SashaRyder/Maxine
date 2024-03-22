import _ from "underscore";
import { CommandInterface } from "./CommandInterface";
import { ApplicationCommandType, CacheType, CommandInteraction, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";
import { ChatGPTUnofficialProxyAPI } from 'chatgpt'

const execute = async (interaction: CommandInteraction) => {
  if (!interaction.isMessageContextMenuCommand) return;
  const authKey = process.env.CHATGPT_API_KEY;
  if(!authKey) {
    await interaction.reply("No C-GPT API key given");
    return;
  };

  const msg = (interaction as MessageContextMenuCommandInteraction<CacheType>).targetMessage.content;
  const api = new ChatGPTUnofficialProxyAPI({
    accessToken: authKey
  });

  const result = await api.sendMessage(`TLDR the following: ${msg}`);
  await interaction.reply(result.text);
};

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("tldrify").setType(ApplicationCommandType.Message),
  execute,
} as CommandInterface;
