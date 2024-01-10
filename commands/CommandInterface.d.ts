import { CommandInteraction, ContextMenuCommandBuilder, SlashCommandBuilder } from "discord.js";

export interface CommandInterface {
    data: SlashCommandBuilder | ContextMenuCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
}