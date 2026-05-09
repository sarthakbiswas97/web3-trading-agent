use anchor_lang::prelude::*;

declare_id!("DEAci1VN41bK8KmQJYYizWXAbudvre1Jhkp5QPLWVgmq");

#[program]
pub mod vapm_decisions {
    use super::*;

    /// Register agent with on-chain risk limits.
    pub fn initialize_agent(
        ctx: Context<InitializeAgent>,
        name: String,
        max_position_bps: u16,
        max_daily_loss_bps: u16,
        max_drawdown_bps: u16,
    ) -> Result<()> {
        require!(name.len() <= 32, VapmError::InvalidInput);

        let agent = &mut ctx.accounts.agent_state;
        agent.authority = ctx.accounts.authority.key();
        agent.name = name;
        agent.decision_count = 0;
        agent.max_position_bps = max_position_bps;
        agent.max_daily_loss_bps = max_daily_loss_bps;
        agent.max_drawdown_bps = max_drawdown_bps;
        agent.dwallet = Pubkey::default();
        agent.trades_approved = 0;
        agent.trades_rejected = 0;
        agent.bump = ctx.bumps.agent_state;

        emit!(AgentEvent {
            authority: agent.authority,
            kind: 0, // registered
            val_a: max_position_bps as u64,
            val_b: max_daily_loss_bps as u64,
            val_c: max_drawdown_bps as u64,
        });

        Ok(())
    }

    /// Update risk limits or dWallet reference.
    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        max_position_bps: u16,
        max_daily_loss_bps: u16,
        max_drawdown_bps: u16,
        dwallet: Pubkey,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;
        agent.max_position_bps = max_position_bps;
        agent.max_daily_loss_bps = max_daily_loss_bps;
        agent.max_drawdown_bps = max_drawdown_bps;
        agent.dwallet = dwallet;

        emit!(AgentEvent {
            authority: agent.authority,
            kind: 1, // updated
            val_a: max_position_bps as u64,
            val_b: max_daily_loss_bps as u64,
            val_c: max_drawdown_bps as u64,
        });

        Ok(())
    }

    /// Check on-chain risk limits and approve trade.
    pub fn approve_trade(
        ctx: Context<UpdateAgent>,
        position_size_bps: u16,
        daily_pnl_bps: u16,
        current_drawdown_bps: u16,
        message_hash: [u8; 32],
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;

        require!(position_size_bps <= agent.max_position_bps, VapmError::RiskLimitExceeded);
        require!(daily_pnl_bps <= agent.max_daily_loss_bps, VapmError::RiskLimitExceeded);
        require!(current_drawdown_bps <= agent.max_drawdown_bps, VapmError::RiskLimitExceeded);

        agent.trades_approved += 1;

        emit!(TradeEvent {
            authority: agent.authority,
            approved: true,
            position_bps: position_size_bps,
            pnl_bps: daily_pnl_bps,
            drawdown_bps: current_drawdown_bps,
            message_hash,
        });

        Ok(())
    }

    /// Log trade rejection for audit trail.
    pub fn reject_trade(
        ctx: Context<UpdateAgent>,
        position_size_bps: u16,
        daily_pnl_bps: u16,
        current_drawdown_bps: u16,
        message_hash: [u8; 32],
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;
        agent.trades_rejected += 1;

        emit!(TradeEvent {
            authority: agent.authority,
            approved: false,
            position_bps: position_size_bps,
            pnl_bps: daily_pnl_bps,
            drawdown_bps: current_drawdown_bps,
            message_hash,
        });

        Ok(())
    }

    /// Log a decision hash on-chain.
    pub fn log_decision(
        ctx: Context<LogDecision>,
        decision_hash: [u8; 32],
        confidence: u16,
        risk_score: u16,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;
        let record = &mut ctx.accounts.decision_record;

        record.agent = ctx.accounts.authority.key();
        record.decision_hash = decision_hash;
        record.confidence = confidence;
        record.risk_score = risk_score;
        record.timestamp = Clock::get()?.unix_timestamp;
        record.executed = false;
        record.bump = ctx.bumps.decision_record;

        agent.decision_count += 1;
        Ok(())
    }

    /// Mark decision as executed.
    pub fn mark_executed(ctx: Context<MarkExecuted>, _idx: u32) -> Result<()> {
        let record = &mut ctx.accounts.decision_record;
        require!(!record.executed, VapmError::AlreadyExecuted);
        record.executed = true;
        Ok(())
    }
}

