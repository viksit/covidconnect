const needle = require("needle");

const v1Token = process.env.TWITTER_V1_BEARER_TOKEN;
const v2Token = process.env.TWITTER_V2_BEARER_TOKEN;

const v1EndpointUrl = "https://api.twitter.com/1.1/search/tweets.json";
const v2EndpointUrl = "https://api.twitter.com/2/tweets/search/recent";

/**
 * Construct a twitter v2 API search query to find given resources
 *
 * Parameters is an object with following fields:
 *
 * 1. resource_type
 *
 *    Type of tweets to search for. One of "demand" or "supply".
 *    Defaults to "demand"
 *
 * 2. city
 *
 *    Which city to search for. If set to "any", will search in all cities
 *
 * 3. material_type
 *
 *    Type of material to search for. If set to 'all' (default), it'll search
 *    for all kinds of materials.
 *    Currently supports: 'oxygen', 'vaccine', 'medicine' and 'helpline'. If
 *    the value is anything else, it'll searchf or any kind of hospital resources
 *
 * @param {object} params
 * @returns {string} Search string for Twitter v2 API
 */
const createQuery = (params) => {
  const resource_type = params.resource_type || "demand";
  const city = params.city  == "any" ? "" : params.city;
  const material_type = params.material_type || "all";
  const oxygen_query = "oxygen OR oxygen%20cylinder OR oxygen%20cylinders";
  const hospital_query = "bed OR beds OR icu OR ambulance OR #bed OR #BED OR ventilator OR ventilators OR oxygen OR hospital OR plasma";
  const medicine_query = "medicine OR remdesivir OR favipiravir OR tocilizumab OR Fabilflu";
  const vaccine_query = "vaccine OR pfizer OR covishield OR covaxin OR mRNA";
  const helpline_query = "helpline OR covid OR toll-free";

  let resource_type_query = "";
  let material_type_query = "";

  if (resource_type == "demand") {
    resource_type_query = "-available -availablity (needed OR need OR needs OR required OR require OR requires OR requirement OR requirements)";
  } else if (resource_type == "supply") {
    resource_type_query = "(available OR availablity) -needed -need -needs -required -require -requires -requirement -requirements";
  }

  console.log("resource_type: ", resource_type);
  console.log("resource type query: ", resource_type_query);

  if (material_type == "all") {
    material_type_query = oxygen_query + " OR " + hospital_query + " OR " + medicine_query + " OR " + vaccine_query + " OR " + helpline_query;
  } else if (material_type == "oxygen") {
    material_type_query = oxygen_query;
  } else if (material_type == "vaccine") {
    material_type_query = vaccine_query;
  } else if (material_type == "medicine") {
    material_type_query = medicine_query;
  } else if (material_type == "helpline") {
    material_type_query = helpline_query;
  } else {
    material_type_query = hospital_query;
  }

  const searchQuery = `verified #verified -not%20verified -unverified ${city && `#${city} ${city}`} ${material_type_query} -is:retweet ${resource_type_query}`;

  return searchQuery;
};

/**
 * Construct a twitter v1 API search query to find given resources
 *
 * Parameters is an object with following fields:
 *
 * 1. resource_type
 *
 *    Type of tweets to search for. One of "demand" or "supply".
 *    Defaults to "demand"
 *
 * 2. city
 *
 *    Which city to search for. If set to "any", will search in all cities
 *
 * 3. material_type
 *
 *    Type of material to search for. If set to 'all' (default), it'll search
 *    for all kinds of materials.
 *    Currently supports: 'oxygen', 'vaccine', 'medicine' and 'helpline'. If
 *    the value is anything else, it'll searchf or any kind of hospital resources
 *
 * @param {object} params
 * @returns {string} Search string for Twitter v1 API
 */
