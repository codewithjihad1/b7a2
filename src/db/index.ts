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
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT NOT NULL,
            type ENUM('bug', 'feature_request') NOT NULL,
            status ENUM('open', 'in_progress', 'resolved')
                NOT NULL DEFAULT 'open',
            reporter_id BIGINT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT chk_description_length
                CHECK (CHAR_LENGTH(description) >= 20)
        )
        `);

        console.log('Database connected successfully!');
    } catch (error) {
        console.log(error);
    }
};
