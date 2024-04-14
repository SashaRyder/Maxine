import { sleep } from "bun";
import {
	AttachmentBuilder,
	CommandInteraction,
	Message,
	SlashCommandBuilder,
} from "discord.js";
import OpenAI from "openai";
import { GPTThread, Sequelize as SequelizeModel } from "../models";
import { Sequelize } from "sequelize";

const data = new SlashCommandBuilder()
	.setName("ask")
	.setDescription("Ask me anything :)")
	.addStringOption((option) =>
		option.setName("query").setDescription("Query to ask").setRequired(true),
	);

const execute = async (interaction: CommandInteraction) => {
	const openai = new OpenAI({
		apiKey: process.env.CHATGPT_API_KEY,
	});

	if (!openai.apiKey) {
		interaction.followUp("Chat GPT API key not provided.");
		return;
	}

	const msg = interaction.options.get("query").value as string;

	const assistantId = process.env.CHATGPT_ASSISTANT_ID;

	if (!assistantId) {
		return await interaction.reply("Assistant ID not provided.");
	}

	await interaction.deferReply();

	const thread = await openai.beta.threads.create({
		messages: [
			{
				role: "user",
				content: msg,
			},
		],
	});

	const run = await openai.beta.threads.runs.create(thread.id, {
		assistant_id: assistantId,
		additional_instructions: `Please address the user as ${interaction.user.displayName}.`,
	});

	let result: OpenAI.Beta.Threads.Runs.Run = null;
	let interval = 0;
	do {
		result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
		console.log("Waiting for completion. Current status: " + result.status);
		interval++;
		await sleep(5000);
	} while (result.status !== "completed" && interval <= 10);

	if (result.status !== "completed") {
		await openai.beta.threads.runs.cancel(thread.id, run.id);
		return await interaction.followUp("Request timed out.");
	}

	const messages = await openai.beta.threads.messages.list(thread.id, {
		order: "desc",
	});
	const content = messages.data[0].content[0];
	const response =
		content.type === "text"
			? { content: content.text.value, type: "text" }
			: { content: content.image_file.file_id, type: "image" };

	let message: Message<boolean> = null;
	if (response.type === "text") {
		message = await interaction.followUp(response.content);
	}

	const file = await openai.files.content(response.content);
	const img = Buffer.from(await file.arrayBuffer());
	message = await interaction.followUp({
		files: [new AttachmentBuilder(img, { name: "generation.png" })],
	});
	await openai.beta.threads.update(thread.id, {metadata: {messageIds: [message.id]}});
	return message;
};

const reply = async (replyTo: Message) => {
	console.log("Reply triggered.");
	const openai = new OpenAI({
		apiKey: process.env.CHATGPT_API_KEY,
	});

	const assistantId = process.env.CHATGPT_ASSISTANT_ID;

	if (!openai.apiKey || !assistantId) {
		return;
	}

	console.log("Processing reply..");

	let messageChain: Message<boolean>[] = [replyTo];
	let allMessages = await replyTo.channel.messages.fetch({cache: true});
	while(!!messageChain[0].reference) {
		console.log("RAN");
		const upperMessage = messageChain[0].channel.messages.cache.find(msg  => msg.id === messageChain[0].reference.messageId);
		console.log("RAN2");
		console.log(upperMessage);
		messageChain = [upperMessage, ...messageChain];
		Bun.write("/data/test.json", JSON.stringify(messageChain, null, 4));
	}
	return;
	const msgIds =  messageChain.map((msg) => msg.id);

	const sequelize = new Sequelize(SequelizeModel.configuration);
	const gptthread = GPTThread.init(GPTThread.configuration, { sequelize });

	const threadObj = await gptthread.findOne({where: { messageId: msgIds }});
	const context = messageChain.map((msg) => `${msg.author.displayName}: ${msg.cleanContent}`);

	console.log("Thread exists?: ", !!threadObj);

	const threadId = !!threadObj ? threadObj.threadId : (await openai.beta.threads.create({
		messages: context.map(val => (
			{
				role: "user",
				content: val,
			})
		),
	})).id;

	const run = await openai.beta.threads.runs.create(threadId, {
		assistant_id: assistantId,
		additional_instructions: `Please address the user as ${replyTo.author.displayName}.`,
	});

	let result: OpenAI.Beta.Threads.Runs.Run = null;
	let interval = 0;
	do {
		result = await openai.beta.threads.runs.retrieve(threadId, run.id);
		console.log("Waiting for completion. Current status: " + result.status);
		interval++;
		await sleep(5000);
	} while (result.status !== "completed" && interval <= 10);

	if (result.status !== "completed") {
		await openai.beta.threads.runs.cancel(threadId, run.id);
		return await replyTo.reply("Request timed out.");
	}

	const messages = await openai.beta.threads.messages.list(threadId, {
		order: "desc",
	});
	const content = messages.data[0].content[0];
	const response =
		content.type === "text"
			? { content: content.text.value, type: "text" }
			: { content: content.image_file.file_id, type: "image" };

	if (response.type === "text") {
		return await replyTo.reply(response.content);
	}

	const file = await openai.files.content(response.content);
	const img = Buffer.from(await file.arrayBuffer());
	return await replyTo.reply({
		files: [new AttachmentBuilder(img, { name: "generation.png" })],
	});
};

export { data, execute, reply };
