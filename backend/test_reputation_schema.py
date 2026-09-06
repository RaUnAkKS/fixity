import asyncio
import app.models
from app.database import engine, init_db
from sqlalchemy import text

async def check():
    await init_db()
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users';"))
        cols = [r[0] for r in res.fetchall()]
        print('USER COLUMNS:', cols)
        assert 'civic_reputation' in cols
        assert 'reports_count' in cols

        res2 = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='complaints';"))
        cols2 = [r[0] for r in res2.fetchall()]
        print('COMPLAINT COLUMNS:', cols2)
        assert 'confirmation_count' in cols2

        res3 = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name='complaint_confirmations';"))
        tables = [r[0] for r in res3.fetchall()]
        print('CONFIRMATION TABLE:', tables)
        assert 'complaint_confirmations' in tables

    print('ALL REPUTATION & CONFIRMATION TABLES/COLUMNS VERIFIED!')

if __name__ == '__main__':
    asyncio.run(check())
