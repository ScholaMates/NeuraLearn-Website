# NeuraLearn Website

NeuraLearn is an AI-powered educational web application built with Next.js and Supabase. It provides an interactive chat interface leveraging Google's Gemini AI to assist users with learning and problem-solving, featuring robust support for mathematical notation.

## Key Features

- **AI-Powered Assistance**: Integrated with Google Gemini AI to provide intelligent responses and tutoring.
- **Mathematical Notation Support**: Renders complex mathematical expressions using KaTeX and LaTeX syntax.
- **Secure Authentication**: User management and authentication powered by Supabase.
- **Persistent Chat History**: Stores user conversations and context for a continuous learning experience.
- **Responsive Design**: Modern, responsive user interface built with Tailwind CSS.
- **Markdown Support**: Rich text rendering for chat messages including code blocks and formatting.

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js (Latest LTS version recommended)
- npm or bun
- A Supabase account
- A Google Cloud account with Gemini API access

## Installation and Setup

Follow these steps to set up the project locally.

### 1. Clone the Repository

Clone the project to your local machine:

```bash
git clone https://github.com/ScholaMates/NeuraLearn-Website.git
cd NeuraLearn-Website
```

### 2. Install Dependencies

Install the necessary dependencies using your preferred package manager:

```bash
npm install
# or
bun install
```

### 3. Environment Configuration

This project uses environment variables for configuration.

1.  Create a `.env` file in the root directory by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file and populate it with your specific keys:

    -   `GEMINI_API_KEY`: Your Google Gemini API key.
    -   `GEMINI_AI_MODEL`: The model version to use (e.g., gemini-3-flash-preview).
    -   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Project API Anon/Public Key.
    -   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Required for admin tasks, keep this secret).

### 4. Database Setup

To configure the database schema and policies:

1.  Log in to your Supabase Dashboard.
2.  Navigate to the SQL Editor.
3.  Execute the SQL scripts found in `SchemaConfig.md` in this repository to set up the necessary tables (Profiles, Chats, Messages) and Row Level Security (RLS) policies.

### 5. Running the Application

Start the development server:

```bash
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:3000`.

## Technologies Used

-   **Framework**: Next.js 16, React 19, React DOM 19
-   **Database & Auth**: Supabase (@supabase/supabase-js, @supabase/ssr)
-   **AI**: Google Generative AI SDK (@google/generative-ai)
-   **Styling**: Tailwind CSS
-   **Markdown & Math**: react-markdown, KaTeX, remark-math, rehype-katex
-   **Animations**: Anime.js
-   **Icons**: Lucide React
-   **UI Components**: Sonner (Toast notifications)
-   **Utilities**: dotenv
