import _ from "underscore";
import { ApplicationCommandType, CacheType, CommandInteraction, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";

const data = new ContextMenuCommandBuilder()
  .setName("tldrify").setType(ApplicationCommandType.Message);

const execute = async (interaction: CommandInteraction) => {
  if (!interaction.isMessageContextMenuCommand) return;
  const authKey = process.env.CHATGPT_API_KEY;
  if (!authKey) {
    await interaction.reply("No C-GPT API key given");
    return;
  };

  const msg = (interaction as MessageContextMenuCommandInteraction<CacheType>).targetMessage.content;
  const api = await import("chatgpt").then((val) => new val.ChatGPTAPI({
    apiKey: authKey
  }));

  const result = await api.sendMessage(`TLDR the following: ${msg}`);
  await interaction.reply(result.text);
};

export { data, execute };