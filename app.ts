import { Client, Collection, Events, Partials, REST, Routes } from "discord.js";
import path from "path";
import { clientReady, guildCreate, guildLeave } from "./functions";
import fs, { existsSync } from "fs";
import { CommandInterface } from "./commands/CommandInterface";
import { submitPostsForChannel } from "./commands/reddit";
import cron from "node-cron";
import moment from "moment";
import { startInspector } from "./inspector";
import _ from "underscore";
import { Sequelize } from 'sequelize';
import { Reddit, Sequelize as SequelizeModel } from "./models";

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

  const sequelize = new Sequelize(SequelizeModel.configuration);
  const reddit = Reddit.init(Reddit.configuration, { sequelize });
  await reddit.sync();

  if (existsSync("/data/schedule.json")) {
    const file = fs.readFileSync("/data/schedule.json", {encoding: "utf-8"});
    const tasks: {
      subreddit: string;
      interval: number;
      guildId: string;
      channelId: string;
      posted: string[];
      lastRan: Date;
    }[] = JSON.parse(file);
    await reddit.bulkCreate<Reddit>(tasks.map((task) => ({
      ...task,
      posted: JSON.stringify(task.posted) }),
    ));
    fs.unlinkSync("/data/schedule.json");
  }
  if (cron.getTasks().size === 0) {
    cron.schedule("*/30 * * * *", async () => {
      const startPostTimes = 12;
      const endPostTimes = 23;
      const timeNow = moment().hour();
      if (timeNow < startPostTimes || timeNow > endPostTimes) return;
      console.info("CRON Starting...");
      const tasks: Reddit[] = await reddit.findAll();
      const groups = _.groupBy(tasks, x => x.channelId);
      for (const channel of Object.keys(groups)) {
        const grp = groups[channel];
        await submitPostsForChannel(
          client,
          grp,
          false
        );
      }
      console.info("CRON Ended...");
    });
  }
});

client.on("guildCreate", (guild) => guildCreate(guild, client));

client.on("guildDelete", (guild) => guildLeave(guild, client));

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
