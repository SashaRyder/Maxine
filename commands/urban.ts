import * as ud from "urban-dictionary";
import * as Discord from "discord.js";
import { CommandInterface } from "./CommandInterface";
import { SlashCommandBuilder } from "discord.js";

export const execute = async (interaction: Discord.CommandInteraction) => {
    
  const toUrban = interaction.options.get("query").value as string;
  let resultsToUse = [];
  try {
    const results = await ud.define(toUrban);
    resultsToUse = results;
  } catch (error) {
    /** Error occurred! **/
  }
  if (resultsToUse.length > 0) {
    const result = resultsToUse[0];
    const sendBack = `${result.word}: ${result.definition}`;
    interaction.reply(sendBack);
  } else {
    interaction.reply(`Sorry! I'm not sure what "${toUrban}" is :cry: `);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("urban")
    .setDescription("Queries urban dictionary")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("What to look-up.")
        .setRequired(true)
    ),
  execute,
} as CommandInterface;
