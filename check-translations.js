// Simple script to check if all translation keys are defined
const fs = require('fs');
const path = require('path');

// Read the language provider file
const languageProviderContent = fs.readFileSync(path.join(__dirname, 'components', 'language-provider.tsx'), 'utf8');

// Extract all translation keys
const extractKeys = (content) => {
  const enMatch = content.match(/en:\s*{([^}]*)}/s);
  const trMatch = content.match(/tr:\s*{([^}]*)}/s);
  
  if (!enMatch || !trMatch) {
    console.error('Could not find translation objects');
    return { enKeys: [], trKeys: [] };
  }
  
  const enContent = enMatch[1];
  const trContent = trMatch[1];
  
  const keyRegex = /(\w+):\s*"/g;
  
  const enKeys = [];
  let match;
  while ((match = keyRegex.exec(enContent)) !== null) {
    enKeys.push(match[1]);
  }
  
  keyRegex.lastIndex = 0;
  const trKeys = [];
  while ((match = keyRegex.exec(trContent)) !== null) {
    trKeys.push(match[1]);
  }
  
  return { enKeys, trKeys };
};

const { enKeys, trKeys } = extractKeys(languageProviderContent);

console.log('English keys:', enKeys.length);
console.log('Turkish keys:', trKeys.length);

// Check for missing keys
const missingInTr = enKeys.filter(key => !trKeys.includes(key));
const missingInEn = trKeys.filter(key => !enKeys.includes(key));

if (missingInTr.length > 0) {
  console.log('Keys missing in Turkish translation:', missingInTr);
}

if (missingInEn.length > 0) {
  console.log('Keys missing in English translation:', missingInEn);
}

// Check for specific keys
const keysToCheck = [
  'matchesCount',
  'standingsComparison',
  'positionRank',
  'standingsPositionDifference',
  'pointsCount',
  'matchesPlayed',
  'winsShort',
  'drawsShort',
  'lossesShort',
  'goalsForShort',
  'goalsAgainstShort',
  'noMatchStatsFound',
  'matchStatusDisplayFirstHalf',
  'matchStatusDisplayHalfTime',
  'matchStatusDisplaySecondHalf',
  'matchStatusDisplayFullTime',
  'matchStatusDisplayLive',
  'loadingLiveMatchesStatus',
  'filterByTeamName',
  'filterByLeagueName',
  'filterByCountryName',
  'upcomingMatchNotFound',
  'upcomingMatchLoadError',
  'tryAgain',
  'noFinishedMatchToday',
  'finishedMatchLoadError',
  'noFinishedMatchesYesterday',
  'noFinishedMatchesToday',
  'matchesWillAppear',
  'loadMoreMatches'
];

console.log('\nChecking for specific keys:');
keysToCheck.forEach(key => {
  console.log(`${key}: EN=${enKeys.includes(key)}, TR=${trKeys.includes(key)}`);
}); 