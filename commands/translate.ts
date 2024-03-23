import _ from "underscore";
import { ApplicationCommandType, CacheType, CommandInteraction, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";
import * as deepl from 'deepl-node';

const data = new ContextMenuCommandBuilder()
  .setName("translate").setType(ApplicationCommandType.Message)

const execute = async (interaction: CommandInteraction) => {
  if (!interaction.isMessageContextMenuCommand) return;
  const authKey = process.env.DEEPL_API_KEY;
  if (!authKey) {
    await interaction.reply("No DeepL API key given");
    return;
  };

  const msg = (interaction as MessageContextMenuCommandInteraction<CacheType>).targetMessage.content;
  const translator = new deepl.Translator(authKey);

  const result = await translator.translateText(msg, null, 'en-GB');
  await interaction.reply(`${result.detectedSourceLang.toUpperCase()}: ${msg}\r\n\r\nEN: ${result.text}`);
};

export { data, execute };