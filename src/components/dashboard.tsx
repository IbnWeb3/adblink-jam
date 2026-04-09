     1|'use client';
     2|
     3|import { useState, useEffect, useCallback, useRef } from 'react';
     4|import { useWallet, useConnection } from '@solana/wallet-adapter-react';
     5|import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
     6|import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
     7|import { getProgram, PROGRAM_ID } from '@/lib/anchor';
     8|import { BN } from '@project-serum/anchor';
     9|
    10|// SPL Token Program ID (constant — avoids deep internal imports)
    11|const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    12|
    13|// ─────────────────────────────────────────────────────────────────────────────
    14|// Utilities
    15|// ─────────────────────────────────────────────────────────────────────────────
    16|function isValidPublicKey(key: string): boolean {
    17|  try { new PublicKey(key); return true; } catch { return false; }
    18|}
    19|
    20|function shortKey(key: string): string {
    21|  return `${key.slice(0, 6)}…${key.slice(-4)}`;
    22|}
    23|
    24|// ─────────────────────────────────────────────────────────────────────────────
    25|// Types
    26|// ─────────────────────────────────────────────────────────────────────────────
    27|type TxStatus =
    28|  | { type: 'idle' }
    29|  | { type: 'loading'; message: string }
    30|  | { type: 'success'; message: string; sig: string }
    31|  | { type: 'error'; message: string };
    32|
    33|// ─────────────────────────────────────────────────────────────────────────────
    34|// Status Toast — auto-dismisses after 7 s on success/error
    35|// ─────────────────────────────────────────────────────────────────────────────
    36|function StatusToast({ status, onDismiss }: { status: TxStatus; onDismiss: () => void }) {
    37|  // Auto-dismiss
    38|  useEffect(() => {
    39|    if (status.type === 'success' || status.type === 'error') {
    40|      const t = setTimeout(onDismiss, 7000);
    41|      return () => clearTimeout(t);
    42|    }
    43|  }, [status, onDismiss]);
    44|
    45|  if (status.type === 'idle') return null;
    46|
    47|  const styles: Record<string, string> = {
    48|    loading: 'bg-blue-950/90 border-blue-500/40 text-blue-200',
    49|    success: 'bg-green-950/90 border-green-500/40 text-green-200',
    50|    error:   'bg-red-950/90 border-red-500/40 text-red-200',
    51|  };
    52|  const icons: Record<string, string> = { loading: '⏳', success: '✅', error: '❌' };
    53|  const titles: Record<string, string> = {
    54|    loading: 'Transaction Pending',
    55|    success: 'Transaction Confirmed',
    56|    error:   'Transaction Failed',
    57|  };
    58|
    59|  return (
    60|    <div
    61|      role="status"
    62|      aria-live="polite"
    63|      className={`fixed bottom-6 right-6 z-50 w-80 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all ${styles[status.type]}`}
    64|    >
    65|      <div className="flex items-start gap-3">
    66|        <span className="mt-0.5 text-xl">{icons[status.type]}</span>
    67|        <div className="flex-1 min-w-0">
    68|          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">
    69|            {titles[status.type]}
    70|          </p>
    71|          <p className="text-sm font-semibold leading-snug">{status.message}</p>
    72|          {status.type === 'success' && (
    73|            <a
    74|              href={`https://explorer.solana.com/tx/${status.sig}?cluster=devnet`}
    75|              target="_blank"
    76|              rel="noreferrer"
    77|              className="mt-1.5 inline-flex items-center gap-1 text-xs underline opacity-70 hover:opacity-100"
    78|            >
    79|              View on Solana Explorer ↗
    80|            </a>
    81|          )}
    82|          {status.type === 'loading' && (
    83|            <div className="mt-2 h-1 w-full rounded-full bg-blue-900 overflow-hidden">
    84|              <div className="h-full bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }} />
    85|            </div>
    86|          )}
    87|        </div>
    88|        {status.type !== 'loading' && (
    89|          <button
    90|            onClick={onDismiss}
    91|            aria-label="Dismiss"
    92|            className="ml-1 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs hover:bg-white/20 transition"
    93|          >
    94|            ✕
    95|          </button>
    96|        )}
    97|      </div>
    98|    </div>
    99|  );
   100|}
   101|
   102|// ─────────────────────────────────────────────────────────────────────────────
   103|// Profile Card
   104|// ─────────────────────────────────────────────────────────────────────────────
   105|function ProfileCard() {
   106|  const { publicKey, disconnect, wallet } = useWallet();
   107|  const { connection } = useConnection();
   108|  const [balance, setBalance] = useState<number | null>(null);
   109|  const [balanceLoading, setBalanceLoading] = useState(false);
   110|  const [copied, setCopied] = useState(false);
   111|
   112|  const fetchBalance = useCallback(async () => {
   113|    if (!publicKey) return;
   114|    setBalanceLoading(true);
   115|    try {
   116|      const lamports = await connection.getBalance(publicKey);
   117|      setBalance(lamports / LAMPORTS_PER_SOL);
   118|    } catch {
   119|      setBalance(null);
   120|    } finally {
   121|      setBalanceLoading(false);
   122|    }
   123|  }, [publicKey, connection]);
   124|
   125|  useEffect(() => {
   126|    fetchBalance();
   127|    const id = setInterval(fetchBalance, 15_000);
   128|    return () => clearInterval(id);
   129|  }, [fetchBalance]);
   130|
   131|  const handleCopy = useCallback(async () => {
   132|    if (!publicKey) return;
   133|    try {
   134|      await navigator.clipboard.writeText(publicKey.toString());
   135|      setCopied(true);
   136|      setTimeout(() => setCopied(false), 2000);
   137|    } catch { /* ignore */ }
   138|  }, [publicKey]);
   139|
   140|  if (!publicKey) return null;
   141|
   142|  const addr = publicKey.toString();
   143|  const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
   144|
   145|  return (
   146|    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
   147|      {/* Header */}
   148|      <div className="mb-5 flex items-center gap-3">
   149|        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-orange-500/20 text-xl ring-1 ring-purple-500/20">
   150|          👤
   151|        </div>
   152|        <div className="min-w-0 flex-1">
   153|          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
   154|            Connected via {wallet?.adapter.name ?? 'Wallet'}
   155|          </p>
   156|          <button
   157|            onClick={handleCopy}
   158|            title={copied ? 'Copied!' : `Copy address: ${addr}`}
   159|            className="mt-0.5 flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground transition hover:text-purple-400"
   160|          >
   161|            <span>{short}</span>
   162|            <span className="text-xs opacity-50">{copied ? '✅' : '⎘'}</span>
   163|          </button>
   164|        </div>
   165|      </div>
   166|
   167|      {/* Balance */}
   168|      <div className="mb-4 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 ring-1 ring-border/50">
   169|        <div>
   170|          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Devnet Balance</p>
   171|          <span className="mt-0.5 block font-mono text-xl font-bold text-purple-400">
   172|            {balanceLoading ? (
   173|              <span className="inline-block h-6 w-24 animate-pulse rounded bg-muted" />
   174|            ) : balance !== null ? (
   175|              `${balance.toFixed(4)} SOL`
   176|            ) : (
   177|              '—'
   178|            )}
   179|          </span>
   180|        </div>
   181|        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-xl">
   182|          ◎
   183|        </div>
   184|      </div>
   185|
   186|      {/* USD approximation note */}
   187|      <p className="mb-4 text-[11px] text-muted-foreground/50">
   188|        Devnet SOL has no real-world value.
   189|      </p>
   190|
   191|      {/* Actions */}
   192|      <div className="flex gap-2">
   193|        <button
   194|          onClick={fetchBalance}
   195|          disabled={balanceLoading}
   196|          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-background/50 py-2 text-xs font-medium text-muted-foreground transition hover:border-purple-500/50 hover:text-foreground disabled:opacity-40"
   197|        >
   198|          {balanceLoading ? (
   199|            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
   200|          ) : '↻'}{' '}
   201|          Refresh
   202|        </button>
   203|        <a
   204|          href={`https://explorer.solana.com/address/${addr}?cluster=devnet`}
   205|          target="_blank"
   206|          rel="noreferrer"
   207|          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-background/50 py-2 text-xs font-medium text-muted-foreground transition hover:border-blue-500/50 hover:text-blue-400"
   208|        >
   209|          ↗ Explorer
   210|        </a>
   211|        <button
   212|          onClick={disconnect}
   213|          className="flex flex-1 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/8 py-2 text-xs font-medium text-red-400/80 transition hover:bg-red-500/15 hover:text-red-400"
   214|        >
   215|          Disconnect
   216|        </button>
   217|      </div>
   218|    </div>
   219|  );
   220|}
   221|
   222|// ─────────────────────────────────────────────────────────────────────────────
   223|// Shared Field Component — with inline validation + mono option
   224|// ─────────────────────────────────────────────────────────────────────────────
   225|function Field({
   226|  label,
   227|  placeholder,
   228|  value,
   229|  onChange,
   230|  type = 'text',
   231|  hint,
   232|  error,
   233|  mono,
   234|}: {
   235|  label: string;
   236|  placeholder: string;
   237|  value: string;
   238|  onChange: (v: string) => void;
   239|  type?: string;
   240|  hint?: string;
   241|  error?: string | null;
   242|  mono?: boolean;
   243|}) {
   244|  const hasError = !!error;
   245|  return (
   246|    <div>
   247|      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
   248|      <input
   249|        type={type}
   250|        placeholder={placeholder}
   251|        value={value}
   252|        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
   253|        className={[
   254|          'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition',
   255|          mono ? 'font-mono' : '',
   256|          hasError
   257|            ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20'
   258|            : 'border-border focus:border-purple-500/60 focus:ring-purple-500/20',
   259|        ].join(' ')}
   260|        aria-invalid={hasError}
   261|      />
   262|      {hasError
   263|        ? <p className="mt-1 text-xs font-medium text-red-400">{error}</p>
   264|        : hint && <p className="mt-1 text-xs text-muted-foreground/60">{hint}</p>
   265|      }
   266|    </div>
   267|  );
   268|}
   269|
   270|// ─────────────────────────────────────────────────────────────────────────────
   271|// Vendor Panel — Create Campaign
   272|// ─────────────────────────────────────────────────────────────────────────────
   273|function VendorPanel({ onStatus }: { onStatus: (s: TxStatus) => void }) {
   274|  const wallet = useWallet();
   275|  const [amount, setAmount] = useState('');
   276|  const [campaignPda, setCampaignPda] = useState('');
   277|  const [escrow, setEscrow] = useState('');
   278|  const [vendorWallet, setVendorWallet] = useState('');
   279|  const [submitting, setSubmitting] = useState(false);
   280|
   281|  // Inline validation
   282|  const amountError =
   283|    amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
   284|      ? 'Enter a number greater than 0'
   285|      : null;
   286|  const campaignError = campaignPda && !isValidPublicKey(campaignPda) ? 'Invalid Solana address' : null;
   287|  const escrowError = escrow && !isValidPublicKey(escrow) ? 'Invalid Solana address' : null;
   288|  const vendorWalletError = vendorWallet && !isValidPublicKey(vendorWallet) ? 'Invalid Solana address' : null;
   289|
   290|  const canSubmit =
   291|    wallet.connected && !submitting &&
   292|    !!amount && !amountError &&
   293|    !!campaignPda && !campaignError &&
   294|    !!escrow && !escrowError &&
   295|    !!vendorWallet && !vendorWalletError;
   296|
   297|  const handleCreate = async () => {
   298|    if (!wallet.publicKey || !wallet.signTransaction) return;
   299|    const solAmount = parseFloat(amount);
   300|    setSubmitting(true);
   301|    onStatus({ type: 'loading', message: 'Creating campaign — approve in your wallet…' });
   302|    try {
   303|      const program = getProgram(wallet as Parameters<typeof getProgram>[0]);
   304|      const lamports = new BN(Math.round(solAmount * LAMPORTS_PER_SOL));
   305|      const sig = await program.rpc.createCampaign(lamports, {
   306|        accounts: {
   307|          vendor: wallet.publicKey,
   308|          campaign: new PublicKey(campaignPda),
   309|          escrowWallet: new PublicKey(escrow),
   310|          vendorWallet: new PublicKey(vendorWallet),
   311|          rent: SYSVAR_RENT_PUBKEY,
   312|          systemProgram: SystemProgram.programId,
   313|          tokenProgram: TOKEN_PROGRAM_ID,
   314|        },
   315|      });
   316|      onStatus({ type: 'success', message: `Campaign created! ${solAmount} SOL locked in escrow.`, sig });
   317|      setAmount(''); setCampaignPda(''); setEscrow(''); setVendorWallet('');
   318|    } catch (err) {
   319|      const msg = err instanceof Error ? err.message : String(err);
   320|      onStatus({ type: 'error', message: `Transaction failed: ${msg.slice(0, 120)}` });
   321|    } finally {
   322|      setSubmitting(false);
   323|    }
   324|  };
   325|
   326|  return (
   327|    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
   328|      <div className="mb-5 flex items-center gap-3">
   329|        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-lg">🏷️</span>
   330|        <div>
   331|          <h2 className="text-base font-bold text-foreground">Vendor Panel</h2>
   332|          <p className="text-xs text-muted-foreground">Lock SOL into a new ad campaign</p>
   333|        </div>
   334|        <span className="ml-auto rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-400">
   335|          createCampaign
   336|        </span>
   337|      </div>
   338|
   339|      <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) handleCreate(); }} className="space-y-4" noValidate>
   340|        <Field label="SOL Amount to Lock" placeholder="e.g. 1.5" value={amount} onChange={setAmount}
   341|          type="number" hint="Locked in escrow until the Admin pays out the influencer." error={amountError} />
   342|        <Field label="Campaign PDA Address" placeholder="BPw6hyaYnmVu…" value={campaignPda}
   343|          onChange={setCampaignPda} hint="The campaign account PDA derived from your program." error={campaignError} mono />
   344|        <Field label="Escrow Wallet Address" placeholder="BPw6hyaYnmVu…" value={escrow}
   345|          onChange={setEscrow} hint="The escrow token account that holds the locked SOL." error={escrowError} mono />
   346|        <Field label="Vendor Token Wallet (ATA)" placeholder="BPw6hyaYnmVu…" value={vendorWallet}
   347|          onChange={setVendorWallet} hint="Your associated token account." error={vendorWalletError} mono />
   348|
   349|        <button type="submit" disabled={!canSubmit}
   350|          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-400 hover:to-orange-300 disabled:cursor-not-allowed disabled:opacity-40">
   351|          {submitting ? (
   352|            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Waiting for approval…</>
   353|          ) : '🚀 Create Campaign'}
   354|        </button>
   355|        {!wallet.connected && <p className="text-center text-xs text-muted-foreground">Connect your wallet above to proceed.</p>}
   356|      </form>
   357|    </div>
   358|  );
   359|}
   360|
   361|// ─────────────────────────────────────────────────────────────────────────────
   362|// Admin Panel — Payout Influencer
   363|// ─────────────────────────────────────────────────────────────────────────────
   364|function AdminPanel({ onStatus }: { onStatus: (s: TxStatus) => void }) {
   365|  const wallet = useWallet();
   366|  const [campaign, setCampaign] = useState('');
   367|  const [escrow, setEscrow] = useState('');
   368|  const [influencer, setInfluencer] = useState('');
   369|  const [feeCollector, setFeeCollector] = useState('');
   370|  const [submitting, setSubmitting] = useState(false);
   371|
   372|  // Inline validation
   373|  const campaignError = campaign && !isValidPublicKey(campaign) ? 'Invalid Solana address' : null;
   374|  const escrowError = escrow && !isValidPublicKey(escrow) ? 'Invalid Solana address' : null;
   375|  const influencerError = influencer && !isValidPublicKey(influencer) ? 'Invalid Solana address' : null;
   376|  const feeError = feeCollector && !isValidPublicKey(feeCollector) ? 'Invalid Solana address' : null;
   377|
   378|  const canSubmit =
   379|    wallet.connected && !submitting &&
   380|    !!campaign && !campaignError &&
   381|    !!escrow && !escrowError &&
   382|    !!influencer && !influencerError &&
   383|    !!feeCollector && !feeError;
   384|
   385|  const handlePayout = async () => {
   386|    if (!wallet.publicKey || !wallet.signTransaction) return;
   387|    setSubmitting(true);
   388|    onStatus({ type: 'loading', message: 'Processing payout — approve in your wallet…' });
   389|    try {
   390|      const program = getProgram(wallet as Parameters<typeof getProgram>[0]);
   391|      const sig = await program.rpc.payoutInfluencer({
   392|        accounts: {
   393|          admin: wallet.publicKey,
   394|          campaign: new PublicKey(campaign),
   395|          escrowWallet: new PublicKey(escrow),
   396|          influencerWallet: new PublicKey(influencer),
   397|          feeCollector: new PublicKey(feeCollector),
   398|          tokenProgram: TOKEN_PROGRAM_ID,
   399|        },
   400|      });
   401|      onStatus({ type: 'success', message: 'Payout sent! 95% to influencer, 5% fee collected.', sig });
   402|      setCampaign(''); setEscrow(''); setInfluencer(''); setFeeCollector('');
   403|    } catch (err) {
   404|      const msg = err instanceof Error ? err.message : String(err);
   405|      onStatus({ type: 'error', message: `Transaction failed: ${msg.slice(0, 120)}` });
   406|    } finally {
   407|      setSubmitting(false);
   408|    }
   409|  };
   410|
   411|  return (
   412|    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
   413|      <div className="mb-5 flex items-center gap-3">
   414|        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-lg">🛡️</span>
   415|        <div>
   416|          <h2 className="text-base font-bold text-foreground">Admin Panel</h2>
   417|          <p className="text-xs text-muted-foreground">Pay influencer — 5% platform fee applied automatically</p>
   418|        </div>
   419|        <span className="ml-auto rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
   420|          payoutInfluencer
   421|        </span>
   422|      </div>
   423|
   424|      {/* Fee breakdown */}
   425|      <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-xs ring-1 ring-border/50">
   426|        <span className="text-base">💡</span>
   427|        <span className="text-muted-foreground">
   428|          Your contract automatically splits the escrow: <strong className="text-green-400">95%</strong> to the influencer, <strong className="text-orange-400">5%</strong> to the fee collector.
   429|        </span>
   430|      </div>
   431|
   432|      <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) handlePayout(); }} className="space-y-4" noValidate>
   433|        <Field label="Campaign Account Address" placeholder="BPw6hyaYnmVu…" value={campaign}
   434|          onChange={setCampaign} hint="The campaign PDA that holds the locked funds." error={campaignError} mono />
   435|        <Field label="Escrow Wallet Address" placeholder="BPw6hyaYnmVu…" value={escrow}
   436|          onChange={setEscrow} hint="The escrow token account to draw funds from." error={escrowError} mono />
   437|        <Field label="Influencer Wallet Address" placeholder="BPw6hyaYnmVu…" value={influencer}
   438|          onChange={setInfluencer} hint="The influencer's token wallet — receives 95% of the payout." error={influencerError} mono />
   439|        <Field label="Fee Collector Address" placeholder="BPw6hyaYnmVu…" value={feeCollector}
   440|          onChange={setFeeCollector} hint="The platform wallet that receives the 5% fee." error={feeError} mono />
   441|
   442|        <button type="submit" disabled={!canSubmit}
   443|          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-40">
   444|          {submitting ? (
   445|            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Waiting for approval…</>
   446|          ) : '💸 Pay Out Influencer'}
   447|        </button>
   448|        {!wallet.connected && <p className="text-center text-xs text-muted-foreground">Connect your wallet above to proceed.</p>}
   449|      </form>
   450|    </div>
   451|  );
   452|}
   453|
   454|// ─────────────────────────────────────────────────────────────────────────────
   455|// Main Dashboard
   456|// ─────────────────────────────────────────────────────────────────────────────
   457|export function AdBlinkDashboard() {
   458|  const { connected } = useWallet();
   459|  const [status, setStatus] = useState<TxStatus>({ type: 'idle' });
   460|
   461|  return (
   462|    <div className="flex min-h-screen flex-col bg-background">
   463|      {/* ── Navbar ── */}
   464|      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
   465|        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
   466|          <div className="flex items-center gap-3">
   467|            <span className="text-2xl">⚡</span>
   468|            <div>
   469|              <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
   470|                Ad-Blink
   471|              </span>
   472|              <span className="ml-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-400">
   473|                DEVNET
   474|              </span>
   475|            </div>
   476|          </div>
   477|          <WalletMultiButton
   478|            style={{
   479|              background: 'linear-gradient(135deg, #9333ea, #f97316)',
   480|              borderRadius: '10px',
   481|              fontSize: '14px',
   482|              padding: '10px 20px',
   483|              height: 'auto',
   484|              fontWeight: 700,
   485|            }}
   486|          />
   487|        </div>
   488|      </header>
   489|
   490|      {/* ── Main ── */}
   491|      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
   492|        {/* Hero */}
   493|        <div className="mb-10 text-center">
   494|          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-400 uppercase tracking-widest">
   495|            ⚡ Seahorse · Solana · Devnet
   496|          </div>
   497|          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
   498|            Solana Ad Campaign{' '}
   499|            <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
   500|              Dashboard
   501|            </span>
   502|          </h1>
   503|          <p className="mx-auto max-w-xl text-base text-muted-foreground">
   504|            Vendors lock SOL into escrow — Admins release payouts to influencers with a transparent 5% platform fee.
   505|          </p>
   506|        </div>
   507|
   508|        {!connected ? (
   509|          /* ── Not connected ── */
   510|          <div className="flex flex-col items-center justify-center gap-8 rounded-3xl border border-border bg-card py-24">
   511|            <div className="relative">
   512|              <span className="text-7xl">🔌</span>
   513|              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs">!</span>
   514|            </div>
   515|            <div className="text-center">
   516|              <p className="text-2xl font-extrabold text-foreground">Connect your wallet to get started</p>
   517|              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
   518|                Use <strong>Phantom</strong> or <strong>Solflare</strong> set to Devnet to interact with Ad-Blink.
   519|              </p>
   520|            </div>
   521|            <WalletMultiButton
   522|              style={{
   523|                background: 'linear-gradient(135deg, #9333ea, #f97316)',
   524|                borderRadius: '12px',
   525|                fontSize: '15px',
   526|                padding: '14px 32px',
   527|                height: 'auto',
   528|                fontWeight: 700,
   529|              }}
   530|            />
   531|            <div className="flex gap-6 text-xs text-muted-foreground/60">
   532|              <span>✓ Non-custodial</span>
   533|              <span>✓ Devnet only</span>
   534|              <span>✓ Open-source contract</span>
   535|            </div>
   536|          </div>
   537|        ) : (
   538|          /* ── Connected ── */
   539|          <div className="grid gap-6 lg:grid-cols-3">
   540|            {/* Left sidebar */}
   541|            <div className="space-y-6 lg:col-span-1">
   542|              <ProfileCard />
   543|
   544|              {/* Program Info */}
   545|              <div className="rounded-2xl border border-border bg-card p-5">
   546|                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
   547|                  Program Info
   548|                </p>
   549|                <div className="space-y-3 text-xs">
   550|                  <div>
   551|                    <p className="mb-0.5 text-muted-foreground">Program ID</p>
   552|                    <p className="break-all font-mono text-purple-400 leading-relaxed">
   553|                      {PROGRAM_ID.toString()}
   554|                    </p>
   555|                  </div>
   556|                  <div className="flex items-center justify-between">
   557|                    <span className="text-muted-foreground">Network</span>
   558|                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-bold text-orange-400">Devnet</span>
   559|                  </div>
   560|                  <div className="flex items-center justify-between">
   561|                    <span className="text-muted-foreground">Platform Fee</span>
   562|                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 font-bold text-green-400">5%</span>
   563|                  </div>
   564|                  <div className="flex items-center justify-between">
   565|                    <span className="text-muted-foreground">Language</span>
   566|                    <span className="font-semibold text-foreground">Seahorse (Python)</span>
   567|                  </div>
   568|                </div>
   569|                <a
   570|                  href={`https://explorer.solana.com/address/${PROGRAM_ID.toString()}?cluster=devnet`}
   571|                  target="_blank"
   572|                  rel="noreferrer"
   573|                  className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs text-muted-foreground transition hover:border-purple-500/50 hover:text-purple-400"
   574|                >
   575|                  View Program on Explorer ↗
   576|                </a>
   577|              </div>
   578|
   579|              {/* How it works */}
   580|              <div className="rounded-2xl border border-border bg-card p-5">
   581|                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
   582|                  How It Works
   583|                </p>
   584|                <ol className="space-y-4 text-xs text-muted-foreground">
   585|                  {[
   586|                    { color: 'orange', num: '1', title: 'Vendor', desc: 'creates a campaign and locks SOL into the escrow account.' },
   587|                    { color: 'blue', num: '2', title: 'Influencer', desc: 'completes the campaign work and notifies the Admin.' },
   588|                    { color: 'purple', num: '3', title: 'Admin', desc: 'triggers the payout instruction on-chain.' },
   589|                    { color: 'green', num: '4', title: 'Contract', desc: 'automatically splits: 95% to influencer, 5% fee collected.' },
   590|                  ].map(({ color, num, title, desc }) => (
   591|                    <li key={num} className="flex gap-3">
   592|                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-${color}-500/20 text-xs font-bold text-${color}-400`}>
   593|                        {num}
   594|                      </span>
   595|                      <span>
   596|                        <strong className="text-foreground">{title}</strong>{' '}{desc}
   597|                      </span>
   598|                    </li>
   599|                  ))}
   600|                </ol>
   601|              </div>
   602|            </div>
   603|
   604|            {/* Right panel columns */}
   605|            <div className="space-y-6 lg:col-span-2">
   606|              <VendorPanel onStatus={setStatus} />
   607|              <AdminPanel onStatus={setStatus} />
   608|            </div>
   609|          </div>
   610|        )}
   611|      </main>
   612|
   613|      {/* ── Footer ── */}
   614|      <footer className="border-t border-border bg-background/60 py-6">
   615|        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground sm:flex-row">
   616|          <div className="flex items-center gap-2">
   617|            <span>⚡</span>
   618|            <span className="font-semibold text-foreground">Ad-Blink</span>
   619|            <span>— Solana Ad Campaign Platform</span>
   620|          </div>
   621|          <div className="flex items-center gap-4">
   622|            <span className="flex items-center gap-1">
   623|              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
   624|              Devnet
   625|            </span>
   626|            <span>Program: <span className="font-mono text-purple-400">{PROGRAM_ID.toString().slice(0, 8)}…</span></span>
   627|            <a
   628|              href="https://docs.solana.com"
   629|              target="_blank"
   630|              rel="noreferrer"
   631|              className="hover:text-foreground transition"
   632|            >
   633|              Solana Docs ↗
   634|            </a>
   635|          </div>
   636|        </div>
   637|      </footer>
   638|
   639|      <StatusToast status={status} onDismiss={() => setStatus({ type: 'idle' })} />
   640|    </div>
   641|  );
   642|}
   643|