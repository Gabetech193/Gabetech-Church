# Gabetech Church Management System: setup

## 1. Supabase (already done if you ran the SQL)
- Project Settings > API: copy the **Project URL** and the **anon / publishable key**.
- Authentication > Providers > Email: for easiest first sign-up, switch **Confirm email** off
  (you can switch it back on later).

## 2. Environment variables
Add these in Vercel (Project > Settings > Environment Variables), or in a `.env` file:

    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    VITE_CHURCH_NAME=Your Church Name

## 3. Deploy
- Upload this folder to a GitHub repository.
- In Vercel: Add New > Project > import the repo. Framework: Vite. Build command `npm run build`,
  output folder `dist`. Add the 3 variables, then Deploy.

## 4. First login
Open the live site, choose "Create an account". **The first account created becomes Admin.**
Other staff sign up the same way, then the admin opens **Staff** and gives them a role.

## If you signed up BEFORE running the SQL
That account has no profile. Run this once in Supabase > SQL Editor (put your email in):

    insert into public.profiles (id, full_name, role)
    select id, coalesce(raw_user_meta_data->>'full_name', email), 'admin'
    from auth.users where email = 'YOUR_EMAIL_HERE'
    on conflict (id) do update set role = 'admin';

## Roles
- Admin: everything, including Staff and deletes.
- Treasurer: giving and pledges, plus read-only members.
- Secretary: members only (cannot see giving).
