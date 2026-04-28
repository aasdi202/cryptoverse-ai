import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CountryEntry {
  code: string;
  name: string;
  flag: string;
  traders: number;
  totalVolume: number;
  weeklyPnL: number;
  avgWinRate: number;
  topTrader: string;
  rank: number;
  prevRank: number;
  continent: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  rewardType: 'xp' | 'cp' | 'badge';
  progress: number;
  total: number;
  completed: boolean;
  expiresAt: number;
  icon: string;
}

export interface NationAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export interface NationMilestone {
  nationId: string;
  totalTrades: number;
  totalVolume: number;
  membersActive: number;
  weeklyWins: number;
  warWins: number;
}

interface NationsState {
  // Country leaderboard
  countryLeaderboard: CountryEntry[];
  countryFilter: string;        // continent filter
  countrySearch: string;
  setCountryFilter: (f: string) => void;
  setCountrySearch: (s: string) => void;

  // Weekly challenges (per-user)
  challenges: WeeklyChallenge[];
  claimChallenge: (id: string) => void;

  // Nation achievements
  achievements: NationAchievement[];
  unlockAchievement: (id: string) => void;

  // Nation milestones (live counters)
  milestones: Record<string, NationMilestone>;
  tickMilestone: (nationId: string) => void;
}

// ── Country Leaderboard Seed Data (top 40) ────────────────────────────────────

