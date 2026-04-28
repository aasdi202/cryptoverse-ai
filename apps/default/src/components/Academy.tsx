import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock, PlayCircle, ArrowRight, Star, Zap, Shield, TrendingUp, BarChart2, Award, ChevronLeft, FlaskConical, ShoppingBag, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAcademyStore } from '@/lib/academyStore';
import { useStrategyStore } from '@/lib/strategyStore';

// ── §4.3 Academy × Marketplace section ───────────────────────────────────────

const XP_FIRST_PUBLISH = 500;
const XP_FIRST_PURCHASE = 150;
const XP_TUTORIAL_READ  = 100;

const TUTORIAL_STEPS = [
  { icon: '📋', title: 'Define your strategy', desc: 'Name, type (Grid/DCA/Martingale), risk level and tags' },
  { icon: '💻', title: 'Write your configuration', desc: 'Use JSON to define entry/exit conditions and parameters' },
  { icon: '🔬', title: 'Run a backtest', desc: 'Validate performance: must be ≥50% win rate & ≤30% drawdown' },
  { icon: '💰', title: 'Set your price', desc: 'Free to 2,500 CP. You earn 80% of every sale' },
  { icon: '🚀', title: 'Submit for review', desc: 'Admins review within 24–48h. Once approved you earn from every sale!' },
];

