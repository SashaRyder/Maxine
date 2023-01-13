import { CommandInterface } from "./CommandInterface";
import { CommandInteraction, SlashCommandBuilder, RESTJSONErrorCodes, } from "discord.js";
import axios from "axios";


module.exports = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Appends -AFK to users nickname (Or un-appends depending if you're already AFK!)"),
  async execute(interaction) {
    const usernameOfMember = interaction.user.username;
    const nicknameOfMember = interaction.member.nickname;
    if (nicknameOfMember != null && nicknameOfMember.includes(" - AFK")) {
      await interaction.member.setNickname(usernameOfMember);
      return interaction.reply({
        content: `You are no longer AFK`,
        ephemeral: true,
      });
    } else if (nicknameOfMember == null)
      try {
        await interaction.member.setNickname(
          interaction.user.username + " - AFK"
        );
        return interaction.reply({
          content: `You have now been set to AFK`,
          ephemeral: true,
        });
      } catch (error) {
        if (error.code === RESTJSONErrorCodes.MissingPermissions) {
          return interaction.reply({
            content: `Unfortunately the bot does not have the permission to change your nickname, this is most likely due to you being the server owner!`,
            ephemeral: true,
          });
        } else {
          console.log(error);
        }
      }
  },
};





