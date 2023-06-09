import express from 'express';
import cors from 'cors';
import axios from 'axios';
import cheerio from 'cheerio';
import TelegramBot from 'node-telegram-bot-api';

const port = process.env.PORT || 3000;
const botToken = '6114264487:AAGCh9kZ_81BSddgVJAvO_X-u1uMqy_33-4'; // Replace with your Telegram bot token


import {
    generateEncryptAjaxParameters,
    decryptEncryptAjaxResponse,
} from './helpers/extractors/goload.js';
import { USER_AGENT, renameKey } from './utils.js';

const BASE_URL = 'https://gogoanime.llc/';
const BASE_URL2 = 'https://gogoanime.llc/';
const ANN_BASE_URL = 'https://www.animenewsnetwork.com/weekly-ranking/';
const ajax_url = 'https://ajax.gogo-load.com/';
const anime_info_url = 'https://gogoanime.film/category/';
const anime_movies_path = '/anime-movies.html';
const popular_path = '/popular.html';
const new_season_path = '/new-season.html';
const search_path = '/search.html';
const filter_path = '/filter.html';
const popular_ongoing_url = `${ajax_url}ajax/page-recent-release-ongoing.html`;
const recent_release_url = `${ajax_url}ajax/page-recent-release.html`;
const list_episodes_url = `${ajax_url}ajax/load-list-episode`;
const seasons_url = 'https://gogoanime.film/sub-category/';

const Referer = 'https://gogoplay.io/';
const goload_stream_url = 'https://goload.pro/streaming.php';
export const DownloadReferer = 'https://goload.pro/';

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
    port: port,
};

const app = express();
const bot = new TelegramBot(botToken, { polling: true });

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json('Welcome to AnimeYay Bot!');
});

