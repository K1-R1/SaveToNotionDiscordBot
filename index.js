require('dotenv').config();
const linkify = require('linkifyjs');

//tag info lookup
const tagInfo = {
    "✍️": "Website",
    "🔍": "Article"
}

// Discord token
const token = process.env.DISCORD_TOKEN

// Notion API keys
const NOTION_KEY = process.env.NOTION_KEY
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

// Notion client
var { Client } = require("@notionhq/client");
const notion = new Client({ auth: NOTION_KEY })

// Function to write to Notion
async function addItem(username, message, emoji) {
    try {
        //Extract any links
        const linksObjectsArray = [];
        if (linkify.find(message).length > 0) {
            for (i = 0; i < linkify.find(message).length; i++) {
                let obj = linkify.find(message)[i];
                if (obj.type === 'url' && obj.isLink) {
                    let linkObject = obj.value;
                    linksObjectsArray.push(linkObject);
                }
            }
        }
        //Add item to notion database
        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
                Name: {
                    title: [
                        {
                            "text": {
                                "content": username
                            }
                        }]
                },
                Message: {
                    rich_text: [
                        {
                            "text": {
                                "content": message
                            }
                        }]
                },
                Link: {
                    url: linksObjectsArray[0]
                },
                Tag: {
                    multi_select: [
                        { "name": tagInfo[emoji] }
                    ]
                }
            },
        })
        console.log(`--------------------\nSuccess; Entry added\nEntry info:`)
        console.log(response)
        console.log(`--------------------\n`)
    } catch (error) {
        console.error(error.body)
    }
}

// Import the discord.js module
var { Client, Intents, MessageEmbed } = require('discord.js');
// Create an instance of a Discord client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

// Ready event
client.on('ready', () => {
    console.log('Save to Notion bot is ready!');
});

//Save to notion
client.on('messageReactionAdd', (reaction, user) => {
    if (user.bot) return;
    const emoji = reaction.emoji.name;
    if (emoji === "✍️" || emoji === "🔍") {
        //if (reaction.message.member.roles.cache.some(role => role.name === 'Admin')) { 
        let username = reaction.message.author.tag;
        let message = reaction.message.content
        let embed = new MessageEmbed()
            .setTitle('Content added to Notion')
            .setDescription(message)
            .setAuthor({
                name: username,
                iconURL: reaction.message.author.displayAvatarURL()
            });
        addItem(username, message, emoji);
        reaction.message.channel.send({ embeds: [embed] })
            .catch(console.error);
        return;
        //}
    }
}
);

//Log bot in
client.login(token);