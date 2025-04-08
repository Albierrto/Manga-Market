// server/src/services/aiSummaryService.js
const axios = require('axios');
require('dotenv').config();

// You would need to set up an API key for an AI service
const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

/**
 * Generate an AI summary for a manga series
 * @param {string} seriesName - Name of the manga series
 * @param {string} publisher - Publisher of the manga
 * @param {number} totalVolumes - Total number of volumes
 * @returns {Promise<string>} - Generated summary
 */
const generateSeriesSummary = async (seriesName, publisher, totalVolumes) => {
  try {
    // First check if we already have a summary cached
    // In a production app, this would be stored in your database
    
    // For this example, we'll mock the API call
    // In a real implementation, you would make an actual API call to an AI service
    console.log(`Generating summary for ${seriesName}`);
    
    // This is a placeholder for the actual API call
    // const response = await axios.post(AI_API_URL, {
    //   model: "gpt-3.5-turbo",
    //   messages: [
    //     {
    //       role: "system",
    //       content: "You are a helpful assistant that writes concise manga summaries."
    //     },
    //     {
    //       role: "user",
    //       content: `Write a brief summary (150 words max) of the manga series "${seriesName}" published by ${publisher}. It has ${totalVolumes} volumes. Focus on the plot, main characters, and themes. Do not include spoilers.`
    //     }
    //   ]
    // }, {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${AI_API_KEY}`
    //   }
    // });
    
    // For demo purposes, we'll return mock summaries
    return getMockSummary(seriesName);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return "Summary not available at this time.";
  }
};

/**
 * Get a mock summary for testing purposes
 */
const getMockSummary = (seriesName) => {
  const summaries = {
    "Naruto": "Naruto follows the journey of Naruto Uzumaki, a young ninja who seeks to gain recognition from his peers and dreams of becoming the Hokage, the leader of his village. The story is divided into two parts, Naruto's pre-teen years, and his teenage years. The series is set in a fictional world where ninja are the ultimate power, and Naruto harbors a fox-like monster spirit within him that complicates his childhood but also gives him enormous power when he learns to control it. Through perseverance and determination, Naruto works to overcome the odds stacked against him.",
    
    "One Piece": "One Piece follows Monkey D. Luffy, a young man whose body gained the properties of rubber after unintentionally eating a Devil Fruit. With his crew of pirates, named the Straw Hat Pirates, Luffy explores the Grand Line in search of the world's ultimate treasure known as 'One Piece' to become the next Pirate King. The series explores themes of friendship, adventure, and the pursuit of dreams, as Luffy and his diverse crew navigate treacherous waters, battle formidable foes, and uncover the mysteries of a world controlled by a corrupt World Government.",
    
    "Demon Slayer": "Demon Slayer: Kimetsu no Yaiba tells the story of Tanjiro Kamado, a kind-hearted teenager who becomes a demon slayer after his family is slaughtered by demons and his sister Nezuko is turned into one. Despite her transformation, Nezuko still shows signs of human emotion and thought, which drives Tanjiro to find a cure for her condition. The series follows Tanjiro's journey as he joins the Demon Slayer Corps, trains rigorously, and faces increasingly powerful demons, all while protecting his sister and searching for the originator of all demons.",
    
    "Attack on Titan": "Attack on Titan is set in a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason. The story centers on Eren Yeager, his adoptive sister Mikasa Ackerman, and their friend Armin Arlert, whose lives are changed forever after a Colossal Titan breaches the wall of their hometown. Vowing revenge and to reclaim the world from the Titans, Eren, Mikasa, and Armin enlist in the military, joining the Scout Regiment—an elite group of soldiers who fight Titans outside the walls and uncover dark secrets about their world."
  };
  
  return summaries[seriesName] || `${seriesName} is a popular manga series that has captivated readers with its compelling storyline, distinctive art style, and well-developed characters. Throughout its volumes, the series explores various themes and takes readers on an emotional journey filled with action, drama, and character growth. The manga has garnered a dedicated fanbase and has been praised for its narrative depth and artistic execution.`;
};

module.exports = {
  generateSeriesSummary
};