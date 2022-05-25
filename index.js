require('dotenv').config();
const linkify = require('linkifyjs');

//tag info lookup
const tagInfo = {
    "⚡": "DAOs⚡",
    "🌐": "Web3🌐",
    "🎨": "NFTs🎨",
    "📖": "Books📖",
    "🎮": "Metaverse🎮"
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
        //Message before link
        const messageBeforeLink = message.slice(0, linkify.find(message)[0]['start']);

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
        } else {
            linksObjectsArray.push('No link');
        }

        //test//
        if (checkIfAlreadyAdded(
            NOTION_DATABASE_ID,
            messageBeforeLink,
            linksObjectsArray[0],
            username,
            tagInfo[emoji]
        )) {
            console.log('!!!!!!!!!!!!!!!!!!!! Item already added')
            return
        }

        //Add item to notion database
        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
                Message: {
                    title: [
                        {
                            "text": {
                                "content": messageBeforeLink
                            }
                        }]
                },
                Name: {
                    rich_text: [
                        {
                            "text": {
                                "content": username
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
    if (
        emoji === "⚡" ||
        emoji === "🌐" ||
        emoji === "🎨" ||
        emoji === "📖" ||
        emoji === "🎮"
    ) {
        //if (reaction.message.member.roles.cache.some(role => role.name === 'Admin')) { 
        let username = reaction.message.author.tag;
        let message = reaction.message.content
        let iconURL = reaction.message.author.displayAvatarURL()
        let embed = new MessageEmbed()
            .setTitle('Content added to Notion')
            .setDescription(message)
            .setAuthor({
                name: username,
                iconURL: iconURL
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




//Check if entry is already in table
const checkIfAlreadyAdded = async (databaseId, messageBeforeLink, link, username, tag) => {
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            and: [
                {
                    property: 'Message',
                    title: {
                        contains: messageBeforeLink
                    }
                },
                {
                    property: 'Link',
                    url: {
                        contains: link
                    }
                },
                {
                    property: 'Name',
                    rich_text: {
                        contains: username
                    }
                },
                {
                    property: 'Tag',
                    multi_select: {
                        contains: tag
                    }
                },
            ],
        }
    });
    if (response['results'].length > 1) {
        return true
    } else {
        return false
    }
};