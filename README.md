# Login Site

A simple register and login website with email/password and Google sign-in.

## Features
- Register with name, age, gender, email, phone and password
- Login with email and password (passwords hashed with bcrypt)
- Sign up / sign in with Google
- Data stored in a PostgreSQL database (Aiven)

## Tech stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL (Aiven)
- Libraries: pg, bcryptjs, dotenv, google-auth-library

## Project files
- `index.html` - login page
- `register.html` - sign-up page
- `server.js` - backend and API routes
- `.env.example` - template for secret settings

## Setup
1. Clone the repo and install packages:

        git clone https://github.com/ramzan4209/login-site.git
        cd login-site
        npm install

2. Create a `.env` file from the template:

        cp .env.example .env

3. Fill in `.env`:

        DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/defaultdb
        GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

4. Create the `users` table in your database:

        CREATE TABLE IF NOT EXISTS users (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          age INTEGER CHECK (age >= 13 AND age <= 120),
          gender VARCHAR(30),
          email VARCHAR(254) UNIQUE NOT NULL,
          phone VARCHAR(25),
          password_hash TEXT,
          google_id TEXT UNIQUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

5. Start the server:

        node server.js

6. Open http://localhost:3000

## API routes
| Method | Route | Purpose |
|---|---|---|
| POST | `/register` | Create an account with email and password |
| POST | `/login` | Log in with email and password |
| POST | `/auth/google` | Sign up or sign in with Google |

## Google sign-in setup
1. Create an OAuth Client ID (Web application) in Google Cloud Console.
2. Add `http://localhost:3000` under Authorized JavaScript origins.
3. Put the Client ID in `.env` and in the `GOOGLE_CLIENT_ID` constant in `index.html` and `register.html`.

## Security notes
- Never commit `.env`. It is listed in `.gitignore`.
- Passwords are stored as bcrypt hashes, never as plain text.

## Author
ramzan4209
