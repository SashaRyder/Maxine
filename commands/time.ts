import { CommandInterface } from "./CommandInterface";
import { Builder, Browser, By, Key, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox";
import {
  SlashCommandBuilder,
  CommandInteraction,
  MessagePayload,
} from "discord.js";

const execute = async (interaction: CommandInteraction) => {
  const location = interaction.options.get("location")?.value;
  if (!location) {
    const sticker = interaction.guild.stickers.cache.find(
      (x) => x.name === "GRIND TIME"
    );
    const stickers = sticker ? [sticker] : undefined;
    const reply = MessagePayload.create(interaction.channel, {
      content: `ITS TIME TO GRIND ${interaction.user}, THATS WHAT TIME IT IS!`,
      stickers,
    });
    interaction.reply(reply);
    return;
  }

  await interaction.deferReply();

  let options = new firefox.Options()
  .addArguments("--headless");

  let driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(options).build();
  await driver.get(`https://www.google.com/search?q=time+${location}&aqs=chrome.0.69i59l2.771j0j1&sourceid=chrome&ie=UTF-8&lr=lang_en`)
  const data: string[] = await driver.executeScript(`
    let elements = Array.from(document.querySelectorAll("div[role='heading']"));
    let timeElement = elements.find((el) => el.innerHTML.includes(":"));
    let dateElement = timeElement.nextElementSibling.textContent;
    let location =
      timeElement.nextElementSibling.nextElementSibling.textContent;
    return [timeElement.textContent, dateElement, location];
  `);
  if (!data.some((data) => data === undefined)) {
    if (!data[2].includes("Time in")) {
      interaction.editReply(`I'm not sure where ${location} is!`);
    }
    const resp = `${data[2]} is ${data[0]} ${data[1]}`
      .replace(/\s+/g, " ")
      .trim();
    interaction.editReply(resp);
  } else {
    interaction.editReply(
      `Something went wrong. I have the following: \r\n\r\n ${data}`
    );
  }
  driver.close();
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("time")
    .setDescription("Check the time for a location")
    .addStringOption((option) =>
      option
        .setName("location")
        .setDescription("Location of where you want to search")
    ),
  execute,
} as CommandInterface;