app.get('/search', async (req, res) => {
    try {
        const keyw = req.query.keyw;
        const page = req.query.page;

        const data = await scrapeSearch({ keyw: keyw, page: page });

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

const scrapeSearch = async ({ list = [], keyw, page = 1 }) => {

    try {
        const searchPage = await axios.get(
            `${BASE_URL + search_path}?keyword=${keyw}&page=${page}`
        );
        const $ = cheerio.load(searchPage.data);

        $('div.last_episodes > ul > li').each((i, el) => {
            list.push({
                animeId: $(el).find('p.name > a').attr('href').split('/')[2],
                animeTitle: $(el).find('p.name > a').attr('title'),
                animeUrl: BASE_URL + '/' + $(el).find('p.name > a').attr('href'),
                animeImg: $(el).find('div > a > img').attr('src'),
                status: $(el).find('p.released').text().trim(),
            });
        });

        return list;
    } catch (err) {
        console.log(err);
        return { error: err };
    }
};

/** SCRAPE MP4 START **/
app.get('/watch/:id', async(req, res) => {
    try {
        const id = req.params.id;

        const data = await scrapeMP4({ id: id });

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

const scrapeMP4 = async({ id }) => {

    let sources = [];

    let sources_bk = [];

    try {

        let epPage, server, $, serverUrl;

        if (id) {

            epPage = await axios.get(BASE_URL2 + id);

            $ = cheerio.load(epPage.data);

            server = $('#load_anime > div > div > iframe').attr('src');

            serverUrl = new URL(server);

        } else throw Error("Episode id not found")

        const goGoServerPage = await axios.get(serverUrl.href, {

            headers: { 'User-Agent': USER_AGENT },

        });

        const $$ = cheerio.load(goGoServerPage.data);

        const params = await generateEncryptAjaxParameters(

            $$,

            serverUrl.searchParams.get('id')

        );

        const fetchRes = await axios.get(

            `

        ${serverUrl.protocol}//${serverUrl.hostname}/encrypt-ajax.php?${params}`, {

                headers: {

                    'User-Agent': USER_AGENT,

                    'X-Requested-With': 'XMLHttpRequest',

                },

            }

        );

        const res = decryptEncryptAjaxResponse(fetchRes.data);

        if (!res.source) return { error: 'No sources found!! Try different source.' };

        res.source.forEach((source) => sources.push(source));

        res.source_bk.forEach((source) => sources_bk.push(source));

        return {

            Referer: serverUrl.href,

            sources: sources,

            sources_bk: sources_bk,

        };

    } catch (err) {

        return { error: err };

    }

};


/**SCRAPE MP4 END **/

/** START SCRAPE DOWNLOAD LINKS **/

app.get('/download/:id', async(req, res) => {

    try {

        const id = req.params.id;

        const data = await scrapeMP4({ id: id });

        res.status(200).json(data);

    } catch (err) {

        res.status(500).json({

            status: 500,

            error: 'Internal Error',

            message: err,

        });

    }

});

const scrapeDownload = async ({ id }) => {

  if (id) {

    try {

      const cookies = 'gogoanime=aghj610ve2ee7jl4bgtlflag45; _ga=GA1.2.2113900711.1684408795; _sharedid=a8a3b8bd-8cc5-4551-9ef9-18ad145afc70; dsq__=435tq7fe8c6bo; _gid=GA1.2.4323791.1684667247; auth=0BkG3DL6fOPr9i5Baou7v3fDvBLQ05wcjkp%2Fv%2FlMXfLXcglPVrlEG0dlNMQ%2Fl%2BrWaUm5UF6ebQSIfNMWvJrDDQ%3D%3D; _gat=1; _pbjs_userid_consent_data=980429639243111; cto_bidid=L1jC2l9zNEF0NERPUmpqbmllaHVWR0JwbUl3aWNvVWslMkZSTDBJa3BZNWtIV0doY0ZWZ1ZaSSUyRm9paVpJT2FUQ2RGV253UnRpR2ZUV3JlRk9ZajBoSU9JQmR2ZkhXaktSSDhLWGlPN21NTHRzTFRtY3clM0Q; cto_bundle=ypl-KV9IYkFwMmR6Y05zRlJFUWtsdTZEQXRsYzFGNmU2VVZEWjlvS1NWUGZRJTJGS0Q2TkdEOFg3QksyRWg2R0l5cEFxSUVtMmJnSWEzOXdKRWM3TWIxSURnSFB0JTJGcWpxWUR5VW15NThXNE1wU1hKUGhYcVR0JTJGJTJGc0JmOEtWODQlMkJ2clZMeGhsSHNsOW9NOGFwamx1TnpQclVGVU9BJTNEJTNE';

      const dlPage = await axios.get(`${BASE_URL}${id}`, {

        headers: {

          'Cookie': cookies,

          'User-Agent': USER_AGENT,

        }

      });

      const $ = cheerio.load(dlPage.data);

      let links = [];

      $('.list_dowload a').each((index, element) => {

        const href = $(element).attr('href');

        const text = $(element).text();

        links.push({ href, text });

      });

      return links;

    } catch (error) {

      throw new Error('Failed to fetch download links');

    }

  } else {

    throw new Error('Episode ID not found');

  }

};




  
/** END SCRAPE DOWNLOAD LINKS **/

app.get('/episodes/:id', async(req, res) => {
    try {
        const id = req.params.id;

        const data = await scrapeAnimeEpisodes({ id: id });

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

const scrapeAnimeEpisodes = async({ epList = [],  id }) => {
    try {

        const animePageTest = await axios.get(`https://gogoanime.gg/category/${id}`);

        const $ = cheerio.load(animePageTest.data);

        const ep_start = $('#episode_page > li').first().find('a').attr('ep_start');
        const ep_end = $('#episode_page > li').last().find('a').attr('ep_end');
        const movie_id = $('#movie_id').attr('value');
        const alias = $('#alias_anime').attr('value');

        const html = await axios.get(
            `${list_episodes_url}?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${0}&alias=${alias}`
        );
        const $$ = cheerio.load(html.data);

        $$('#episode_related > li').each((i, el) => {
            epList.push({
                episodeId: $(el).find('a').attr('href').split('/')[1],
                episodeNum: $(el).find(`div.name`).text().replace('EP ', ''),
                episodeUrl: BASE_URL + $(el).find(`a`).attr('href').trim(),
            });
        });

        return epList;
    } catch (err) {
        console.log(err);
        return { error: err };
    }
};


app.use((req, res) => {
    res.status(404).json({
        status: 404,
        error: 'Not Found',
    });
});

app.listen(port, () => {
    console.log('Express server listening on port %d in %s mode', port, app.settings.env);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const message = '<b>Welcome to the AnimeYay bot!</b>\n Here is some guide to get you started.\n\n /search <b>Keyword</b> <b>1</b> Search your favorite Anime By Title. <b style="color: #FF0000;">DONT FORGET TO ALWAYS PUT PAGE NUMBER AT THE END OF SEARCH KEYWORD!</b>\n /episodes <b>AnimeId</b> Enter AnimeId to show list of episodes of that anime.\n /watch <b>episodeId</b> enter episodeId to show video url to watch.\n\n <b>Recommended Video Players to Use</b>\n <a href="https://google.com">AnimeYay Player</a>';
  
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

bot.onText(/\/search (.+?) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const searchTerm = match[1];
    const page = match[2]; // Specify the desired page number
  

    
    try {
        const data = await scrapeSearch({ keyw: searchTerm, page: page });
  
        // Format the data into a readable message
        let message = 'Search Result:\n\n ';
        
        
        for (const anime of data) {
            message += `Title: <pre><b>${anime.animeTitle}</b></pre>\n`;
            message += `Status: ${anime.status}\n`;
            message += `ANIME ID: <pre><b>${anime.animeId}</b></pre>\n\n`;
        }
  
        if (data.length === 0) {
            message = 'No results found.';
        }
  
        bot.sendMessage(chatId, message, { parse_mode: 'HTML'

});
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'An error occurred while searching for anime.');
    }
});

/**bot.on('callback_query', (query) => {

  const chatId = query.message.chat.id;

  const data1= query.data;
let page = '';
    let searchTerm ='';
    const values = data1.split(':');



// Access the individual values

  const value1 = values[0];

  const value2 = values[1];
    
  // Handle different button callbacks

  switch (value1) {

    case '1':

      page = `${value1}`;
      searchTerm = `${value2}`;

      break;

    case '2':

      page = `${value1}`;

      searchTerm = `${value2}`;

      break;
     
    case '3':

      page = `${value1}`;
      searchTerm = `${value2}`;

      break;
    
    case '4':

      page = `${value1}`;
      searchTerm = `${value2}`;

      break;
          
    case '5':

      page = `${value1}`;

      searchTerm = `${value2}`;

      break;

    default:

      break;

  }

    const keyboard = {

    inline_keyboard: [

      [{ text: 'Page 1', callback_data: `1:${searchTerm}` }],

      [{ text: 'Page 2', callback_data: `2:${searchTerm}` }],

      

      [{ text: 'Page 3', callback_data: `3:${searchTerm}` }],

      [{ text: 'Page 4', callback_data: `4:${searchTerm}` }],

      

      [{ text: 'Page 5', callback_data: `5:${searchTerm}` }],

    ],

  };

    

    try {

        const data2 = await scrapeSearch({ keyw: searchTerm, page: page });

  

        // Format the data into a readable message

        let message = 'Search Result:\n\n ';

        

        

        for (const anime of data2) {

            message += `Title: <pre><b>${anime.animeTitle}</b></pre>\n`;

            message += `Status: ${anime.status}\n`;

            message += `ANIME ID: <pre><b>${anime.animeId}</b></pre>\n\n`;

        }

  

        if (data2.length === 0) {

            message = 'No results found.';

        }

  

        bot.sendMessage(chatId, message, {

  parse_mode: 'HTML',

  reply_markup: {

    inline_keyboard: [

      [{ text: 'Page 1', callback_data: `1:${searchTerm}` }],

      [{ text: 'Page 2', callback_data: `2:${searchTerm}` }],

       

      [{ text: 'Page 3', callback_data: `3:${searchTerm}` }],

      

      [{ text: 'Page 4', callback_data: `4:${searchTerm}` }],

        

      [{ text: 'Page 5', callback_data: `5:${searchTerm}` }],

    ],

  },
            });

    } catch (err) {

        console.error(err);

        bot.sendMessage(chatId, 'An error occurred while searching for anime.');

    }
  // Answer the button callback

  bot.answerCallbackQuery(query.id);

});**/

bot.onText(/\/episodes (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const id = match[1];
  try {
    const data = await scrapeAnimeEpisodes({ id: id });
    let message = 'Episode List:\n\n ';
        
        
        for (const anime of data) {
            message += `Episode Id: <pre><b>${anime.episodeId}</b></pre>\n`;
            message += `Episode: ${anime.episodeNum}\n\n`;
        }
  
        if (data.length === 0) {
            message = 'No results found.';
        }
  
        bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    bot.sendMessage(chatId, 'Error: ' + err);
  }
});


bot.onText(/\/watch (.+)/, async (msg, match) => {

    const chatId = msg.chat.id;

    const episodeId = match[1];

    try {

        const data = await scrapeMP4({ id: episodeId });

        if (data.error) {

            bot.sendMessage(chatId, `An error occurred: ${data.error}`);

        } else {

            // Format the data into a readable message

            let message = 'MP4 Sources:\n\n';

            message += `Referer: ${data.Referer}\n`;

            message += '\n Sources:\n';

            for (const source of data.sources[0].file) {
            
                
             message += `${source}`;

            }

            message += '\n Backup Sources:\n';

            for (const source of data.sources_bk[0].file) {

                message += `${source}`;

            }
            bot.sendMessage(chatId, message, { parse_mode: 'HTML' });

        }

    } catch (err) {

        console.error(err);

        bot.sendMessage(chatId, 'An error occurred while scraping MP4 sources.');

    }

});

bot.onText(/\/download (.+)/, async (msg, match) => {

  const episodeId = match[1];

  try {

    const links = await scrapeDownload({ id: episodeId });
    const chatId = msg.chat.id;
    let response = '<b>Download Links</b>\n\n <em>This links expires in couples of hours</em>\n\n';
    
    links.forEach(link => {

      response += `<a href="${link.href}">${link.text}</a>\n`;

    });

    bot.sendMessage(chatId, response, { parse_mode: 'HTML' });

  } catch (error) {

    bot.sendMessage(chatId, 'Failed to fetch download links');

  }

});

bot.onText(/\/guide/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '*What this bot can do?*\n\n /guide <shows list of commands>\n /search <keyword><Search Anime Title>\n /episodes <Show List Of Episodes of given AnimeId>\n');
});