export const COUNTRY_LEADERBOARD: CountryEntry[] = [
  { code:'US', name:'United States',   flag:'🇺🇸', traders:48200, totalVolume:2_840_000_000, weeklyPnL:14.2,  avgWinRate:71.3, topTrader:'SatoshiNakamoto99', rank:1,  prevRank:1,  continent:'Americas' },
  { code:'CN', name:'China',           flag:'🇨🇳', traders:41500, totalVolume:2_210_000_000, weeklyPnL:11.8,  avgWinRate:68.9, topTrader:'DragonChain_Pro',   rank:2,  prevRank:3,  continent:'Asia'     },
  { code:'GB', name:'United Kingdom',  flag:'🇬🇧', traders:22100, totalVolume:1_380_000_000, weeklyPnL:16.4,  avgWinRate:73.1, topTrader:'LondonWhale',       rank:3,  prevRank:2,  continent:'Europe'   },
  { code:'JP', name:'Japan',           flag:'🇯🇵', traders:19800, totalVolume:1_190_000_000, weeklyPnL:9.7,   avgWinRate:69.5, topTrader:'NakamotoSan',        rank:4,  prevRank:4,  continent:'Asia'     },
  { code:'DE', name:'Germany',         flag:'🇩🇪', traders:17400, totalVolume:980_000_000,  weeklyPnL:12.1,  avgWinRate:70.8, topTrader:'BerlinBull',         rank:5,  prevRank:6,  continent:'Europe'   },
  { code:'KR', name:'South Korea',     flag:'🇰🇷', traders:16200, totalVolume:940_000_000,  weeklyPnL:18.3,  avgWinRate:74.2, topTrader:'KimCryptoKing',      rank:6,  prevRank:5,  continent:'Asia'     },
  { code:'IN', name:'India',           flag:'🇮🇳', traders:31500, totalVolume:820_000_000,  weeklyPnL:22.1,  avgWinRate:65.7, topTrader:'MumbaiMoonshot',     rank:7,  prevRank:9,  continent:'Asia'     },
  { code:'SG', name:'Singapore',       flag:'🇸🇬', traders:9400,  totalVolume:760_000_000,  weeklyPnL:19.8,  avgWinRate:76.4, topTrader:'SingaporeQuant',     rank:8,  prevRank:7,  continent:'Asia'     },
  { code:'CA', name:'Canada',          flag:'🇨🇦', traders:14800, totalVolume:680_000_000,  weeklyPnL:10.5,  avgWinRate:69.2, topTrader:'MapleSatoshi',       rank:9,  prevRank:8,  continent:'Americas' },
  { code:'AU', name:'Australia',       flag:'🇦🇺', traders:11200, totalVolume:590_000_000,  weeklyPnL:13.4,  avgWinRate:71.0, topTrader:'AussieAlgo',         rank:10, prevRank:11, continent:'Oceania'  },
  { code:'FR', name:'France',          flag:'🇫🇷', traders:12900, totalVolume:540_000_000,  weeklyPnL:8.9,   avgWinRate:67.8, topTrader:'ParisTrader',        rank:11, prevRank:10, continent:'Europe'   },
  { code:'RU', name:'Russia',          flag:'🇷🇺', traders:18400, totalVolume:510_000_000,  weeklyPnL:-2.1,  avgWinRate:64.3, topTrader:'MoscowBear',         rank:12, prevRank:12, continent:'Europe'   },
  { code:'BR', name:'Brazil',          flag:'🇧🇷', traders:21300, totalVolume:480_000_000,  weeklyPnL:17.6,  avgWinRate:66.9, topTrader:'SaoPauloBull',       rank:13, prevRank:15, continent:'Americas' },
  { code:'NL', name:'Netherlands',     flag:'🇳🇱', traders:8200,  totalVolume:460_000_000,  weeklyPnL:15.2,  avgWinRate:72.5, topTrader:'AmsterdamArb',       rank:14, prevRank:13, continent:'Europe'   },
  { code:'CH', name:'Switzerland',     flag:'🇨🇭', traders:7100,  totalVolume:430_000_000,  weeklyPnL:11.4,  avgWinRate:75.1, topTrader:'SwissQuant',         rank:15, prevRank:14, continent:'Europe'   },
  { code:'AE', name:'UAE',             flag:'🇦🇪', traders:10800, totalVolume:410_000_000,  weeklyPnL:20.3,  avgWinRate:70.2, topTrader:'DubaiWhale',         rank:16, prevRank:18, continent:'Asia'     },
  { code:'ES', name:'Spain',           flag:'🇪🇸', traders:9600,  totalVolume:380_000_000,  weeklyPnL:7.8,   avgWinRate:66.4, topTrader:'BarcelonaLong',      rank:17, prevRank:16, continent:'Europe'   },
  { code:'IT', name:'Italy',           flag:'🇮🇹', traders:8900,  totalVolume:360_000_000,  weeklyPnL:6.2,   avgWinRate:65.8, topTrader:'RomeBull',           rank:18, prevRank:17, continent:'Europe'   },
  { code:'SE', name:'Sweden',          flag:'🇸🇪', traders:6400,  totalVolume:340_000_000,  weeklyPnL:14.8,  avgWinRate:73.7, topTrader:'StockholmSigma',     rank:19, prevRank:20, continent:'Europe'   },
  { code:'MX', name:'Mexico',          flag:'🇲🇽', traders:13200, totalVolume:310_000_000,  weeklyPnL:15.9,  avgWinRate:64.1, topTrader:'MexicoMoonshot',     rank:20, prevRank:19, continent:'Americas' },
  { code:'TR', name:'Turkey',          flag:'🇹🇷', traders:17800, totalVolume:290_000_000,  weeklyPnL:24.7,  avgWinRate:62.8, topTrader:'IstanbulBull',       rank:21, prevRank:25, continent:'Europe'   },
  { code:'PL', name:'Poland',          flag:'🇵🇱', traders:8100,  totalVolume:270_000_000,  weeklyPnL:13.1,  avgWinRate:68.3, topTrader:'WarsawWolf',         rank:22, prevRank:22, continent:'Europe'   },
  { code:'ID', name:'Indonesia',       flag:'🇮🇩', traders:22400, totalVolume:250_000_000,  weeklyPnL:19.4,  avgWinRate:61.7, topTrader:'JakartaJager',       rank:23, prevRank:23, continent:'Asia'     },
  { code:'SA', name:'Saudi Arabia',    flag:'🇸🇦', traders:9200,  totalVolume:240_000_000,  weeklyPnL:16.8,  avgWinRate:67.5, topTrader:'RiyadhRocket',       rank:24, prevRank:24, continent:'Asia'     },
  { code:'AR', name:'Argentina',       flag:'🇦🇷', traders:12700, totalVolume:220_000_000,  weeklyPnL:31.2,  avgWinRate:63.4, topTrader:'BuenosAiresBull',    rank:25, prevRank:28, continent:'Americas' },
  { code:'TH', name:'Thailand',        flag:'🇹🇭', traders:11400, totalVolume:210_000_000,  weeklyPnL:12.7,  avgWinRate:66.1, topTrader:'BangkokBull',        rank:26, prevRank:26, continent:'Asia'     },
  { code:'UA', name:'Ukraine',         flag:'🇺🇦', traders:8900,  totalVolume:190_000_000,  weeklyPnL:-4.2,  avgWinRate:63.9, topTrader:'KyivQuant',          rank:27, prevRank:27, continent:'Europe'   },
  { code:'PH', name:'Philippines',     flag:'🇵🇭', traders:14200, totalVolume:180_000_000,  weeklyPnL:21.5,  avgWinRate:61.2, topTrader:'ManilaMax',          rank:28, prevRank:30, continent:'Asia'     },
  { code:'VN', name:'Vietnam',         flag:'🇻🇳', traders:13800, totalVolume:170_000_000,  weeklyPnL:18.9,  avgWinRate:60.4, topTrader:'HanoiHodler',        rank:29, prevRank:29, continent:'Asia'     },
  { code:'NO', name:'Norway',          flag:'🇳🇴', traders:4800,  totalVolume:160_000_000,  weeklyPnL:10.3,  avgWinRate:72.9, topTrader:'OsloOracle',         rank:30, prevRank:31, continent:'Europe'   },
  { code:'ZA', name:'South Africa',    flag:'🇿🇦', traders:8400,  totalVolume:150_000_000,  weeklyPnL:9.8,   avgWinRate:64.7, topTrader:'CapeCharter',        rank:31, prevRank:32, continent:'Africa'   },
  { code:'NG', name:'Nigeria',         flag:'🇳🇬', traders:16400, totalVolume:140_000_000,  weeklyPnL:26.4,  avgWinRate:60.1, topTrader:'LagosLeverage',      rank:32, prevRank:35, continent:'Africa'   },
  { code:'MY', name:'Malaysia',        flag:'🇲🇾', traders:10200, totalVolume:130_000_000,  weeklyPnL:14.6,  avgWinRate:64.3, topTrader:'KualaLumpurKing',    rank:33, prevRank:33, continent:'Asia'     },
  { code:'PK', name:'Pakistan',        flag:'🇵🇰', traders:18900, totalVolume:120_000_000,  weeklyPnL:23.1,  avgWinRate:59.8, topTrader:'KarachiCrypto',      rank:34, prevRank:36, continent:'Asia'     },
  { code:'EG', name:'Egypt',           flag:'🇪🇬', traders:11200, totalVolume:110_000_000,  weeklyPnL:17.2,  avgWinRate:61.8, topTrader:'CairoChain',         rank:35, prevRank:34, continent:'Africa'   },
  { code:'CO', name:'Colombia',        flag:'🇨🇴', traders:8700,  totalVolume:100_000_000,  weeklyPnL:20.7,  avgWinRate:62.4, topTrader:'BogotaBull',         rank:36, prevRank:37, continent:'Americas' },
  { code:'IR', name:'Iran',            flag:'🇮🇷', traders:14600, totalVolume:95_000_000,   weeklyPnL:29.3,  avgWinRate:58.7, topTrader:'TehranTrader',       rank:37, prevRank:40, continent:'Asia'     },
  { code:'BD', name:'Bangladesh',      flag:'🇧🇩', traders:17300, totalVolume:88_000_000,   weeklyPnL:22.8,  avgWinRate:58.1, topTrader:'DhakaDegen',         rank:38, prevRank:38, continent:'Asia'     },
  { code:'AT', name:'Austria',         flag:'🇦🇹', traders:4200,  totalVolume:82_000_000,   weeklyPnL:9.4,   avgWinRate:70.6, topTrader:'ViennaVault',        rank:39, prevRank:39, continent:'Europe'   },
  { code:'NZ', name:'New Zealand',     flag:'🇳🇿', traders:3100,  totalVolume:74_000_000,   weeklyPnL:11.7,  avgWinRate:71.4, topTrader:'AucklandAlgo',       rank:40, prevRank:41, continent:'Oceania'  },
];

