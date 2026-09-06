from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

def _get_async_database_url(url: str) -> str:
    """Ensure database URL uses postgresql+asyncpg and valid query parameters."""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    if "sslmode=" in url:
        url = url.replace("sslmode=require", "ssl=require")
    if "channel_binding=" in url:
        import re
        url = re.sub(r'[?&]channel_binding=[^&]+', '', url)
        if url.endswith('?') or url.endswith('&'):
            url = url[:-1]
        url = url.replace('?&', '?')
    return url


# Async engine for Neon PostgreSQL
engine = create_async_engine(
    _get_async_database_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=False,
    pool_size=10,
    max_overflow=20,
    pool_recycle=600,
    pool_timeout=15,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "command_timeout": 30,
    },
)

# Async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db():
    """Dependency that provides an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from sqlalchemy import text


async def init_db():
    """Create all tables and ensure new columns exist on existing tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Non-destructive schema evolution
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS civic_reputation INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_count INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS confirmed_reports_count INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_resolutions_count INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS community_confirmations_count INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS confirmation_count INTEGER NOT NULL DEFAULT 0;",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS parent_issue_id UUID REFERENCES complaints(id);",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS merged_reports_count INTEGER NOT NULL DEFAULT 0;",
        ]
        for query in migrations:
            try:
                await conn.execute(text(query))
            except Exception:
                pass

