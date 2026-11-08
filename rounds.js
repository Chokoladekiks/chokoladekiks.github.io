// A round is one session (e.g. a 2-hour evening), so only a long break starts a new one by
// itself; quiet spells inside a session must not split it. "Ny runde" still starts one by hand.
const ROUND_GAP = 3 * 60 * 60;

function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
}

function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

function readLog() {
    return readStore('log');
}

// New round after ROUND_GAP seconds without entries, or at a log index stored by "Ny runde".
function splitRounds(log, manualStarts) {
    const rounds = [];
    log.forEach((entry, i) => {
        if (i === 0 || entry[0] - log[i - 1][0] >= ROUND_GAP || manualStarts.includes(i)) {
            rounds.push([]);
        }
        rounds[rounds.length - 1].push(entry);
    });
    if (log.length > 0 && manualStarts.includes(log.length)) rounds.push([]);
    return rounds;
}

function getRounds() {
    return splitRounds(readLog(), readStore('roundStarts'));
}

// Log entries are [time, gender, change] or, for people already there when counting
// started, [time, gender, count, 'start']. Start entries count as present and in the totals,
// but not as having come during the round.
function isStart(entry) {
    return entry[3] === 'start';
}

function summarize(entries) {
    const s = { male: 0, female: 0, totalMale: 0, totalFemale: 0, startMale: 0, startFemale: 0 };
    for (const entry of entries) {
        const [, g, d] = entry;
        const G = g === 'male' ? 'Male' : 'Female';
        s[g] += d;
        if (isStart(entry)) {
            s['start' + G] += d;
            s['total' + G] += d;
        } else if (d > 0) {
            s['total' + G]++;
        }
    }
    return s;
}