// ── Weekly Challenges ─────────────────────────────────────────────────────────

const INITIAL_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'c1', title: 'War Warrior',
    description: 'Win 10 trades while your Nation is in an active Faction War.',
    reward: '500 CP', rewardType: 'cp',
    progress: 6, total: 10, completed: false,
    expiresAt: Date.now() + 4 * 86_400_000, icon: '⚔️',
  },
  {
    id: 'c2', title: 'Volume King',
    description: 'Contribute $50,000 in trading volume to your Nation this week.',
    reward: '1,000 XP', rewardType: 'xp',
    progress: 50000, total: 50000, completed: false,
    expiresAt: Date.now() + 4 * 86_400_000, icon: '📊',
  },
  {
    id: 'c3', title: 'Win Streak',
    description: 'Achieve a 5-trade win streak for your Nation.',
    reward: 'Gold Badge', rewardType: 'badge',
    progress: 3, total: 5, completed: false,
    expiresAt: Date.now() + 4 * 86_400_000, icon: '🔥',
  },
  {
    id: 'c4', title: 'Social Butterfly',
    description: 'Send 20 messages in your Nation\'s chat room.',
    reward: '250 XP', rewardType: 'xp',
    progress: 20, total: 20, completed: false,
    expiresAt: Date.now() + 4 * 86_400_000, icon: '💬',
  },
  {
    id: 'c5', title: 'Recruiter',
    description: 'Refer 1 new trader to join your Nation.',
    reward: '750 CP', rewardType: 'cp',
    progress: 0, total: 1, completed: false,
    expiresAt: Date.now() + 4 * 86_400_000, icon: '👥',
  },
];

