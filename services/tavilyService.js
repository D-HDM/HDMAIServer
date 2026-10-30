const { tavily } = require('@tavily/core');

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

const TIME_SENSITIVE_PATTERNS = [
  /\b(today|tonight|now|current|currently|latest|recent|recently|breaking|live|just announced)\b/i,
  /\b(news|headline|weather|forecast|price|stock|market|score|election|release|update)\b/i,
  /\b(20\d{2})\b/,
  /\b(who won|what happened|how much is|how much does|when is|when did)\b/i,
  /\b(who is the .* (now|today|currently))\b/i,
  /\b(next|previous|upcoming|fixture|fixtures|match result|schedule)\b/i,
  /\b(appointed|sacked|fired|resigned|hired|named)\b/i,
];

const FIXTURE_PATTERNS = [
  /\b(fixture|fixtures|schedule|next match|upcoming|play(ing)? next|next \d+)\b/i,
];

const FIXTURE_DOMAINS = [
  'chelseafc.com',
  'premierleague.com',
  'bbc.com',
  'bbc.co.uk',
  'espn.com',
];

const needsSearch = (message) => {
  if (!message || message.trim().length < 5) return false;
  return TIME_SENSITIVE_PATTERNS.some((re) => re.test(message));
};

const isFixtureQuery = (query) => {
  if (!query) return false;
  return FIXTURE_PATTERNS.some((re) => re.test(query));
};

const buildSearchQuery = (originalQuery, fixtureMode) => {
  if (!fixtureMode) return originalQuery;
  const today = new Date();
  const monthYear = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return `${originalQuery} ${monthYear} fixtures`;
};

const extractDomains = (results) => {
  const set = new Set();
  for (const r of results) {
    try {
      const host = new URL(r.url).hostname.replace(/^www\./, '');
      if (host) set.add(host);
    } catch {}
  }
  return [...set];
};

const searchWeb = async (query, opts = {}) => {
  try {
    const today = new Date();
    const fixtureMode = isFixtureQuery(query);
    const lookbackDays = opts.lookbackDays || (fixtureMode ? 60 : 14);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - lookbackDays);

    const finalQuery = buildSearchQuery(query, fixtureMode);

    const searchOptions = {
      searchDepth: 'advanced',
      maxResults: 6,
      includeAnswer: false,
      include_published_date: true,
      include_raw_content: true,
      topic: fixtureMode ? 'general' : 'news',
      filter_by_published_date: false,
    };

    if (fixtureMode) {
      searchOptions.include_domains = FIXTURE_DOMAINS;
    } else {
      searchOptions.start_date = startDate.toISOString().slice(0, 10);
      searchOptions.end_date = today.toISOString().slice(0, 10);
    }

    const response = await client.search(finalQuery, searchOptions);

    const rawResults = response.results || [];

    const results = rawResults.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content || '',
      raw_content: r.raw_content || null,
      published_date: r.published_date || null,
      score: r.score || 0,
    }));

    const domains = extractDomains(results);

    return { results, fixtureMode, finalQuery, domains };
  } catch (err) {
    console.error('Tavily search failed:', err.message);
    return { results: [], fixtureMode: false, finalQuery: query, domains: [] };
  }
};

const buildSearchContext = (searchData) => {
  if (!searchData || !searchData.results || searchData.results.length === 0) {
    return '';
  }

  const { results, fixtureMode } = searchData;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const parts = ['=== REAL-TIME WEB SEARCH RESULTS ==='];
  parts.push(`Current date: ${todayStr}`);
  if (fixtureMode) parts.push('Query type: fixtures/schedule (official sources)');

  parts.push('\nSources:');
  results.forEach((r, i) => {
    const dateStr = r.published_date
      ? `Published: ${r.published_date.slice(0, 16)}`
      : 'REFERENCE PAGE (no publish date)';

    const body = r.raw_content
      ? r.raw_content.slice(0, 8000)
      : r.content.slice(0, 3000);

    parts.push(
      `\n[${i + 1}] ${r.title}\n` +
        `Date: ${dateStr}\n` +
        `Content: ${body}\n` +
        `URL: ${r.url}`
    );
  });

  parts.push(`
=== END WEB SEARCH RESULTS ===

STRICT RULES:
- Answer ONLY from the sources above.
- NEVER invent scores, opponents, venues, or dates that don't appear in the sources.
- If you are not 100% certain of a detail, say "I don't have that confirmed."

SOURCE RELIABILITY:
- Sources labeled "REFERENCE PAGE" are official fixture/schedule pages. They are CURRENT even without a publish date. Trust them for fixtures and schedules.
- Sources with a published date are news articles. Prefer these for match reports and current events.

FIXTURE EXTRACTION:
- For "next fixtures" questions, extract ALL upcoming match dates from the source content.
- Look for patterns like "Sat 21 Nov 2026", "Sun 08 Nov 2026", "Fri 27 Nov 2026" in the content.
- Format each fixture as: Date | Opponent | Home/Away | Competition | Time
- Determine Home/Away by order: "Chelsea vs X" = Home, "X vs Chelsea" = Away.
- List them in chronological order, starting from the earliest upcoming match.
- Include at least 3 fixtures if the content lists them.

SPORTS / MATCH RULES:
- Always report the FULL match outcome, not just the 90-minute score.
- If a match went to extra time, state the score after 90 minutes AND after extra time.
- If a match went to a penalty shootout, report: 90-min score, penalty shootout score, who won and advanced, the decisive taker or misser if mentioned.
- Include the competition name and the venue if available.
- For "previous match" questions, identify the most recent COMPLETED match by date, regardless of competition.

FAILURE RULE:
- If the sources genuinely do not contain the answer, say: "I couldn't find that in current sources."
`);

  return parts.join('\n');
};

module.exports = { searchWeb, needsSearch, buildSearchContext, isFixtureQuery, FIXTURE_DOMAINS };