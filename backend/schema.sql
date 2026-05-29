-- Schéma PostgreSQL de référence (QuartierLink)
-- Usage : psql -U <user> -d QuartierLink -f schema.sql

-- =========================
-- ENUMS
-- =========================

CREATE TYPE user_status AS ENUM ('NON_VERIFIE', 'EN_ATTENTE', 'VERIFIE');
CREATE TYPE request_status AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- =========================
-- TABLE USERS
-- =========================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    address TEXT,
    status user_status DEFAULT 'NON_VERIFIE',
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE QUARTIERS
-- =========================

CREATE TABLE quartiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT,
    admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE DEMANDES D'ADHESION
-- =========================

CREATE TABLE membership_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quartier_id INTEGER REFERENCES quartiers(id) ON DELETE CASCADE,
    status request_status DEFAULT 'EN_ATTENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE MEMBRES QUARTIER
-- =========================

CREATE TABLE quartier_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quartier_id INTEGER REFERENCES quartiers(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, quartier_id)
);

-- =========================
-- TABLE POSTS (FIL ACTU)
-- =========================

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quartier_id INTEGER REFERENCES quartiers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLE MESSAGES (CHAT)
-- =========================

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
