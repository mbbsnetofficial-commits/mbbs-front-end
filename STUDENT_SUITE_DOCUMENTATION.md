# MBBS.NET Student Suite — Master Technical Specification, UI Workflows & API Documentation

## 1. System Architecture & Tech Stack

**MBBS.NET Student Suite** is an enterprise-grade medical education platform built with Angular 19+. It serves medical aspirants preparing for **NEET**, **UCAT**, and **MBBS Abroad Admissions**.

### Technology Stack
- **Frontend Framework:** Angular 19+ (Standalone Components, Reactive Signals, RxJS)
- **State Management:** Custom Signal Stores (`PageStore`, `CseStore`) and Angular RxJS Services
- **Design Tokens & SCSS:** SuperCampus White/Purple Design System, Glassmorphism, CSS Grid Flex Layouts
- **Security & Network:** HttpInterceptor (`AuthInterceptor`) for Bearer JWT token injection and refresh token rotation
- **API Base URL:** `https://api.mbbs.net/api/v1`

---

## 2. Comprehensive Navigation & Layout System (`DynamicLayouts`)

The dynamic workspace shell ([dynamic-layouts.html](file:///Users/sajay/Documents/frontend-mvp/mbbs-front-end/src/app/layouts/dynamic-layouts/dynamic-layouts.html)) wraps all student pages with a unified navigation bar.

### 2.1 Sidebar Header & Logo
- **Brand Logo:** Embedded image (`public/images/app-logo.png`) styled with 14px rounded border radius, 1px subtle border, and shadow.
- **Brand Title:** **MBBS.NET** with subtext **STUDENT SUITE**.
- **Collapse Toggle Button:** Allows switching between **Expanded Mode** (268px width) and **Collapsed Icon-Only Mode** (80px width) with animated hover tooltips.

### 2.2 Navigation Menu Items
- 📊 **Dashboard (`/dynamic/dashboard`):** Main student command center.
- 📝 **NEET (`/dynamic/neet`):** Expandable dropdown menu:
  - Practice Tests (`/dynamic/neet/quick-test`)
  - Previous Year Questions (`/dynamic/neet/previous-year-tests`)
  - Question of the Day (`/dynamic/neet`)
  - Performance Leaderboard (`/dynamic/neet/leaderboard`)
- 🩺 **UCAT (`/dynamic/ucat`):** Expandable dropdown menu:
  - Practice Test (`/dynamic/ucat`)
  - Previous Year Papers (`/dynamic/ucat/previous-year`)
- 🌐 **University Finder (CSE) (`/dynamic/cse`):** Country selection grid & multi-step questionnaire.
- 🔖 **Blogs (`/dynamic/blogs`):** Medium-style 2-column medical knowledge feed.

### 2.3 Profile Footer Widget
- Purple gradient circle avatar (`ST`), display name (**Student Account**), role badge (**MBBS STUDENT**), and secure Logout trigger.

---

## 3. Student Dashboard Module & Workflows

The **Student Dashboard** ([student-dashboard.ts](file:///Users/sajay/Documents/frontend-mvp/mbbs-front-end/src/app/dynamic/dashboard/student-dashboard.ts)) aggregates student performance metrics, daily streaks, saved universities, quiz sessions, and bookmarked articles.

### 3.1 Bound API Endpoints Matrix (10 Endpoints)

| API Endpoint | HTTP Method | Service Method | UI Element & Purpose |
| :--- | :---: | :--- | :--- |
| `/api/v1/student/dashboard/summary` | `GET` | `getSummary()` | Welcome Banner, Student Greeting, Plan Tag, Live Fire Streak Pill (`🔥 5 Day Streak`). |
| `/api/v1/student/dashboard/stats` | `GET` | `getStats()` | 4 Top KPI Cards (Tests Completed, Overall Accuracy %, Practice Time in Mins, Correct Answers). |
| `/api/v1/student/dashboard/performance` | `GET` | `getPerformance()` | Subject accuracy progress bars (Biology, Chemistry, Physics). |
| `/api/v1/student/dashboard/recent-activity` | `GET` | `getRecentActivity(page, limit)` | Activity timeline under Overview tab. |
| `/api/v1/student/dashboard/saved-blogs` | `GET` | `getSavedBlogs(page, limit)` | Grid of bookmarked blog posts in Saved Articles tab. |
| `/api/v1/student/dashboard/university-finder/saved-universities` | `GET` | `getSavedUniversities()` | Grid of target MBBS universities in Saved Universities tab. |
| `/api/v1/student/dashboard/university-finder/save-university` | `POST` | `saveUniversity(payload)` | Bookmarks target university to student account. |
| `/api/v1/student/dashboard/university-finder/save-university/:id` | `DELETE` | `unsaveUniversity(id)` | Red `×` button on university cards to remove saved items. |
| `/api/v1/student/dashboard/university-finder/recommendations` | `GET` | `getRecommendations()` | List of quiz recommendation sessions under Quiz Sessions tab. |
| `/api/v1/student/dashboard/university-finder/recommendations` | `POST` | `saveRecommendation(payload)` | Archives quiz recommendation session results. |

---

### 3.2 Dashboard Tabbed Layout & Features

1. **Welcome Banner:**
   - Greeting `Welcome back, {full_name}! 👋`, plan tag (`Pro Scholar`), and live fire streak pill (`🔥 5 Day Streak`).
2. **Top KPI Performance Cards:**
   - *Tests Completed:* Completed count vs. total tests started.
   - *Overall Accuracy:* Overall accuracy percentage with question attempt metrics.
   - *Practice Time:* Total practice duration formatted in minutes.
   - *Correct Answers:* Total correct vs. wrong answers.
3. **Tabbed Section Views:**
   - **Tab 1: Overview & Recent Activity:** Displays subject accuracy progress bars (`progress-bar-fill`) and test activity items with score badges.
   - **Tab 2: Saved Target Universities:** Grid displaying university title, country name, tuition estimate, and a red `×` unsave button invoking `DELETE /save-university/:id`.
   - **Tab 3: Finder Quiz Sessions:** Card list showing quiz recommendation results with target country, budget range, and matched university tags.
   - **Tab 4: Saved Articles:** Grid of saved blog posts with titles, descriptions, and direct reading links.

---

## 4. Complete Application Workflows & Features

### 4.1 Authentication Workflow (`/auth/login`, `/auth/register`, `/auth/otp`)
- **Login Flow:** Student enters credentials at `/auth/login` or signs in with Google OAuth. Upon validation, JWT access and refresh tokens are saved in browser storage.
- **HTTP Interceptor:** `AuthInterceptor` automatically attaches `Authorization: Bearer <token>` to outbound requests and handles silent token refresh via `/auth/refresh-token`.
- **Protected Routes:** `AuthGuard` restricts access to `/dynamic/*` routes.

---

### 4.2 NEET Preparation Workflow (`/dynamic/neet`)
1. **Question of the Day (QOD) (`/dynamic/neet`):**
   - Renders a daily high-yield NEET question.
   - Selecting an answer submits `POST /qod/submit`, returning immediate correctness feedback, detailed explanation rationale, and updating the daily streak.
2. **NEET Quick Test (`/dynamic/neet/quick-test`):**
   - Configurable test modal where students choose subject filters (Biology, Physics, Chemistry), question count, and timed mode.
   - Submitting the test computes total score, correct/wrong/skipped counts, and logs results to `TestSession`.
3. **Previous Year Questions (PYQs) (`/dynamic/neet/previous-year-tests`):**
   - Filters exam papers by year and subject for focused revision.
4. **Performance Leaderboard (`/dynamic/neet/leaderboard`):**
   - Renders overall student ranks, percentile distributions, and subject accuracy heatmaps.

---

### 4.3 UCAT Examination Workflow (`/dynamic/ucat`)
1. **Subtest Practice & Full Mocks (`/dynamic/ucat/previous-year`):**
   - Simulates actual UCAT exam sections: Verbal Reasoning (VR), Decision Making (DM), Quantitative Reasoning (QR), Abstract Reasoning (AR), and Situational Judgement (SJT).
   - Real-time exam timer and question navigation grid.
2. **AI Performance Diagnostic Modal (`ucat-ai-insights-modal`):**
   - Displays AI-generated strength/weakness analysis and accuracy breakdown.
3. **UCAT AI Chat Support (`ucat-ai-chat-modal`):**
   - Interactive AI chat assistant providing instant question explanations and test strategy guidance.

---

### 4.4 CSE University Finder Workflow (`/dynamic/cse`)
1. **Country Selection (`/dynamic/cse`):**
   - Explores destination countries (Hungary, Georgia, UK, Kyrgyzstan, Kazakhstan, Russia) with tuition fee ranges and MCI/NMC recognition status.
2. **Interactive Recommendation Questionnaire (`/dynamic/cse/questionnaire`):**
   - Stepper wizard capturing academic scores, preferred budget, clinical facility preferences, and target regions.
3. **Recommendations Engine (`/dynamic/cse/recommendations`):**
   - Evaluates answers against university datasets to generate ranked recommendations with match percentages.
   - Includes a **Save University** button (`POST /save-university`) to bookmark target universities directly to the Student Dashboard.
4. **University Details Page (`/dynamic/cse/university/:id`):**
   - Deep dive into campus infrastructure, hostel costs, admission requirements, and clinical rotation hospital affiliations.

---

### 4.5 Blogs & Knowledge Feed Workflow (`/dynamic/blogs`)
1. **Medium-Style Home Feed (`/dynamic/blogs`):**
   - 2-Column layout featuring category tabs (For You, Featured), crisp article cards with titles, excerpts, dark obsidian-purple fallback image containers, comment counters, and bookmark ribbon buttons.
   - Sticky right column featuring **Staff Picks**, **Recommended Topics** pills with purple glow hover effects, and **Who to Follow** author profile cards.
2. **Article Detail Page (`/dynamic/blogs/:slug`):**
   - Renders article content blocks via `article-renderer`, reading progress bar (`reading-progress-bar`), video embeds (`video-section`), gallery grids (`gallery`), and FAQ accordions (`faq-section`).
3. **Interactive Comments (`/dynamic/blogs/:slug/comments`):**
   - Nested comment threads allowing students to read, post, and discuss medical topics.

---

### 4.6 Real-Time Student Chat & Community Workflow (`/dynamic/chat`)
1. **Component & Service Architecture:**
   - Component: [StudentChat](file:///Users/sajay/Documents/frontend-mvp/mbbs-front-end/src/app/dynamic/chat/student-chat.ts) (`src/app/dynamic/chat/student-chat.ts`, `student-chat.html`, `student-chat.scss`)
   - Service: [StudentChatService](file:///Users/sajay/Documents/frontend-mvp/mbbs-front-end/src/app/dynamic/chat/services/student-chat.service.ts)
   - Route Path: `/dynamic/chat`
2. **Key Capabilities & API Binding:**
   - **System Chat Settings:** Checks global 1-to-1 direct chat status (`GET /api/v1/chat/settings`).
   - **Active Conversations List:** Fetches 1-to-1 direct chats and joined group threads (`GET /api/v1/chat/conversations?userId=...`).
   - **Public Communities Discovery:** Browses admin-created university, country, and batch groups (`GET /api/v1/chat/groups/public`) and allows students to join (`POST /api/v1/chat/group/join`).
   - **Direct 1-to-1 Messaging:** Initializes thread with fellow students (`POST /api/v1/chat/direct`).
   - **Message History & Composer:** Loads paginated message history (`GET /api/v1/chat/messages/:conversationId`) and sends text/emojis (`POST /api/v1/chat/messages`).
   - **Edit & Delete Messaging:** Allows students to edit (`PATCH /api/v1/chat/messages/:messageId`) or soft delete sent messages (`DELETE /api/v1/chat/messages/:messageId`).
   - **Search & Moderation:** Global message search (`GET /api/v1/chat/search?userId=...&q=...`), user blocking (`POST /api/v1/chat/block`), unblocking (`POST /api/v1/chat/unblock`), and reporting (`POST /api/v1/chat/report`).

---

### 4.7 Public Landing & Help Desk (`/dashboard`)
- Public marketing landing page ([dashboard.ts](file:///Users/sajay/Documents/frontend-mvp/mbbs-front-end/src/app/static/dashboard/dashboard.ts)) featuring University & NEET mega-menus, featured university logos, country cards, and an interactive contact support form that prepares a Gmail compose draft (`mbbs.net.official@gmail.com`).

---

## 5. Master API Endpoint Reference Map

| API Endpoint | HTTP Method | Feature Area | Description & UI Binding |
| :--- | :---: | :--- | :--- |
| `/api/v1/student/dashboard/summary` | `GET` | Dashboard | User greeting, plan tag, daily streak (`🔥 5 Day Streak`), performance summary. |
| `/api/v1/student/dashboard/stats` | `GET` | Dashboard | Top KPI cards (Tests completed, accuracy %, practice time, correct/wrong). |
| `/api/v1/student/dashboard/recent-activity` | `GET` | Dashboard | Paginated activity timeline under Overview tab. |
| `/api/v1/student/dashboard/saved-blogs` | `GET` | Dashboard | Saved Articles grid in Dashboard. |
| `/api/v1/student/dashboard/university-finder/saved-universities` | `GET` | Dashboard | Saved Target Universities grid in Dashboard. |
| `/api/v1/student/dashboard/university-finder/save-university` | `POST` | Dashboard | Bookmarks target university to dashboard. |
| `/api/v1/student/dashboard/university-finder/save-university/:id` | `DELETE` | Dashboard | Unsave `×` button on university cards. |
| `/api/v1/student/dashboard/university-finder/recommendations` | `GET` | Dashboard | Finder Quiz Sessions tab list. |
| `/api/v1/student/dashboard/university-finder/recommendations` | `POST` | Dashboard | Archives University Finder quiz result session. |
| `/api/v1/chat/settings` | `GET` | Student Chat | Checks global 1-to-1 direct chat system settings. |
| `/api/v1/chat/conversations` | `GET` | Student Chat | Fetches list of active conversations for student. |
| `/api/v1/chat/groups/public` | `GET` | Student Chat | Browses available public community groups. |
| `/api/v1/chat/group/join` | `POST` | Student Chat | Student joins an admin-created community group. |
| `/api/v1/chat/direct` | `POST` | Student Chat | Initializes 1-to-1 direct chat thread. |
| `/api/v1/chat/messages/:conversationId` | `GET` | Student Chat | Loads paginated conversation message history. |
| `/api/v1/chat/messages` | `POST` | Student Chat | Sends text/emoji message in a conversation. |
| `/api/v1/chat/messages/:messageId` | `PATCH` | Student Chat | Edits sent message content. |
| `/api/v1/chat/messages/:messageId` | `DELETE` | Student Chat | Soft deletes sent message. |
| `/api/v1/chat/search` | `GET` | Student Chat | Searches messages across student conversations. |
| `/api/v1/chat/block` | `POST` | Student Chat | Blocks a user from direct messaging. |
| `/api/v1/chat/unblock` | `POST` | Student Chat | Unblocks a user. |
| `/api/v1/chat/blocked` | `GET` | Student Chat | Gets list of blocked users. |
| `/api/v1/chat/report` | `POST` | Student Chat | Reports an inappropriate message or user. |
| `/api/v1/pages/home` | `GET` | Blogs | Main blog feed articles, categories, and staff picks. |
| `/api/v1/blogs/:id/bookmark` | `POST` | Blogs | Bookmarks blog post for student account. |
| `/api/v1/auth/login` | `POST` | Auth | Authenticates student and returns JWT tokens. |
| `/api/v1/qod/today` | `GET` | NEET | Retrieves today's Question of the Day. |
| `/api/v1/qod/submit` | `POST` | NEET | Submits QOD answer and updates streak. |

---

## 6. Verification & Execution

- **Local Dev Server:** `http://localhost:4200/dynamic/chat`
- **Build Status:** Verified compilation clean (`HTTP/1.1 200 OK`).
- **GitHub Repository:** `https://github.com/mbbsnetofficial-commits/mbbs-front-end.git`.
