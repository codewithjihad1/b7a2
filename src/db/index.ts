import { Pool } from 'pg';
import config from '../config';

export const pool = new Pool({
    connectionString: config.connection_string,
});

export const initDB = async () => {
    try {
        await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
          id SERIAL PRIMARY KEY,
          name VARCHAR(30),
          email VARCHAR(30) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role VARCHAR(20) DEFAULT 'contributor',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS issues (
                id BIGSERIAL PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL
                    CHECK (CHAR_LENGTH(description) >= 20),
                type VARCHAR(20) NOT NULL
                    CHECK (type IN ('bug', 'feature_request')),
                status VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved')),
                reporter_id BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (reporter_id) REFERENCES users(id)
            )
        `);

        console.log('Database connected successfully!');
    } catch (error) {
        console.log(error);
    }
};