// ── Accounts ────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeAgent<'info> {
    #[account(init, payer = authority, space = AgentState::SIZE,
              seeds = [b"agent", authority.key().as_ref()], bump)]
    pub agent_state: Account<'info, AgentState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(mut, seeds = [b"agent", authority.key().as_ref()],
              bump = agent_state.bump, has_one = authority)]
    pub agent_state: Account<'info, AgentState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct LogDecision<'info> {
    #[account(mut, seeds = [b"agent", authority.key().as_ref()],
              bump = agent_state.bump, has_one = authority)]
    pub agent_state: Account<'info, AgentState>,
    #[account(init, payer = authority, space = DecisionRecord::SIZE,
              seeds = [b"d", authority.key().as_ref(),
                       &agent_state.decision_count.to_le_bytes()], bump)]
    pub decision_record: Account<'info, DecisionRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_idx: u32)]
pub struct MarkExecuted<'info> {
    #[account(seeds = [b"agent", authority.key().as_ref()],
              bump = agent_state.bump, has_one = authority)]
    pub agent_state: Account<'info, AgentState>,
    #[account(mut, seeds = [b"d", authority.key().as_ref(),
                            &(_idx as u64).to_le_bytes()],
              bump = decision_record.bump)]
    pub decision_record: Account<'info, DecisionRecord>,
    pub authority: Signer<'info>,
}

// ── State ───────────────────────────────────────────────────

#[account]
pub struct AgentState {
    pub authority: Pubkey,          // 32
    pub name: String,               // 4 + 32
    pub decision_count: u64,        // 8
    pub max_position_bps: u16,      // 2
    pub max_daily_loss_bps: u16,    // 2
    pub max_drawdown_bps: u16,      // 2
    pub dwallet: Pubkey,            // 32
    pub trades_approved: u32,       // 4
    pub trades_rejected: u32,       // 4
    pub bump: u8,                   // 1
}

impl AgentState {
    pub const SIZE: usize = 8 + 32 + 36 + 8 + 2 + 2 + 2 + 32 + 4 + 4 + 1 + 16;
}

#[account]
pub struct DecisionRecord {
    pub agent: Pubkey,              // 32
    pub decision_hash: [u8; 32],    // 32
    pub confidence: u16,            // 2
    pub risk_score: u16,            // 2
    pub timestamp: i64,             // 8
    pub executed: bool,             // 1
    pub bump: u8,                   // 1
}

impl DecisionRecord {
    pub const SIZE: usize = 8 + 32 + 32 + 2 + 2 + 8 + 1 + 1 + 8;
}

// ── Events (consolidated to reduce binary size) ─────────────

#[event]
pub struct AgentEvent {
    pub authority: Pubkey,
    pub kind: u8,       // 0=registered, 1=updated
    pub val_a: u64,
    pub val_b: u64,
    pub val_c: u64,
}

#[event]
pub struct TradeEvent {
    pub authority: Pubkey,
    pub approved: bool,
    pub position_bps: u16,
    pub pnl_bps: u16,
    pub drawdown_bps: u16,
    pub message_hash: [u8; 32],
}

// ── Errors ──────────────────────────────────────────────────

#[error_code]
pub enum VapmError {
    #[msg("Invalid input")]
    InvalidInput,
    #[msg("Risk limit exceeded")]
    RiskLimitExceeded,
    #[msg("Already executed")]
    AlreadyExecuted,
}
