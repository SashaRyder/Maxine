import {
  CommandInteraction,
  SlashCommandBuilder,
  RESTJSONErrorCodes,
  CacheType,
} from "discord.js";

const data = new SlashCommandBuilder()
  .setName("afk")
  .setDescription(
    "Appends -AFK to users nickname (Or un-appends depending if you're already AFK!)"
  );

const execute = async (interaction: CommandInteraction<CacheType>) => {
  const afkAppend = "- AFK";
  const currName: string =
    interaction.member.nickname || interaction.user.username;
  if (currName.endsWith(afkAppend)) {
    await interaction.member.setNickname(currName.replace(afkAppend, ""));
    await interaction.reply({
      content: `You are no longer AFK`,
      ephemeral: true,
      fetchReply: true
    });
    return;
  }
  try {
    await interaction.member.setNickname(`${currName} ${afkAppend}`);
    await interaction.reply({
      content: `You have now been set to AFK`,
      ephemeral: true,
      fetchReply: true
    });
  } catch (error) {
    if (error.code === RESTJSONErrorCodes.MissingPermissions) {
      await interaction.reply({
        content: `Unfortunately the bot does not have the permission to change your nickname, this is most likely due to you being the server owner!`,
        ephemeral: true,
        fetchReply: true
      });
    }
    console.log(error);
  }
};

export { data, execute };