function AcademyMarketplaceSection({ totalXP, awardXP }: { totalXP: number; awardXP: (id: string, xp: number) => void }) {
  const navigate = useNavigate();
  const strategies = useStrategyStore(s => s.strategies);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialXPClaimed, setTutorialXPClaimed] = useState(false);

  // Pick "strategy of the week" — best rated published strategy
  const sotw = useMemo(() =>
    Object.values(strategies)
      .filter(s => s.isPublished)
      .sort((a, b) => b.rating - a.rating || b.totalSales - a.totalSales)[0] ?? null,
    [strategies]
  );

  const handleTutorialComplete = () => {
    if (!tutorialXPClaimed) {
      awardXP('mkt_tutorial', XP_TUTORIAL_READ);
      setTutorialXPClaimed(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* §4.3.1 Strategy of the Week */}
      {sotw && (
        <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5"
            style={{ background: 'linear-gradient(135deg,rgba(255,215,0,0.08),transparent)' }}>
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="font-bold text-sm">Strategy of the Week</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)' }}>
              ⭐ Featured
            </span>
          </div>
          <div className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.18)' }}>
              📊
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{sotw.name}</p>
              <p className="text-xs text-muted-foreground">by {sotw.creatorName}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-yellow-400">
                  <Star className="h-3 w-3 fill-yellow-400" /> {sotw.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">WR: {sotw.winRate.toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground">+{sotw.totalProfitPct.toFixed(1)}% return</span>
                <span className="text-xs font-bold" style={{ color: sotw.isFree ? '#34d399' : '#FFD700' }}>
                  {sotw.isFree ? 'FREE' : `${sotw.price.toLocaleString()} CP`}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/marketplace/${sotw.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all"
              style={{ background: 'rgba(255,215,0,0.10)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.20)' }}
            >
              <ShoppingBag className="h-4 w-4" /> View
            </button>
          </div>
        </div>
      )}

      {/* §4.3.2 Publish tutorial + XP reward */}
      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">How to Publish a Strategy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              +{XP_TUTORIAL_READ} XP
            </span>
            <button
              onClick={() => { setShowTutorial(v => !v); if (!showTutorial) handleTutorialComplete(); }}
              className="text-xs font-semibold text-primary"
            >
              {showTutorial ? 'Collapse' : 'Read Guide →'}
            </button>
          </div>
        </div>

        {showTutorial && (
          <div className="p-5 space-y-3">
            {TUTORIAL_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-card/50">
                <span className="text-xl shrink-0">{step.icon}</span>
                <div>
                  <p className="font-semibold text-sm">
                    <span className="text-muted-foreground mr-2">Step {i + 1}.</span>{step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div>
                <p className="font-bold text-sm" style={{ color: '#FFD700' }}>🎉 First Strategy Published</p>
                <p className="text-xs text-muted-foreground">Earn {XP_FIRST_PUBLISH} XP when your first strategy gets approved</p>
              </div>
              <span className="font-bold text-sm" style={{ color: '#FFD700' }}>+{XP_FIRST_PUBLISH} XP</span>
            </div>

            <button
              onClick={() => navigate('/marketplace/create')}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg,#FFD700,#FFA800)', color: '#0A1929' }}
            >
              <ShoppingBag className="h-4 w-4" /> Start Creating Your Strategy
            </button>
          </div>
        )}
      </div>

      {/* §4.3.3 XP milestones for marketplace activity */}
      <div className="bg-card border border-white/10 rounded-2xl p-4">
        <p className="font-bold text-sm mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Marketplace XP Rewards
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'First Purchase', xp: XP_FIRST_PURCHASE, emoji: '🛒' },
            { label: 'Tutorial Read',  xp: XP_TUTORIAL_READ,  emoji: '📚' },
            { label: 'First Publish',  xp: XP_FIRST_PUBLISH,  emoji: '🚀' },
            { label: 'First Review',   xp: 50,                 emoji: '⭐' },
          ].map(r => (
            <div key={r.label} className="flex flex-col items-center gap-1 p-3 rounded-xl border border-white/5 text-center">
              <span className="text-xl">{r.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{r.label}</span>
              <span className="text-xs font-bold text-primary">+{r.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  quiz: QuizQuestion;
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  xp: number;
  lessons: Lesson[];
  requiredXP: number;
}

const MODULES: Module[] = [
  {
    id: 'blockchain-basics',
    title: 'Blockchain Basics',
    description: 'Understand the foundational technology powering all cryptocurrencies.',
    icon: Shield,
    color: 'from-blue-500/20 to-cyan-500/10',
    xp: 500,
    requiredXP: 0,
    lessons: [
      {
        id: 'l1', title: 'What is a Blockchain?',
        content: 'A blockchain is a distributed ledger — a chain of blocks, each containing transaction data. No single entity controls it. Once data is written, it cannot be altered without consensus from the network. This immutability is what gives Bitcoin and other cryptocurrencies their trustless security.',
        quiz: { question: 'What makes blockchain data immutable?', options: ['A central server protects it', 'Network consensus and cryptographic hashing', 'Government regulation', 'The blockchain company controls it'], correct: 1, explanation: 'Blockchain data is secured through cryptographic hashing and requires network-wide consensus to alter, making it nearly impossible to tamper with.' }
      },
      {
        id: 'l2', title: 'How Mining Works',
        content: 'Mining is the process of validating new transactions and adding them to the blockchain. Miners compete to solve a cryptographic puzzle (Proof of Work). The winner adds the next block and receives a block reward. This process is energy-intensive by design — it makes attacks economically prohibitive.',
        quiz: { question: 'What do miners receive for successfully adding a block?', options: ['Government subsidy', 'Block reward (new coins + fees)', 'Access to private keys', 'A faster internet connection'], correct: 1, explanation: 'Miners earn newly minted cryptocurrency plus transaction fees from all transactions included in their block — this is their economic incentive.' }
      },
      {
        id: 'l3', title: 'Public & Private Keys',
        content: 'Every wallet has a public key (your address, safe to share) and a private key (your secret, never share). The private key signs transactions to prove ownership. If you lose your private key, you lose access forever. "Not your keys, not your coins" is the golden rule of self-custody.',
        quiz: { question: 'Which key should NEVER be shared?', options: ['Public key', 'Both keys', 'Private key', 'Wallet address'], correct: 2, explanation: 'Your private key is the master password to your funds. Anyone with it can move your crypto. Your public key/address is safe to share — it\'s how others send you funds.' }
      },
    ]
  },
  {
    id: 'market-analysis',
    title: 'Market Analysis',
    description: 'Read charts, identify trends and make data-driven trading decisions.',
    icon: TrendingUp,
    color: 'from-green-500/20 to-emerald-500/10',
    xp: 750,
    requiredXP: 500,
    lessons: [
      {
        id: 'l4', title: 'Reading Candlestick Charts',
        content: 'Each candle shows 4 prices: Open, High, Low, Close. A green candle means price closed higher than it opened (bullish). A red candle means it closed lower (bearish). The wicks show the full range of price movement. Patterns like Doji, Hammer, and Engulfing are signals traders use to predict reversals.',
        quiz: { question: 'What does a long lower wick on a candle suggest?', options: ['Strong selling pressure', 'Buyers rejected lower prices — bullish signal', 'Price did not move', 'High trading volume'], correct: 1, explanation: 'A long lower wick means sellers pushed price down significantly, but buyers stepped in and pushed it back up — a sign of buyer strength at that level.' }
      },
      {
        id: 'l5', title: 'Support & Resistance',
        content: 'Support is a price level where buying pressure historically exceeds selling — price tends to bounce. Resistance is the opposite — where selling pressure dominates. When price breaks through resistance, that level often becomes new support. These zones are the backbone of most trading strategies.',
        quiz: { question: 'What happens when price breaks through a resistance level?', options: ['The market crashes', 'Resistance often becomes new support', 'Trading volume drops to zero', 'The exchange halts trading'], correct: 1, explanation: 'When price breaks a resistance level, market psychology shifts — that price that was once a ceiling now acts as a floor (support), as traders view it as a fair value zone.' }
      },
      {
        id: 'l6', title: 'RSI & MACD Indicators',
        content: 'RSI (Relative Strength Index) measures momentum on a 0-100 scale. Above 70 = overbought (potential sell signal). Below 30 = oversold (potential buy signal). MACD shows the relationship between two moving averages — a MACD line crossing above the signal line is bullish. These are confirmation tools, not standalone signals.',
        quiz: { question: 'An RSI reading of 25 suggests the asset is...', options: ['Overbought', 'Oversold — a potential buying opportunity', 'At fair value', 'About to crash'], correct: 1, explanation: 'RSI below 30 indicates oversold conditions — the asset may have been sold too aggressively and could be due for a reversal upward. Always confirm with other signals.' }
      },
    ]
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    description: 'Protect your capital with stop-losses, position sizing and leverage rules.',
    icon: BarChart2,
    color: 'from-orange-500/20 to-red-500/10',
    xp: 1000,
    requiredXP: 1250,
    lessons: [
      {
        id: 'l7', title: 'The 1% Rule',
        content: 'Never risk more than 1-2% of your total capital on a single trade. With $10,000, that means your maximum loss per trade is $100-$200. This sounds small, but it means you can absorb 50+ consecutive losses before going broke — giving your strategy time to prove itself. Professional traders live by this rule.',
        quiz: { question: 'With $50,000 capital, the max 1% risk per trade is?', options: ['$5,000', '$500', '$50', '$5'], correct: 1, explanation: '1% of $50,000 is $500. This means your stop-loss should be placed such that if hit, you lose no more than $500 on that position.' }
      },
      {
        id: 'l8', title: 'Leverage: A Double-Edged Sword',
        content: '10x leverage on $1,000 controls $10,000 of BTC. A 10% move in your favor = $1,000 profit (100% return). But a 10% move against you = $1,000 loss (liquidation). High leverage amplifies both wins and losses symmetrically. The higher the leverage, the smaller the price move needed to wipe you out. Start with 2-3x maximum.',
        quiz: { question: 'At 20x leverage, what % price move causes liquidation?', options: ['20%', '5%', '50%', '1%'], correct: 1, explanation: 'At 20x leverage, a 5% adverse price move will liquidate your position (1/20 = 5%). This is why extreme leverage is extremely dangerous.' }
      },
      {
        id: 'l9', title: 'Stop-Loss Strategies',
        content: 'A stop-loss is an automatic order to sell when price reaches a certain level — it caps your loss. Always set it before entering a trade, never move it further against you. Common placements: below the recent swing low (for longs), above the swing high (for shorts). The distance from entry to stop-loss defines your actual risk per trade.',
        quiz: { question: 'When should you set your stop-loss?', options: ['After the trade goes against you', 'Before entering the trade', 'When you feel worried', 'Stop-losses are optional'], correct: 1, explanation: 'Stop-losses must be set BEFORE entering a trade. Setting them after introduces emotional bias — you\'ll tend to move them further away instead of cutting losses early.' }
      },
    ]
  },
  {
    id: 'defi-advanced',
    title: 'DeFi & Advanced',
    description: 'Dive into DeFi protocols, yield farming, and advanced on-chain strategies.',
    icon: Zap,
    color: 'from-purple-500/20 to-pink-500/10',
    xp: 1500,
    requiredXP: 2250,
    lessons: [
      {
        id: 'l10', title: 'What is DeFi?',
        content: 'Decentralized Finance (DeFi) replaces traditional financial intermediaries (banks, brokers) with smart contracts on a blockchain. You can lend, borrow, trade, and earn yield without a bank account or credit check. Total Value Locked (TVL) in DeFi protocols has reached hundreds of billions of dollars, representing an entirely parallel financial system.',
        quiz: { question: 'What do smart contracts replace in DeFi?', options: ['Cryptocurrencies', 'Traditional financial intermediaries like banks', 'The internet', 'Government currency'], correct: 1, explanation: 'Smart contracts are self-executing programs on the blockchain that automate financial agreements — eliminating the need for banks, brokers, and other intermediaries.' }
      },
      { id: 'l11', title: 'Liquidity Pools & AMMs', content: 'Automated Market Makers (AMMs) use liquidity pools instead of order books. Providers deposit token pairs and earn fees from every swap. Price is determined by a formula (e.g., x*y=k). Impermanent loss occurs when token ratios shift — your LP position may be worth less than simply holding the tokens separately.', quiz: { question: 'What is impermanent loss?', options: ['Losing your private key', 'LP value loss due to token ratio shifts vs. holding', 'Exchange hack losses', 'Gas fee accumulation'], correct: 1, explanation: 'Impermanent loss happens when the price ratio of your deposited tokens changes after you provide liquidity. If BTC doubles vs ETH, you\'d have been better off just holding.' } },
      { id: 'l12', title: 'Yield Farming Strategies', content: 'Yield farming involves maximizing returns by moving capital between DeFi protocols. Strategies include: providing liquidity for fee income, staking governance tokens for additional rewards, leveraged farming (borrowing to farm with more capital), and auto-compounding vaults that reinvest rewards automatically. Always assess smart contract risk.', quiz: { question: 'What is auto-compounding in yield farming?', options: ['Manually claiming rewards daily', 'Automatic reinvestment of earned rewards to maximize APY', 'A government tax strategy', 'Staking in government bonds'], correct: 1, explanation: 'Auto-compounding vaults automatically reinvest your earned rewards back into the farming strategy, applying compound interest continuously to maximize your Annual Percentage Yield.' } },
    ]
  },
];

type View = 'modules' | 'lesson' | 'quiz' | 'result';

export function Academy() {
  // Persistent XP + progress from Zustand store (P3-A)
  const { totalXP, completedLessons, awardXP } = useAcademyStore();

  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [view, setView] = useState<View>('modules');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const levelInfo = totalXP < 500 ? { name: 'Novice', max: 500 }
    : totalXP < 1250 ? { name: 'Apprentice', max: 1250 }
    : totalXP < 2250 ? { name: 'Analyst', max: 2250 }
    : { name: 'Pro Trader', max: 4000 };

  const levelProgress = Math.min(100, (totalXP / levelInfo.max) * 100);

  const openLesson = (mod: Module, lesson: Lesson) => {
    setActiveModule(mod);
    setActiveLesson(lesson);
    setSelectedAnswer(null);
    setShowResult(false);
    setView('lesson');
  };

  const startQuiz = () => setView('quiz');

  const submitAnswer = (idx: number) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);

    if (idx === activeLesson!.quiz.correct) {
      const gained = Math.floor(activeModule!.xp / activeModule!.lessons.length);
      const isFirstTime = !completedLessons.has(activeLesson!.id);
      // awardXP is idempotent — safe to call; XP only added on first correct answer
      awardXP(activeLesson!.id, gained);
      setXpGained(isFirstTime ? gained : 0);
    } else {
      setXpGained(0);
    }
  };

  const goBackToModule = () => {
    setView('modules');
    setActiveModule(null);
    setActiveLesson(null);
  };

  // — QUIZ VIEW —
  if (view === 'quiz' && activeLesson) {
    const q = activeLesson.quiz;
    const isCorrect = selectedAnswer === q.correct;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => setView('lesson')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ChevronLeft className="h-4 w-4" /> Back to lesson
        </button>
        <div className="bg-card border border-white/5 rounded-2xl p-8 shadow-xl">
          <div className="mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Knowledge Check</p>
            <h3 className="text-xl font-bold">{q.question}</h3>
          </div>
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOpt = idx === q.correct;
              return (
                <button
                  key={idx}
                  onClick={() => submitAnswer(idx)}
                  disabled={showResult}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-300 text-sm font-medium",
                    !showResult && "hover:border-primary/50 hover:bg-primary/5",
                    !showResult && "bg-secondary/20 border-white/10",
                    showResult && isCorrectOpt && "bg-green-500/20 border-green-500/50 text-green-300",
                    showResult && isSelected && !isCorrectOpt && "bg-red-500/20 border-red-500/50 text-red-300",
                    showResult && !isSelected && !isCorrectOpt && "bg-secondary/10 border-white/5 opacity-50"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0",
                      showResult && isCorrectOpt ? "border-green-500 text-green-400" : showResult && isSelected && !isCorrectOpt ? "border-red-500 text-red-400" : "border-white/20"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className={cn("mt-6 p-4 rounded-xl border animate-in fade-in duration-300", isCorrect ? "bg-green-500/10 border-green-500/20" : "bg-orange-500/10 border-orange-500/20")}>
              <p className={cn("font-semibold mb-1", isCorrect ? "text-green-400" : "text-orange-400")}>
                {isCorrect ? `✓ Correct! ${xpGained > 0 ? `+${xpGained} XP earned!` : 'Already completed.'}` : '✗ Not quite — but you can learn from this.'}
              </p>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
              <button
                onClick={goBackToModule}
                className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-semibold transition-all active:scale-95"
              >
                Back to Modules
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // — LESSON VIEW —
  if (view === 'lesson' && activeLesson && activeModule) {
    const isDone = completedLessons.has(activeLesson.id);
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={goBackToModule} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ChevronLeft className="h-4 w-4" /> Back to Modules
        </button>
        <div className="bg-card border border-white/5 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{activeModule.title}</span>
            {isDone && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/20">✓ Completed</span>}
          </div>
          <h2 className="text-2xl font-bold mb-6">{activeLesson.title}</h2>
          <p className="text-muted-foreground leading-relaxed text-[15px]">{activeLesson.content}</p>

          {/* 9.3 — Backtest CTA: appears on market-analysis + risk-management modules */}
          {(activeModule.id === 'market-analysis' || activeModule.id === 'risk-management' || activeModule.id === 'defi-advanced') && (
            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <FlaskConical className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">Backtest Challenge</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  Apply what you've learned — run a real backtest and earn up to <strong className="text-foreground">+500 XP</strong>.
                </p>
                <Link
                  to="/backtest"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 transition-all"
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  Try this strategy in Backtest
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
            <button
              onClick={startQuiz}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              Take Knowledge Check <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // — MODULES VIEW —
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              CryptoVerse Academy
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">Earn XP to unlock higher leverage tiers and exclusive rewards.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Level</p>
              <p className="text-lg font-bold text-primary">{levelInfo.name}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total XP</p>
              <p className="text-lg font-bold">{totalXP.toLocaleString()}</p>
            </div>
            <div className="w-32">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(levelProgress)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* §4.3 Strategy of the Week + Create Tutorial + XP rewards */}
      <AcademyMarketplaceSection totalXP={totalXP} awardXP={awardXP} />

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((mod) => {
          const isUnlocked = totalXP >= mod.requiredXP;
          const completedCount = mod.lessons.filter(l => completedLessons.has(l.id)).length;
          const progress = (completedCount / mod.lessons.length) * 100;
          const Icon = mod.icon;

          return (
            <div
              key={mod.id}
              className={cn(
                "relative bg-card border rounded-2xl overflow-hidden transition-all duration-300",
                isUnlocked
                  ? "border-white/10 hover:border-primary/40 shadow-lg group cursor-pointer hover:-translate-y-1"
                  : "border-white/5 opacity-60 cursor-not-allowed"
              )}
            >
              {/* Gradient bg */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none", mod.color)} />

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>

              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-5">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    {!isUnlocked ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
                        <Lock className="h-3 w-3" /> {mod.requiredXP.toLocaleString()} XP
                      </span>
                    ) : completedCount === mod.lessons.length ? (
                      <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                        <Award className="h-3 w-3" /> Complete
                      </span>
                    ) : (
                      <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                        {completedCount}/{mod.lessons.length} done
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-1">{mod.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{mod.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-amber-500 flex items-center gap-1">
                    <Star className="h-4 w-4" /> +{mod.xp} XP
                  </span>
                  <span className="text-xs text-muted-foreground">{mod.lessons.length} Lessons</span>
                </div>

                {/* Lesson List */}
                {isUnlocked && (
                  <div className="space-y-2">
                    {mod.lessons.map((lesson, idx) => {
                      const done = completedLessons.has(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => openLesson(mod, lesson)}
                          className={cn(
                            "w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border text-sm",
                            done
                              ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                              : "bg-secondary/20 border-white/5 hover:bg-secondary/40 hover:border-white/10"
                          )}
                        >
                          {done
                            ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                            : <PlayCircle className="h-4 w-4 text-primary/70 flex-shrink-0" />}
                          <span className={cn("flex-1", done ? "text-green-300" : "text-foreground")}>
                            {idx + 1}. {lesson.title}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}