// ── Nation Achievements ───────────────────────────────────────────────────────

const INITIAL_ACHIEVEMENTS: NationAchievement[] = [
  { id: 'a1', title: 'First Blood',         description: 'Win your first trade as a Nation member.',                icon: '🩸', unlockedAt: Date.now() - 86_400_000 * 3, rarity: 'common',    xpReward: 200  },
  { id: 'a2', title: 'War Veteran',         description: 'Participate in 3 Faction Wars.',                         icon: '🎖️', unlockedAt: Date.now() - 86_400_000 * 1, rarity: 'rare',      xpReward: 500  },
  { id: 'a3', title: 'Nation Champion',     description: 'Finish a season in the Top 10 of the nation rankings.',  icon: '🏆', unlockedAt: null,                         rarity: 'epic',      xpReward: 1000 },
  { id: 'a4', title: 'Diamond Hands',       description: 'Hold a position open for more than 24 hours.',           icon: '💎', unlockedAt: Date.now() - 86_400_000 * 5, rarity: 'common',    xpReward: 150  },
  { id: 'a5', title: 'Century Club',        description: 'Execute 100 trades in a single season.',                 icon: '💯', unlockedAt: null,                         rarity: 'rare',      xpReward: 600  },
  { id: 'a6', title: 'Legendary Tactician', description: 'Achieve 90%+ win rate in a Faction War.',               icon: '👑', unlockedAt: null,                         rarity: 'legendary', xpReward: 2500 },
  { id: 'a7', title: 'Community Pillar',    description: 'Send 100 messages in your Nation\'s chat.',              icon: '🏛️', unlockedAt: null,                         rarity: 'common',    xpReward: 300  },
  { id: 'a8', title: 'Warlord',             description: 'Win 5 consecutive Faction Wars for your Nation.',        icon: '⚔️', unlockedAt: null,                         rarity: 'legendary', xpReward: 3000 },
];

// ── Store ─────────────────────────────────────────────────────────────────────

export const useNationsStore = create<NationsState>((set) => ({
  countryLeaderboard: COUNTRY_LEADERBOARD,
  countryFilter: 'All',
  countrySearch: '',
  setCountryFilter: (f) => set({ countryFilter: f }),
  setCountrySearch: (s) => set({ countrySearch: s }),

  challenges: INITIAL_CHALLENGES,
  claimChallenge: (id) =>
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === id ? { ...c, completed: true, progress: c.total } : c,
      ),
    })),

  achievements: INITIAL_ACHIEVEMENTS,
  unlockAchievement: (id) =>
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.id === id ? { ...a, unlockedAt: Date.now() } : a,
      ),
    })),

  milestones: {
    alpha: { nationId: 'alpha', totalTrades: 41820, totalVolume: 94_200_000, membersActive: 1842, weeklyWins: 312, warWins: 7 },
    bull:  { nationId: 'bull',  totalTrades: 38240, totalVolume: 88_500_000, membersActive: 2109, weeklyWins: 287, warWins: 5 },
    sigma: { nationId: 'sigma', totalTrades: 27600, totalVolume: 71_300_000, membersActive: 1204, weeklyWins: 198, warWins: 3 },
    bear:  { nationId: 'bear',  totalTrades: 19400, totalVolume: 58_900_000, membersActive: 891,  weeklyWins: 144, warWins: 2 },
  },
  tickMilestone: (nationId) =>
    set((state) => {
      const m = state.milestones[nationId];
      if (!m) return state;
      return {
        milestones: {
          ...state.milestones,
          [nationId]: { ...m, totalTrades: m.totalTrades + 1, weeklyWins: m.weeklyWins + 1 },
        },
      };
    }),
}));
