# AgriStand

A public website for organizing and accessing Philippine agricultural standards (PNS/BAFS and related), built with Bootstrap and Supabase.

## Features
- Search and filter standards by category, title, or number
- View/download the PDF file for each standard (from Supabase Storage)
- Responsive, clean UI

## Tech Stack
- Frontend: Bootstrap 5, Vanilla JS
- Backend: Supabase (Database, Storage)

## Setup Instructions

### 1. Supabase Setup
- [Create a Supabase project](https://app.supabase.com/)
- Create a table `standards` with columns:
  - `id` (int, PK)
  - `category` (text)
  - `title_no` (text)
  - `title` (text)
  - `year` (int)
  - `file_url` (text)  // Public URL to the PDF file in Supabase Storage
- Create a Storage bucket (e.g., `standards-files`) and upload your PDF files. Use the public URL in `file_url`.
- Set your bucket/files to be publicly readable (Storage > [Your Bucket] > Policies > Allow public select).

### 2. Configure the Frontend
- In `src/supabase.js`, replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your project credentials.

### 3. Run Locally
- Open `public/index.html` in your browser. (No build step required)
- Or use a simple HTTP server:
  ```sh
  npx serve public
  # or
  python -m http.server
  ```

## Customization
- Update the logo, footer, and styles in `public/index.html` and `src/styles.css` as needed.

## License
MIT 