const createV1Query = (params) => {
  const resource_type = params.resource_type || "demand";
  const city = params.city  == "any" ? "" : params.city;
  const material_type = params.material_type || "all";
  const oxygen_query = "oxygen OR oxygen%20cylinder OR oxygen%20cylinders";
  const hospital_query = "bed OR beds OR icu OR ambulance OR #bed OR #BED OR ventilator OR ventilators OR oxygen OR hospital OR plasma";
  const medicine_query = "medicine OR remdesivir OR favipiravir OR tocilizumab OR Fabilflu";
  const vaccine_query = "vaccine OR pfizer OR covishield OR covaxin OR mRNA";
  const helpline_query = "helpline OR covid OR toll-free";


  let resource_type_query = "";
  let material_type_query = "";

  if (resource_type == "demand") {
    resource_type_query = "-available -availablity (needed OR need OR needs OR required OR require OR requires OR requirement OR requirements)";
  } else if (resource_type == "supply") {
    resource_type_query = "(available OR availablity) -needed -need -needs -required -require -requires -requirement -requirements";
  }

  console.log("resource_type: ", resource_type);
  console.log("resource type query: ", resource_type_query);

  if (material_type == "all") {
    material_type_query = oxygen_query + " OR " + hospital_query + " OR " + medicine_query + " OR " + vaccine_query + " OR " + helpline_query;
  } else if (material_type == "oxygen") {
    material_type_query = oxygen_query;
  } else if (material_type == "vaccine") {
    material_type_query = vaccine_query;
  } else if (material_type == "medicine") {
    material_type_query = medicine_query;
  } else if (material_type == "helpline") {
    material_type_query = helpline_query;
  } else {
    material_type_query = hospital_query;
  }
  // For V1, -filter: vs -is
  const searchQuery = `verified #verified -not%20verified -unverified ${city && `#${city} ${city}`} ${material_type_query} -filter:retweet ${resource_type_query}`;

  return searchQuery;
};


/**
 * Fetch results from the Twitter v1 search API
 *
 * params is passed through to createV1Query. In addition, it
 * contains a `max_results` key that sets the maximum number of
 * search results returned.
 *
 * On success, returns an object with the following keys:
 *
 * 1. res: The response body of the search
 * 2. twitter_pearams: The parameters sent to the twitter API for searching
 * 3. search_query: The query sent to the twitter search API
 *
 * @param {object} params
 * @returns {object}
 */
async function getTwitterSearchRequestV1(params) {
  const { city, resourceType, max_results } = params;
  const searchQuery = createV1Query(params);

  const twitterParams = {
    q: searchQuery,
    trim_user: true,
    count: max_results,
    tweet_mode: "extended",
    include_entities: false,
  };

  const res = await needle('get', v1EndpointUrl, twitterParams, {
    headers: {
      "User-Agent": "v2RecentSearchJS",
      "authorization": `Bearer ${v1Token}`
    }
  });

  if (res.body) {
    return {
      res: res.body,
      twitter_params: twitterParams,
      search_query: searchQuery
    };
  }
  throw new Error("Unsuccessful request");
};

/**
 * Fetch results from the Twitter v2 search API
 *
 * params is passed through to createV2Query. In addition, it
 * contains a `max_results` key that sets the maximum number of
 * search results returned.
 *
 * On success, returns an object with the following keys:
 *
 * 1. res: The response body of the search
 * 2. twitter_pearams: The parameters sent to the twitter API for searching
 * 3. search_query: The query sent to the twitter search API
 *
 * @param {object} params
 * @returns {object}
 */
async function getTwitterSearchRequestV2(params) {
  const { city, resourceType, max_results } = params;
  const searchQuery = createQuery(params);

  const twitterParams = {
    "query": searchQuery,
    "tweet.fields": "author_id,created_at,public_metrics",
    "max_results": max_results,
  };

  const res = await needle("get", v2EndpointUrl, twitterParams, {
    headers: {
      "User-Agent": "v2RecentSearchJS",
      "authorization": `Bearer ${v2Token}`
    }
  });

  if (res.body) {
    return {
      res: res.body,
      twitter_params: twitterParams,
      search_query: searchQuery
    };
  }
  throw new Error("Unsuccessful request");
};

export { getTwitterSearchRequestV2, getTwitterSearchRequestV1 };
