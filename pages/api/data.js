// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { TwitterClient } from 'twitter-api-client';

const needle = require('needle');
const querystring = require("querystring");

const twitterClient = new TwitterClient({
  apiKey: process.env.TWITTER_API_KEY,
  apiSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const token = process.env.TWITTER_BEARER_TOKEN;
const endpointUrl = "https://api.twitter.com/2/tweets/search/recent";


const createQuery = (params) => {
  /*
    params:
    city: delhi, bangalore, ...
    resource_type: supply/demand
  */

  var resource_type_query = '';
  var resource_type = params.resource_type;

  if (!resource_type) {
    resource_type = 'demand';
  }
  
  if (resource_type == 'demand') {
    resource_type_query = '-available -availablity (needed OR need OR needs OR required OR require OR requires OR requirement OR requirements)';
  }
  else if (resource_type == 'supply') {
    resource_type_query = '(available OR availablity) -needed -need -needs -required -require -requires -requirement -requirements';
  }
  console.log('resource_type: ', resource_type);
  console.log('resource type query: ', resource_type_query);
  var material_type = "(bed OR beds OR icu OR oxygen OR ventilator OR ventilators OR oxygen%20cylinder OR oxygen%20cylinders OR #bed OR #BED )";
  
  const searchQuery = `verified #verified -not%20verified -unverified #${params.city} ${params.city} ${material_type} -is:retweet ${resource_type_query}`;
  return searchQuery;
}

async function getRequestV1(searchQuery) {
  // tweets.search(parameters)
  const params = {
    'q': searchQuery,
    'result_type': 'recent',
    'count': 50,
  }
  const data = await twitterClient.tweets.search(params);
  return data;
}


async function getRequestV2(searchQuery) {
  const params = {
    'query': searchQuery,
    'tweet.fields': 'author_id,created_at'
  }
  const res = await needle('get', endpointUrl, params, {
    headers: {
      "User-Agent": "v2RecentSearchJS",
      "authorization": `Bearer ${token}`
    }
  })
  if (res.body) {
    return res.body;
  } else {
    throw new Error('Unsuccessful request');
  }
}


export default async (req, res) => {
  // Make request
  console.log('query: ', req.query);
  var {city, resource_type} = req.query;
  
  var searchQuery = createQuery({
    city: city,
    resourceType: resource_type
  });
  console.log('searchQuery: ', searchQuery);
  var apiResponse = {'status' : 'dummy'};
  apiResponse = await getRequestV2(searchQuery);
  var response = {
    "queryParams": req.query,
    "searchQuery" : searchQuery,
    "apiResponse": apiResponse
  };

  
  res.status(200).json({ resp: response })
}
