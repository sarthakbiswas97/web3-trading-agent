use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111"); // Replace after `anchor deploy`

#[program]
pub mod vapm_decisions {
    use super::*;

    /// Register a new agent by creating an AgentState PDA.
    pub fn initialize_agent(ctx: Context<InitializeAgent>, name: String) -> Result<()> {
        require!(name.len() <= 32, VapmError::NameTooLong);

        let agent = &mut ctx.accounts.agent_state;
        agent.authority = ctx.accounts.authority.key();
        agent.name = name;
        agent.decision_count = 0;
        agent.created_at = Clock::get()?.unix_timestamp;
        agent.bump = ctx.bumps.agent_state;

        emit!(AgentRegistered {
            authority: agent.authority,
            name: agent.name.clone(),
        });

        Ok(())
    }

    /// Log a decision hash on-chain. Creates a new DecisionRecord PDA.
    pub fn log_decision(
        ctx: Context<LogDecision>,
        decision_hash: [u8; 32],
        confidence: u64,
        risk_score: u64,
    ) -> Result<()> {
        require!(confidence <= 1000, VapmError::InvalidConfidence);
        require!(risk_score <= 1000, VapmError::InvalidRiskScore);

        let agent = &mut ctx.accounts.agent_state;
        let record = &mut ctx.accounts.decision_record;

        record.agent = ctx.accounts.authority.key();
        record.decision_hash = decision_hash;
        record.model_confidence = confidence;
        record.risk_score = risk_score;
        record.timestamp = Clock::get()?.unix_timestamp;
        record.executed = false;
        record.bump = ctx.bumps.decision_record;

        let index = agent.decision_count;
        agent.decision_count += 1;

        emit!(DecisionLogged {
            agent: record.agent,
            index,
            decision_hash,
            confidence,
            risk_score,
        });

        Ok(())
    }

    /// Mark a previously logged decision as executed.
    pub fn mark_executed(ctx: Context<MarkExecuted>, _decision_index: u64) -> Result<()> {
        let record = &mut ctx.accounts.decision_record;
        require!(!record.executed, VapmError::AlreadyExecuted);

        record.executed = true;

        emit!(DecisionExecuted {
            agent: record.agent,
            decision_hash: record.decision_hash,
        });

        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeAgent<'info> {
    #[account(
        init,
        payer = authority,
        space = AgentState::SIZE,
        seeds = [b"agent", authority.key().as_ref()],
        bump,
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LogDecision<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent_state.bump,
        has_one = authority,
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(
        init,
        payer = authority,
        space = DecisionRecord::SIZE,
        seeds = [
            b"decision",
            authority.key().as_ref(),
            &agent_state.decision_count.to_le_bytes(),
        ],
        bump,
    )]
    pub decision_record: Account<'info, DecisionRecord>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(decision_index: u64)]
pub struct MarkExecuted<'info> {
    #[account(
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent_state.bump,
        has_one = authority,
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(
        mut,
        seeds = [
            b"decision",
            authority.key().as_ref(),
            &decision_index.to_le_bytes(),
        ],
        bump = decision_record.bump,
    )]
    pub decision_record: Account<'info, DecisionRecord>,

    pub authority: Signer<'info>,
}

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────

#[account]
pub struct AgentState {
    pub authority: Pubkey,       // 32
    pub name: String,            // 4 + 32 max
    pub decision_count: u64,     // 8
    pub created_at: i64,         // 8
    pub bump: u8,                // 1
}

impl AgentState {
    // discriminator(8) + pubkey(32) + string(4+32) + u64(8) + i64(8) + u8(1) + padding
    pub const SIZE: usize = 8 + 32 + 36 + 8 + 8 + 1 + 16; // 109 + padding = 128
}

#[account]
pub struct DecisionRecord {
    pub agent: Pubkey,            // 32
    pub decision_hash: [u8; 32],  // 32
    pub model_confidence: u64,    // 8
    pub risk_score: u64,          // 8
    pub timestamp: i64,           // 8
    pub executed: bool,           // 1
    pub bump: u8,                 // 1
}

impl DecisionRecord {
    // discriminator(8) + pubkey(32) + hash(32) + u64(8) + u64(8) + i64(8) + bool(1) + u8(1) + padding
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 16; // 114 + padding = 128
}

// ─────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────

#[event]
pub struct AgentRegistered {
    pub authority: Pubkey,
    pub name: String,
}

#[event]
pub struct DecisionLogged {
    pub agent: Pubkey,
    pub index: u64,
    pub decision_hash: [u8; 32],
    pub confidence: u64,
    pub risk_score: u64,
}

#[event]
pub struct DecisionExecuted {
    pub agent: Pubkey,
    pub decision_hash: [u8; 32],
}

// ─────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────

#[error_code]
pub enum VapmError {
    #[msg("Agent name must be 32 characters or fewer")]
    NameTooLong,

    #[msg("Confidence must be between 0 and 1000")]
    InvalidConfidence,

    #[msg("Risk score must be between 0 and 1000")]
    InvalidRiskScore,

    #[msg("Decision already marked as executed")]
    AlreadyExecuted,
}
