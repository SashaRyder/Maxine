import { Client, Collection, Events, Partials, REST, Routes } from "discord.js";
import path from "path";
import { clientReady, guildCreate } from "./functions";
import fs, { existsSync } from "fs";
import { CommandInterface } from "./commands/CommandInterface";
import { submitPost } from "./commands/reddit";
import cron from "node-cron";
import moment from "moment";
import { startInspector } from "./inspector";

const { DISCORD_TOKEN, ENABLE_INSPECTOR } = process.env;

global["appRoot"] = path.resolve(__dirname);

const client = new Client({ partials: [Partials.Channel], intents: 32767 });

const commands = [];

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath) as CommandInterface;
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.on("ready", async () => {
  clientReady(client);
  if (ENABLE_INSPECTOR === "true") {
    startInspector(client);
  }
  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = (await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    })) as { length: number };

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }

  if (!existsSync("/data/schedule.json")) {
    fs.writeFileSync("/data/schedule.json", "[]");
  }
  if (cron.getTasks().size === 0) {
    cron.schedule("*/30 * * * *", async () => {
      const startPostTimes = 12;
      const endPostTimes = 23;
      const timeNow = moment().hour();
      if (timeNow < startPostTimes || timeNow > endPostTimes) return;
      console.info("CRON Starting...");
      const schedule = fs.readFileSync("/data/schedule.json", {
        encoding: "utf8",
      });
      const tasks: {
        subreddit: string;
        interval: number;
        guildId: string;
        channelId: string;
        posted: string[];
        lastRan: Date;
      }[] = JSON.parse(schedule);
      for (const task of tasks) {
        await submitPost(
          client,
          task.subreddit,
          task.interval,
          task.guildId,
          task.channelId,
          task.posted,
          task.lastRan
        );
      }
      console.info("CRON Ended...");
    });
  }
});

client.on("guildCreate", (guild) => guildCreate(guild, client));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("error", (err) => {
  console.log(err.name);
});

client.login(DISCORD_TOKEN);
