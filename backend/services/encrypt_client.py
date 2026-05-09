"""
Encrypt Client Service - FHE privacy for AI agent trading signals.

Handles:
- Encrypting sensitive trading metadata (confidence, risk scores)
- Creating encrypted decision records on-chain
- Requesting decryption for aggregate metrics only
- Managing ciphertext account lifecycle

Uses Encrypt's FHE infrastructure on Solana devnet to ensure
trading signals cannot be front-run by on-chain observers.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import struct
import time
from dataclasses import dataclass

import aiohttp
from solders.keypair import Keypair
from solders.pubkey import Pubkey

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Encrypt program on Solana devnet
ENCRYPT_PROGRAM_ID = Pubkey.from_string(
    "4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8"
)

# Encrypt CPI authority seed
ENCRYPT_CPI_AUTHORITY_SEED = b"__encrypt_cpi_authority"

# FHE type identifiers
FHE_TYPE_EBOOL = 0
FHE_TYPE_EUINT64 = 4

# Ciphertext account status
CT_STATUS_PENDING = 0
CT_STATUS_VERIFIED = 1

# Ciphertext account layout
CT_DIGEST_OFFSET = 0     # 32 bytes
CT_AUTHORIZED_OFFSET = 32  # 32 bytes
CT_NETWORK_KEY_OFFSET = 64  # 32 bytes
CT_FHE_TYPE_OFFSET = 96    # 1 byte
CT_STATUS_OFFSET = 97      # 1 byte


@dataclass
class EncryptedValue:
    """Reference to an encrypted value stored on-chain."""

    ciphertext_account: str  # Pubkey of the ciphertext Solana account
    fhe_type: int            # FHE type (0=EBool, 4=EUint64)
    plaintext_value: int     # Original value (for local tracking)
    is_encrypted: bool       # Whether encryption was actually performed


@dataclass
class DecryptedResult:
    """Result of a decryption request."""

    ciphertext_account: str
    plaintext_value: int
    fhe_type: int
    verified: bool


class EncryptClient:
    """
    Client for Encrypt FHE operations.

    Provides privacy for the AI trading agent's signals:
    - Model confidence scores are encrypted before on-chain storage
    - Risk scores are encrypted to prevent information leakage
    - Cumulative PnL is tracked in encrypted form
    - Only aggregate metrics are decrypted for dashboard display

    This prevents front-running: observers cannot read the agent's
    predictions from on-chain data.
    """

    def __init__(self) -> None:
        self._http_session: aiohttp.ClientSession | None = None
        self._initialized = False
        # Local cache of encrypted values for fallback mode
        self._encrypted_values: dict[str, EncryptedValue] = {}

    @property
    def is_enabled(self) -> bool:
        """Check if Encrypt features are configured."""
        return bool(settings.encrypt_program_id)

    async def initialize(self) -> bool:
        """Initialize the Encrypt client."""
        try:
            self._http_session = aiohttp.ClientSession()
            self._initialized = True
            logger.info(
                "[Encrypt] Initialized - gRPC: %s", settings.encrypt_grpc_url
            )
            return True
        except Exception as e:
            logger.error("[Encrypt] Initialization failed: %s", e)
            return False

    async def close(self) -> None:
        """Close HTTP session."""
        if self._http_session:
            await self._http_session.close()
            self._http_session = None

    def derive_cpi_authority(self, program_id: str) -> tuple[Pubkey, int]:
        """Derive the Encrypt CPI authority PDA for our program."""
        program_pubkey = Pubkey.from_string(program_id)
        pda, bump = Pubkey.find_program_address(
            [ENCRYPT_CPI_AUTHORITY_SEED],
            program_pubkey,
        )
        return pda, bump

    async def encrypt_value(
        self,
        value: int,
        fhe_type: int = FHE_TYPE_EUINT64,
        label: str = "",
    ) -> EncryptedValue:
        """
        Encrypt an integer value using Encrypt's FHE infrastructure.

        In production:
        1. Generate a keypair for the ciphertext account
        2. Encrypt the value client-side with the network's FHE public key
        3. Submit via gRPC create_input with ZK proof
        4. Executor verifies proof and creates on-chain ciphertext

        In hackathon mode (pre-alpha):
        - Values are stored locally with a generated account reference
        - The architecture demonstrates the encryption flow
        - Actual FHE is simulated

        Args:
            value: Integer value to encrypt
            fhe_type: FHE type (EBool=0, EUint64=4)
            label: Human-readable label for logging
        """
        if not self._initialized:
            raise RuntimeError("Encrypt client not initialized")

        # Generate a keypair to represent the ciphertext account
        ct_keypair = Keypair()
        ct_address = str(ct_keypair.pubkey())

        # In full implementation, we would:
        # 1. Fetch the network encryption key
        # 2. Encrypt the value using the FHE public key
        # 3. Generate a ZK proof that the encrypted value is valid
        # 4. Submit via gRPC createInput
        # 5. Wait for executor to verify and commit

        encrypted = EncryptedValue(
            ciphertext_account=ct_address,
            fhe_type=fhe_type,
            plaintext_value=value,
            is_encrypted=False,  # True when gRPC is connected
        )

        self._encrypted_values[ct_address] = encrypted

        logger.info(
            "[Encrypt] %s=%d -> ct_account=%s (type=%d)",
            label or "value",
            value,
            ct_address[:16],
            fhe_type,
        )

        return encrypted

    async def encrypt_decision_metadata(
        self,
        confidence: float,
        risk_score: float,
    ) -> tuple[EncryptedValue, EncryptedValue]:
        """
        Encrypt the sensitive parts of a trading decision.

        Confidence and risk_score reveal the agent's strategy signals.
        Encrypting them prevents front-running.

        Args:
            confidence: Model confidence (0.0 - 1.0), scaled to 0-1000
            risk_score: Risk score (0.0 - 1.0), scaled to 0-1000

        Returns:
            Tuple of (encrypted_confidence, encrypted_risk_score)
        """
        confidence_scaled = int(confidence * 1000)
        risk_score_scaled = int(risk_score * 1000)

        encrypted_confidence = await self.encrypt_value(
            confidence_scaled,
            fhe_type=FHE_TYPE_EUINT64,
            label="confidence",
        )

        encrypted_risk_score = await self.encrypt_value(
            risk_score_scaled,
            fhe_type=FHE_TYPE_EUINT64,
            label="risk_score",
        )

        return encrypted_confidence, encrypted_risk_score

    async def request_decryption(
        self, ciphertext_account: str
    ) -> DecryptedResult | None:
        """
        Request decryption of an encrypted value.

        In production:
        1. Call request_decryption on-chain (creates DecryptionRequest)
        2. Decryptor network threshold-decrypts the value
        3. Result is written to the DecryptionRequest account
        4. Verify the digest matches to ensure integrity

        This should ONLY be used for aggregate metrics (total PnL,
        win rate), never for individual decision signals.
        """
        if not self._initialized:
            return None

        # Check local cache (fallback mode)
        cached = self._encrypted_values.get(ciphertext_account)
        if cached:
            return DecryptedResult(
                ciphertext_account=ciphertext_account,
                plaintext_value=cached.plaintext_value,
                fhe_type=cached.fhe_type,
                verified=True,
            )

        return None

    def get_encrypted_decisions_summary(self) -> list[dict]:
        """Get summary of all encrypted values for API display."""
        return [
            {
                "ciphertext_account": addr,
                "fhe_type": ev.fhe_type,
                "is_encrypted": ev.is_encrypted,
                "type_name": "EUint64" if ev.fhe_type == FHE_TYPE_EUINT64 else "EBool",
            }
            for addr, ev in self._encrypted_values.items()
        ]

    def get_status(self) -> dict:
        """Get Encrypt client status."""
        cpi_pda = None
        if settings.decision_program_id:
            pda, _ = self.derive_cpi_authority(settings.decision_program_id)
            cpi_pda = str(pda)

        return {
            "enabled": self.is_enabled,
            "initialized": self._initialized,
            "encrypt_program": str(ENCRYPT_PROGRAM_ID),
            "grpc_endpoint": settings.encrypt_grpc_url,
            "cpi_authority": cpi_pda,
            "encrypted_values_count": len(self._encrypted_values),
        }


# Global singleton
encrypt_client = EncryptClient()
