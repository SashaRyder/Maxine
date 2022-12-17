import { CommandInterface } from "./CommandInterface";
import puppeteer from "puppeteer";
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
    const reply = MessagePayload.create(null, {
      content: `ITS TIME TO GRIND ${interaction.user}, THATS WHAT TIME IT IS!`,
      stickers,
    });
    interaction.reply(reply);
    return;
  }
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
    env: { LANGUAGE: "en_GB" },
  });
  const page = await browser.newPage();
  await page.goto(
    `https://www.google.com/search?q=time+${location}&aqs=chrome.0.69i59l2.771j0j1&sourceid=chrome&ie=UTF-8&lr=lang_en`
  );
  const data = await page.evaluate(() => {
    let elements = Array.from(document.querySelectorAll("div[role='heading']"));
    let timeElement = elements.find((el) => el.innerHTML.includes(":"));
    let dateElement = timeElement.nextElementSibling.textContent;
    let location =
      timeElement.nextElementSibling.nextElementSibling.textContent;
    return [timeElement.textContent, dateElement, location];
  });
  if (!data.some((data) => data === undefined)) {
    if (!data[2].includes("Time in")) {
      interaction.reply(`I'm not sure where ${location} is!`);
    }
    const resp = `${data[2]} is ${data[0]} ${data[1]}`
      .replace(/\s+/g, " ")
      .trim();
    interaction.reply(resp);
  } else {
    interaction.reply(
      `Something went wrong. I have the following: \r\n\r\n ${data}`
    );
  }
  browser.close();
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
