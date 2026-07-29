export const API = {

  AUTH: {
    REGISTER: '/auth/sign-up',
    VERIFY_OTP: '/auth/sign-up/verify-otp',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token'
  },

  QOD: {
    GET_QUESTION: '/question-of-the-day',
    SUBMIT_ANSWER: '/question-of-the-day/submit'
  },

  TEST: {
    SUBJECTS: '/test/subjects',
    CHAPTERS: '/test/chapters',
    TOPICS: '/test/topics',
    START: '/test/start',
    SUBMIT: '/test/submit',
    SESSIONS: '/test/sessions',
    LEADERBOARD: '/test/leaderboard'
  },

  PREVIOUS_YEAR_TEST: {
    PAPERS: '/previous-year-tests',
    SUBMIT: '/previous-year-tests/submit'
  },

  CHAT: {
    SESSIONS: '/chat-sessions',
    ZONE_INSIGHTS: '/test-subject-zone-insights'
  }
};
