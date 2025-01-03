import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const {ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY 
} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY})
const premierLeagueData = [
    'https://en.wikipedia.org/wiki/Premier_League',
    'https://www.premierleague.com/premier-league-explained',
    'https://www.foxsports.com/stories/soccer/premier-league-winners-complete-list-of-champions-by-year',
    'https://www.espn.com/soccer/team/_/id/360',
    'https://www.theguardian.com/football/2024/dec/21/amad-diallo-becomes-jewel-in-crown-for-amorims-manchester-united',
    'https://www.premierleague.com/awards?at=1&aw=-1&se=719',
    'https://www.premierleague.com/latest-player-injuries',
    'https://en.wikipedia.org/wiki/FA_Cup',
    'https://frontofficesports.com/the-25-highest-paid-premier-league-players/',
    'https://www.sportingnews.com/us/soccer/news/premier-league-top-goal-scorer-updated-golden-boot-ranking/1gng0xz39t2h01sqbl6yfkle14',
    'https://www.premierleague.com/stats/top/players/goals?se=418',
    'https://www.premierleague.com/news/1206108',
    'https://www.radiotimes.com/tv/sport/football/best-premier-league-players-all-time/'
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE })

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async (SimilarityMetric: SimilarityMetric = "dot_product") => {
    try {
      const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
          dimension: 1536,
          metric: SimilarityMetric,
        },
      });
      console.log(`Collection '${ASTRA_DB_COLLECTION}' created successfully:`, res);
    } catch (error: any) {
      if (error.name === "CollectionAlreadyExistsError") {
        console.log(`Collection '${ASTRA_DB_COLLECTION}' already exists. Skipping creation.`);
      } else {
        console.error("Error while creating the collection:", error);
      }
    }
  };
  

const loadSampleData =async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await ( const url of premierLeagueData){
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await ( const chunk of chunks){
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float"
            })

            const vector = embedding.data[0].embedding

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })

            console.log(res)
        }
    }
    
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions:{
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate:async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
            
        }
    })

    return ( await loader.scrape()) ?.replace(/<[^>]*>?/gm,'')
}

createCollection().then(() => loadSampleData())