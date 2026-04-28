import { shouldRefetchScores } from '/src/stores/scoresStore.js';

const SCORES_URL = 'https://dz5rd0lqnb.execute-api.eu-central-1.amazonaws.com/Prod/scores';

/**
 * @param {number} score
 * @param {string} name
 * @param {string} round
 */
export async function submitScore(score, name, round) {
  if (name === '') {
    alert('Numele nu poate fi gol');
    return;
  }

  if (score < 0.01) {
    alert('Timpul nu poate fi 0');
    return;
  }

  const response = await fetch(SCORES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      score,
      name,
      round
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const responseData = await response.json();
  shouldRefetchScores.set(true);

  return responseData;
}
