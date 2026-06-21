# Node.js and XAMPP Setup

1. Install Node.js, then run `npm install` in the project directory.
2. Open XAMPP Control Panel and start **MySQL**. Apache and PHP are not required.
3. Import `database/schema.sql` using phpMyAdmin or the MariaDB command line.

   The schema uses the `cpms_react` database and does not alter an existing `cpms` database.
4. Create the first administrator with a private password of at least 12 characters:

   ```powershell
   $env:CPMS_ADMIN_EMAIL='your-admin-email'
   $env:CPMS_ADMIN_PASSWORD='your-private-password'
   npm run create-admin
   ```

5. Start the Node.js API and React together:

   ```powershell
   npm run dev
   ```

Open `http://localhost:3000`. Public signup always creates a Custodian account; only an administrator can grant Admin or Auditor access.

For a non-default MariaDB password, set `CPMS_DB_PASSWORD` before running the administrator command or API. Use `npm run api` to start only the Node.js backend.
